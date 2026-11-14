using System;
using System.Collections.Generic;
using System.Linq;
using FC2026.World;

namespace FC2026.Core
{
    /// <summary>
    /// Transfer market and contracts for the worldwide career. The generated
    /// squads stay authoritative; the save only stores one recent move per
    /// player plus the managed squad's contract end dates, so clubs and players
    /// are rebuilt deterministically on every launch. The market covers the
    /// managed division, free agents and cross-border scouting, and AI clubs in
    /// the managed division run a deterministic transfer window each season.
    /// </summary>
    public static class CareerTransferSystem
    {
        public const int MaxSquadSize = 26;
        public const int MinimumSquadSize = 12;
        public const int ContractYears = 3;
        public const int MaxStoredMoves = 2048;
        public const int MaxAiMovesPerWindow = 24;
        public const int MaxTransferSummaryLength = 200;
        private const int DomesticPremiumPercent = 15;
        private const int ForeignBasePremiumPercent = 20;
        private const int ForeignPremiumPerStrength = 5;

        // The cache is only valid for the loaded career; every mutation and
        // every career load calls Invalidate.
        private static readonly Dictionary<string, WorldPlayer[]> SquadCache = new(StringComparer.Ordinal);

        public static void Invalidate()
        {
            SquadCache.Clear();
        }

        public static WorldPlayer[] GetSquad(CareerSaveData save, string clubId)
        {
            if (string.IsNullOrEmpty(clubId))
                return Array.Empty<WorldPlayer>();
            if (SquadCache.TryGetValue(clubId, out var cached))
                return cached;

            var origin = WorldDatabase.GetSquad(clubId);
            var resolved = new List<WorldPlayer>(origin.Length + 4);
            var present = new HashSet<string>(StringComparer.Ordinal);

            foreach (var player in origin)
            {
                if (player == null || !present.Add(player.Id))
                    continue;
                if (save != null && IsMovedAway(save, player.Id, clubId))
                    continue;
                resolved.Add(player);
            }

            if (save?.playerMoves != null)
            {
                foreach (var move in save.playerMoves)
                {
                    if (move == null || move.clubId != clubId || string.IsNullOrEmpty(move.playerId))
                        continue;
                    if (!present.Add(move.playerId))
                        continue;

                    var player = WorldDatabase.GetPlayer(move.playerId);
                    if (player != null)
                        resolved.Add(player);
                }
            }

            var ordered = resolved
                .OrderBy(player => player.Position)
                .ThenByDescending(player => player.Overall)
                .ThenBy(player => player.Name, StringComparer.Ordinal)
                .ToArray();

            // Copy before renumbering so the generated world objects stay intact.
            var squad = new WorldPlayer[ordered.Length];
            for (var i = 0; i < ordered.Length; i++)
            {
                squad[i] = Clone(ordered[i]);
                squad[i].ShirtNumber = i + 1;
            }

            SquadCache[clubId] = squad;
            return squad;
        }

        public static string ClubOf(CareerSaveData save, string playerId)
        {
            var move = LatestMove(save, playerId);
            if (move != null)
                return move.clubId ?? string.Empty;

            var player = WorldDatabase.GetPlayer(playerId);
            return player?.ClubId ?? string.Empty;
        }

        public static bool IsFreeAgent(CareerSaveData save, string playerId)
        {
            var move = LatestMove(save, playerId);
            return move != null && string.IsNullOrEmpty(move.clubId);
        }

        public static int MarketValue(WorldPlayer player)
        {
            if (player == null)
                return 0;

            var core = Math.Max(1, player.Overall - 38);
            var value = core * core * 12000.0;
            value *= PositionFactor(player.Position);
            value *= AgeFactor(player.Age);
            var rounded = (int)Math.Round(value / 25000.0) * 25000;
            return Math.Max(25000, rounded);
        }

        public static int Wage(WorldPlayer player)
        {
            if (player == null)
                return 0;
            var wage = (int)Math.Round(MarketValue(player) / 900.0 / 100.0) * 100;
            return Math.Max(500, wage);
        }

        public static int PriceFor(CareerSaveData save, string playerId)
        {
            var player = WorldDatabase.GetPlayer(playerId);
            if (player == null)
                return 0;
            if (IsFreeAgent(save, playerId))
                return 0;

            var value = MarketValue(player);
            return value + value * PremiumPercent(save, playerId) / 100;
        }

        /// <summary>
        /// Domestic signings pay the 15% selling premium. Players owned by a
        /// club in another division add a scouting premium scaled by that
        /// country's strength (25% at strength 1 up to 45% at strength 5).
        /// </summary>
        public static int PremiumPercent(CareerSaveData save, string playerId)
        {
            var club = WorldDatabase.GetClub(ClubOf(save, playerId));
            if (save == null || club == null || club.LeagueId == save.leagueId)
                return DomesticPremiumPercent;

            var country = WorldDatabase.GetCountry(club.CountryId);
            var strength = country == null ? 2 : country.Strength;
            return ForeignBasePremiumPercent + strength * ForeignPremiumPerStrength;
        }

        public static bool IsForeignPlayer(CareerSaveData save, string playerId)
        {
            var club = WorldDatabase.GetClub(ClubOf(save, playerId));
            return save != null && club != null && club.LeagueId != save.leagueId;
        }

        public static int WageBill(CareerSaveData save)
        {
            if (save == null)
                return 0;

            var total = 0;
            foreach (var player in GetSquad(save, save.managedClubId))
                total += Wage(player);
            return total;
        }

        public static int WageBudget(WorldClub club)
        {
            var strength = club == null ? 50 : Math.Max(30, club.Strength);
            return (strength - 30) * (strength - 30) * 260 + 100000;
        }

        public static bool SignPlayer(CareerSaveData save, string playerId, out string message)
        {
            message = string.Empty;
            var player = WorldDatabase.GetPlayer(playerId);
            var club = CareerLeagueSystem.GetManagedClub(save);
            if (save == null || player == null || club == null)
            {
                message = "That player could not be found.";
                return false;
            }

            if (ClubOf(save, playerId) == save.managedClubId)
            {
                message = player.Name + " is already in your squad.";
                return false;
            }

            var squad = GetSquad(save, save.managedClubId);
            if (squad.Length >= MaxSquadSize)
            {
                message = $"Your squad is full ({MaxSquadSize} players).";
                return false;
            }

            var price = PriceFor(save, playerId);
            if (price > save.transferBudget)
            {
                message = $"Not enough budget for {player.Name} ({FormatMoney(price)}).";
                return false;
            }

            var wage = Wage(player);
            if (WageBill(save) + wage > WageBudget(club))
            {
                message = "The wage budget cannot absorb another contract.";
                return false;
            }

            save.transferBudget -= price;
            RecordMove(save, playerId, save.managedClubId, price);
            SetContract(save, playerId, save.season + ContractYears);
            Invalidate();
            message = price > 0
                ? $"{player.Name} signed for {FormatMoney(price)}."
                : $"{player.Name} joined on a free transfer.";
            return true;
        }

        public static bool SellPlayer(CareerSaveData save, string playerId, out string message)
        {
            message = string.Empty;
            if (!TryGetOwnedPlayer(save, playerId, out var player, out message))
                return false;

            var buyer = PickBuyer(save, playerId);
            if (buyer == null)
            {
                message = "No club is interested right now.";
                return false;
            }

            var fee = MarketValue(player);
            RecordMove(save, playerId, buyer.Id, fee);
            RemoveContract(save, playerId);
            save.transferBudget += fee;
            Invalidate();
            message = $"{player.Name} sold to {buyer.Name} for {FormatMoney(fee)}.";
            return true;
        }

        public static bool ReleasePlayer(CareerSaveData save, string playerId, out string message)
        {
            message = string.Empty;
            if (!TryGetOwnedPlayer(save, playerId, out var player, out message))
                return false;

            RecordMove(save, playerId, string.Empty, 0);
            RemoveContract(save, playerId);
            Invalidate();
            message = $"{player.Name} released on a free transfer.";
            return true;
        }

        public static bool RenewContract(CareerSaveData save, string playerId, out string message)
        {
            message = string.Empty;
            if (!TryGetOwnedPlayer(save, playerId, out var player, out message))
                return false;

            var expiry = Math.Max(save.season, ContractExpiry(save, playerId)) + ContractYears;
            SetContract(save, playerId, expiry);
            Invalidate();
            message = $"{player.Name} renewed until season {expiry}.";
            return true;
        }

        public static int ContractExpiry(CareerSaveData save, string playerId)
        {
            if (save?.contracts == null)
                return 0;

            var found = 0;
            for (var i = 0; i < save.contracts.Length; i++)
            {
                var contract = save.contracts[i];
                if (contract != null && contract.playerId == playerId)
                    found = Math.Max(found, contract.expirySeason);
            }
            return found;
        }

        public static TransferTarget[] GetMarket(CareerSaveData save)
        {
            var targets = new List<TransferTarget>(WorldDatabase.PlayersPerClub * 16);
            if (save == null)
                return Array.Empty<TransferTarget>();

            var clubs = WorldDatabase.GetLeagueClubs(save.leagueId);
            foreach (var club in clubs)
            {
                if (club.Id == save.managedClubId)
                    continue;

                foreach (var player in GetSquad(save, club.Id))
                {
                    targets.Add(new TransferTarget
                    {
                        Player = player,
                        ClubId = club.Id,
                        Price = PriceFor(save, player.Id),
                        Wage = Wage(player)
                    });
                }
            }

            if (save.playerMoves != null)
            {
                foreach (var move in save.playerMoves)
                {
                    if (move == null || !string.IsNullOrEmpty(move.clubId) || string.IsNullOrEmpty(move.playerId))
                        continue;
                    var player = WorldDatabase.GetPlayer(move.playerId);
                    if (player == null)
                        continue;
                    targets.Add(new TransferTarget
                    {
                        Player = player,
                        ClubId = string.Empty,
                        Price = 0,
                        Wage = Wage(player)
                    });
                }
            }

            return targets
                .OrderByDescending(target => target.Player.Overall)
                .ThenBy(target => target.Player.Name, StringComparer.Ordinal)
                .ToArray();
        }

        /// <summary>
        /// Cross-border scouting: the current squad of any club outside the
        /// managed one, priced with the foreign premium so the hub can offer
        /// signings from other divisions and continents.
        /// </summary>
        public static TransferTarget[] GetScoutSquad(CareerSaveData save, string clubId)
        {
            if (save == null || string.IsNullOrEmpty(clubId) || clubId == save.managedClubId)
                return Array.Empty<TransferTarget>();

            var club = WorldDatabase.GetClub(clubId);
            if (club == null)
                return Array.Empty<TransferTarget>();

            var squad = GetSquad(save, clubId);
            var targets = new TransferTarget[squad.Length];
            for (var i = 0; i < squad.Length; i++)
            {
                var player = squad[i];
                targets[i] = new TransferTarget
                {
                    Player = player,
                    ClubId = club.Id,
                    Price = PriceFor(save, player.Id),
                    Wage = Wage(player)
                };
            }

            return targets
                .OrderByDescending(target => target.Player.Overall)
                .ThenBy(target => target.Player.Name, StringComparer.Ordinal)
                .ToArray();
        }

        /// <summary>
        /// Fills in contract end dates for the managed squad. Generated players
        /// get a deterministic 1-3 season deal so every career starts with a
        /// spread of expiring contracts.
        /// </summary>
        public static void EnsureContracts(CareerSaveData save)
        {
            if (save == null)
                return;

            var squad = GetSquad(save, save.managedClubId);
            var expiries = new Dictionary<string, int>(StringComparer.Ordinal);
            if (save.contracts != null)
            {
                foreach (var contract in save.contracts)
                {
                    if (contract == null || string.IsNullOrEmpty(contract.playerId))
                        continue;
                    expiries[contract.playerId] = expiries.TryGetValue(contract.playerId, out var known)
                        ? Math.Max(known, contract.expirySeason)
                        : contract.expirySeason;
                }
            }

            // Rebuilt in squad order so the save stays stable between writes,
            // and so contracts for sold players are dropped automatically.
            var contracts = new CareerContract[squad.Length];
            for (var i = 0; i < squad.Length; i++)
            {
                var playerId = squad[i].Id;
                contracts[i] = new CareerContract
                {
                    playerId = playerId,
                    expirySeason = expiries.TryGetValue(playerId, out var expiry)
                        ? Math.Max(save.season, expiry)
                        : save.season + 1 + WorldHash.Index(playerId + "|contract", 3)
                };
            }

            save.contracts = contracts;
        }

        /// <summary>
        /// Runs once per season at rollover. AI clubs in the managed division
        /// make a bounded, deterministic set of transfers: sales inside the
        /// division, cross-border purchases, and releases. The managed squad is
        /// never touched. The move log stays compact because it stores one row
        /// per player, so the save does not grow with the number of windows.
        /// </summary>
        public static void ProcessAiTransferWindow(CareerSaveData save)
        {
            if (save == null)
                return;

            var clubs = WorldDatabase.GetLeagueClubs(save.leagueId)
                .Where(club => club.Id != save.managedClubId)
                .ToArray();

            save.lastTransferSummary = string.Empty;
            if (clubs.Length == 0)
                return;

            var seed = unchecked((uint)(save.worldSeed * 397
                                        ^ save.season * 7919
                                        ^ WorldHash.Combine(save.leagueId)));
            var random = new DeterministicRandom(seed);
            var moves = 0;
            var headline = string.Empty;
            var headlineFee = 0;

            foreach (var club in clubs)
            {
                var sales = random.Range(0, 3);
                for (var i = 0; i < sales && moves < MaxAiMovesPerWindow; i++)
                {
                    if (!TryAiSell(save, club, random, ref moves))
                        break;
                }

                var signings = random.Range(0, 3);
                for (var i = 0; i < signings && moves < MaxAiMovesPerWindow; i++)
                {
                    if (!TryAiBuy(save, club, random, ref moves, ref headline, ref headlineFee))
                        break;
                }
            }

            Invalidate();
            save.lastTransferSummary = moves == 0
                ? "No AI transfer activity this window."
                : headline.Length > 0
                    ? $"AI window: {moves} moves  •  {headline}"
                    : $"AI window: {moves} moves.";
        }

        private static bool TryAiSell(CareerSaveData save, WorldClub club, DeterministicRandom random, ref int moves)
        {
            Invalidate();
            var squad = GetSquad(save, club.Id);
            if (squad.Length <= MinimumSquadSize)
                return false;

            var keepers = 0;
            var candidates = new List<WorldPlayer>(squad.Length);
            foreach (var player in squad)
            {
                if (player.Position == PlayerPosition.Goalkeeper)
                    keepers++;
                if (LatestMove(save, player.Id)?.season == save.season)
                    continue;
                candidates.Add(player);
            }

            if (candidates.Count == 0)
                return false;

            var seller = candidates[random.Range(0, candidates.Count)];
            if (seller.Position == PlayerPosition.Goalkeeper && keepers <= 1)
                return false;

            var seed = seller.Id + "|ai-sell|" + save.season;
            WorldClub buyer = null;
            if (random.Range(0, 100) < 60)
                buyer = PickDomesticBuyer(save, seed, club.Id);
            buyer ??= PickForeignBuyer(save, seed);
            if (buyer == null)
                return false;

            RecordMove(save, seller.Id, buyer.Id, MarketValue(seller));
            Invalidate();
            moves++;
            return true;
        }

        private static bool TryAiBuy(CareerSaveData save, WorldClub club, DeterministicRandom random,
            ref int moves, ref string headline, ref int headlineFee)
        {
            Invalidate();
            if (GetSquad(save, club.Id).Length >= MaxSquadSize)
                return false;

            for (var attempt = 0; attempt < 6; attempt++)
            {
                var sellerClub = PickForeignClub(save, random);
                if (sellerClub == null)
                    continue;

                Invalidate();
                var squad = GetSquad(save, sellerClub.Id);
                if (squad.Length <= MinimumSquadSize)
                    continue;

                var player = squad[random.Range(0, squad.Length)];
                if (player.Position == PlayerPosition.Goalkeeper &&
                    squad.Count(item => item.Position == PlayerPosition.Goalkeeper) <= 1)
                    continue;
                if (LatestMove(save, player.Id)?.season == save.season)
                    continue;

                var fee = MarketValue(player);
                RecordMove(save, player.Id, club.Id, fee);
                Invalidate();
                moves++;

                if (fee > headlineFee)
                {
                    headlineFee = fee;
                    headline = $"{player.Name}: {sellerClub.ShortName} → {club.ShortName} ({FormatMoney(fee)})";
                }
                return true;
            }

            return false;
        }

        private static WorldClub PickForeignClub(CareerSaveData save, DeterministicRandom random)
        {
            var countries = WorldDatabase.GetCountries();
            for (var attempt = 0; attempt < 6; attempt++)
            {
                var country = countries[random.Range(0, countries.Count)];
                var league = country == null ? null : WorldDatabase.GetLeagueForCountry(country.Id);
                if (league == null || league.Id == save.leagueId)
                    continue;

                var clubs = WorldDatabase.GetLeagueClubs(league.Id);
                if (clubs.Length > 0)
                    return clubs[random.Range(0, clubs.Length)];
            }
            return null;
        }

        /// <summary>
        /// Runs at the end of a season, before the season counter advances.
        /// Expired contracts are not renewed and the player leaves on a free
        /// transfer, unless that would drop the squad below the minimum size or
        /// leave it without a goalkeeper.
        /// </summary>
        public static void ProcessSeasonChange(CareerSaveData save)
        {
            if (save == null)
                return;

            EnsureContracts(save);
            var squad = GetSquad(save, save.managedClubId);
            var expiring = squad
                .Where(player => ContractExpiry(save, player.Id) <= save.season)
                .OrderBy(player => player.Overall)
                .ThenBy(player => player.Name, StringComparer.Ordinal)
                .ToArray();

            var remaining = squad.Length;
            var keepers = squad.Count(player => player.Position == PlayerPosition.Goalkeeper);
            foreach (var player in expiring)
            {
                if (remaining - 1 < MinimumSquadSize)
                    break;
                if (player.Position == PlayerPosition.Goalkeeper && keepers - 1 < 1)
                    continue;

                remaining--;
                if (player.Position == PlayerPosition.Goalkeeper)
                    keepers--;
                RecordMove(save, player.Id, string.Empty, 0);
                RemoveContract(save, player.Id);
            }

            Invalidate();
            EnsureContracts(save);
        }

        public static void Normalize(CareerSaveData save)
        {
            if (save == null)
                return;

            save.playerMoves = CompactMoves(save.playerMoves);
            save.contracts ??= Array.Empty<CareerContract>();
            save.lastTransferSummary ??= string.Empty;
            if (save.lastTransferSummary.Length > MaxTransferSummaryLength)
                save.lastTransferSummary = save.lastTransferSummary.Substring(0, MaxTransferSummaryLength);
            Invalidate();
            EnsureContracts(save);
        }

        public static bool DataIsValid(CareerSaveData save)
        {
            if (save == null || save.playerMoves == null || save.contracts == null)
                return false;
            if (save.playerMoves.Length > MaxStoredMoves || save.contracts.Length > MaxSquadSize)
                return false;
            if (!string.IsNullOrEmpty(save.lastTransferSummary) &&
                save.lastTransferSummary.Length > MaxTransferSummaryLength)
            {
                return false;
            }

            var movedPlayers = new HashSet<string>(StringComparer.Ordinal);
            foreach (var move in save.playerMoves)
            {
                if (move == null || string.IsNullOrEmpty(move.playerId) || !movedPlayers.Add(move.playerId))
                    return false;
                if (move.season < 0 || move.fee < 0)
                    return false;
                if (WorldDatabase.GetPlayer(move.playerId) == null)
                    return false;
                if (!string.IsNullOrEmpty(move.clubId) && WorldDatabase.GetClub(move.clubId) == null)
                    return false;
            }

            var contractedPlayers = new HashSet<string>(StringComparer.Ordinal);
            foreach (var contract in save.contracts)
            {
                if (contract == null || string.IsNullOrEmpty(contract.playerId) ||
                    !contractedPlayers.Add(contract.playerId))
                {
                    return false;
                }
                if (contract.expirySeason < save.season)
                    return false;
                if (ClubOf(save, contract.playerId) != save.managedClubId)
                    return false;
            }

            return true;
        }

        private static bool TryGetOwnedPlayer(CareerSaveData save, string playerId, out WorldPlayer player,
            out string message)
        {
            message = string.Empty;
            player = WorldDatabase.GetPlayer(playerId);
            if (save == null || player == null)
            {
                message = "That player could not be found.";
                return false;
            }

            if (ClubOf(save, playerId) != save.managedClubId)
            {
                message = player.Name + " is not in your squad.";
                return false;
            }

            var squad = GetSquad(save, save.managedClubId);
            if (squad.Length <= MinimumSquadSize)
            {
                message = $"Your squad must keep at least {MinimumSquadSize} players.";
                return false;
            }

            if (player.Position == PlayerPosition.Goalkeeper &&
                squad.Count(item => item.Position == PlayerPosition.Goalkeeper) <= 1)
            {
                message = "You must keep at least one goalkeeper.";
                return false;
            }

            return true;
        }

        private static WorldClub PickBuyer(CareerSaveData save, string playerId)
        {
            var seed = playerId + "|buyer|" + save.season;
            if (WorldHash.Index(seed, 100) < 60)
            {
                var domestic = PickDomesticBuyer(save, seed, string.Empty);
                if (domestic != null)
                    return domestic;
            }

            return PickForeignBuyer(save, seed);
        }

        private static WorldClub PickDomesticBuyer(CareerSaveData save, string seed, string excludedClubId)
        {
            var buyers = WorldDatabase.GetLeagueClubs(save.leagueId)
                .Where(club => club.Id != save.managedClubId
                               && club.Id != excludedClubId
                               && GetSquad(save, club.Id).Length < MaxSquadSize)
                .ToArray();
            return buyers.Length == 0 ? null : buyers[WorldHash.Index(seed + "|domestic", buyers.Length)];
        }

        private static WorldClub PickForeignBuyer(CareerSaveData save, string seed)
        {
            var countries = WorldDatabase.GetCountries();
            for (var attempt = 0; attempt < 8; attempt++)
            {
                var country = countries[WorldHash.Index(seed + "|country|" + attempt, countries.Count)];
                var league = country == null ? null : WorldDatabase.GetLeagueForCountry(country.Id);
                if (league == null || league.Id == save.leagueId)
                    continue;

                var clubs = WorldDatabase.GetLeagueClubs(league.Id);
                if (clubs.Length == 0)
                    continue;

                var club = clubs[WorldHash.Index(seed + "|club|" + attempt, clubs.Length)];
                if (club != null && GetSquad(save, club.Id).Length < MaxSquadSize)
                    return club;
            }
            return null;
        }

        private static bool IsMovedAway(CareerSaveData save, string playerId, string clubId)
        {
            var move = LatestMove(save, playerId);
            return move != null && move.clubId != clubId;
        }

        private static CareerPlayerMove LatestMove(CareerSaveData save, string playerId)
        {
            if (save?.playerMoves == null || string.IsNullOrEmpty(playerId))
                return null;

            for (var i = save.playerMoves.Length - 1; i >= 0; i--)
            {
                var move = save.playerMoves[i];
                if (move != null && move.playerId == playerId)
                    return move;
            }
            return null;
        }

        private static void RecordMove(CareerSaveData save, string playerId, string clubId, int fee)
        {
            var moves = save.playerMoves ?? Array.Empty<CareerPlayerMove>();
            for (var i = moves.Length - 1; i >= 0; i--)
            {
                if (moves[i] == null || moves[i].playerId != playerId)
                    continue;
                moves[i].clubId = clubId;
                moves[i].season = save.season;
                moves[i].fee = fee;
                save.playerMoves = moves;
                return;
            }

            var extended = new CareerPlayerMove[moves.Length + 1];
            Array.Copy(moves, extended, moves.Length);
            extended[moves.Length] = new CareerPlayerMove
            {
                playerId = playerId,
                clubId = clubId,
                season = save.season,
                fee = fee
            };
            save.playerMoves = extended;
        }

        private static void SetContract(CareerSaveData save, string playerId, int expirySeason)
        {
            var contracts = save.contracts ?? Array.Empty<CareerContract>();
            for (var i = 0; i < contracts.Length; i++)
            {
                if (contracts[i] == null || contracts[i].playerId != playerId)
                    continue;
                contracts[i].expirySeason = expirySeason;
                save.contracts = contracts;
                return;
            }

            var extended = new CareerContract[contracts.Length + 1];
            Array.Copy(contracts, extended, contracts.Length);
            extended[contracts.Length] = new CareerContract
            {
                playerId = playerId,
                expirySeason = expirySeason
            };
            save.contracts = extended;
        }

        private static void RemoveContract(CareerSaveData save, string playerId)
        {
            if (save?.contracts == null)
                return;

            save.contracts = save.contracts
                .Where(contract => contract != null && contract.playerId != playerId)
                .ToArray();
        }

        private static CareerPlayerMove[] CompactMoves(CareerPlayerMove[] moves)
        {
            if (moves == null || moves.Length == 0)
                return Array.Empty<CareerPlayerMove>();

            var seen = new HashSet<string>(StringComparer.Ordinal);
            var kept = new List<CareerPlayerMove>(moves.Length);
            for (var i = moves.Length - 1; i >= 0; i--)
            {
                var move = moves[i];
                if (move == null || string.IsNullOrEmpty(move.playerId) || !seen.Add(move.playerId))
                    continue;
                kept.Add(new CareerPlayerMove
                {
                    playerId = move.playerId,
                    clubId = move.clubId ?? string.Empty,
                    season = Math.Max(0, move.season),
                    fee = Math.Max(0, move.fee)
                });
            }

            kept.Reverse();
            return kept.ToArray();
        }

        private static WorldPlayer Clone(WorldPlayer source)
        {
            return new WorldPlayer
            {
                Id = source.Id,
                ClubId = source.ClubId,
                Name = source.Name,
                Position = source.Position,
                ShirtNumber = source.ShirtNumber,
                Age = source.Age,
                Overall = source.Overall,
                Pace = source.Pace,
                Shooting = source.Shooting,
                Passing = source.Passing,
                Defending = source.Defending,
                Physical = source.Physical,
                HeightCm = source.HeightCm,
                LeftFooted = source.LeftFooted,
                SkinTone = source.SkinTone,
                HairColor = source.HairColor,
                HairStyle = source.HairStyle,
                FaceVariant = source.FaceVariant
            };
        }

        private static double PositionFactor(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => 0.9,
                PlayerPosition.Defender => 1.0,
                PlayerPosition.Midfielder => 1.1,
                _ => 1.15
            };
        }

        private static double AgeFactor(int age)
        {
            if (age <= 20)
                return 1.4;
            if (age <= 23)
                return 1.3;
            if (age <= 26)
                return 1.15;
            if (age <= 29)
                return 1.0;
            if (age <= 31)
                return 0.85;
            if (age <= 33)
                return 0.7;
            return 0.5;
        }

        public static string FormatMoney(int value)
        {
            if (value >= 1000000)
                return (value / 1000000f).ToString("0.#") + "M";
            if (value >= 1000)
                return (value / 1000f).ToString("0.#") + "K";
            return value.ToString();
        }
    }

    public sealed class TransferTarget
    {
        public WorldPlayer Player;
        public string ClubId = string.Empty;
        public int Price;
        public int Wage;
    }
}
