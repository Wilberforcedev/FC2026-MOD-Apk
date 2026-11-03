using System;
using System.Collections.Generic;
using FC2026.World;

namespace FC2026.Core
{
    public sealed class CareerCupTie
    {
        public int Round;
        public string HomeClubId = string.Empty;
        public string AwayClubId = string.Empty;

        public bool IsValid => !string.IsNullOrEmpty(HomeClubId) && !string.IsNullOrEmpty(AwayClubId);

        public bool Involves(string clubId)
        {
            return !string.IsNullOrEmpty(clubId) && (HomeClubId == clubId || AwayClubId == clubId);
        }

        public string OpponentFor(string clubId)
        {
            if (HomeClubId == clubId)
                return AwayClubId;
            if (AwayClubId == clubId)
                return HomeClubId;
            return string.Empty;
        }
    }

    public readonly struct CareerShootout
    {
        public readonly int UserScore;
        public readonly int OpponentScore;

        public CareerShootout(int userScore, int opponentScore)
        {
            UserScore = userScore;
            OpponentScore = opponentScore;
        }

        public bool UserWon => UserScore > OpponentScore;
    }

    /// <summary>
    /// Deterministic national knockout cup. Every club in the managed division
    /// enters; the bracket is regenerated from the world seed and season, so only
    /// the user's own results need to be saved. Cup ties are played after the
    /// league fixture of the same week.
    /// </summary>
    public static class CareerCupSystem
    {
        public const int Rounds = 4;
        public const int MaxHonours = 24;

        private static readonly int[] RoundWeeks = { 8, 16, 24, 30 };

        public static bool IsCupWeek(int matchweek)
        {
            return RoundForWeek(matchweek) > 0;
        }

        public static int RoundForWeek(int matchweek)
        {
            var index = Array.IndexOf(RoundWeeks, matchweek);
            return index < 0 ? 0 : index + 1;
        }

        public static int WeekForRound(int round)
        {
            return round >= 1 && round <= Rounds ? RoundWeeks[round - 1] : 0;
        }

        public static string RoundName(int round)
        {
            switch (round)
            {
                case 1: return "ROUND OF 16";
                case 2: return "QUARTER-FINAL";
                case 3: return "SEMI-FINAL";
                case 4: return "FINAL";
                default: return string.Empty;
            }
        }

        public static string ShortRoundName(int round)
        {
            switch (round)
            {
                case 1: return "R16";
                case 2: return "QF";
                case 3: return "SF";
                case 4: return "FINAL";
                default: return string.Empty;
            }
        }

        public static string CompetitionName(CareerSaveData save)
        {
            var league = save == null ? null : WorldDatabase.GetLeague(save.leagueId);
            var country = league == null ? null : WorldDatabase.GetCountry(league.CountryId);
            return (country != null ? country.Name : "National") + " Cup";
        }

        public static bool UserIsInCup(CareerSaveData save)
        {
            return save != null && save.cupRound > 0;
        }

        public static int PlayedRounds(CareerSaveData save)
        {
            if (save == null || save.cupOpponentIds == null)
                return 0;

            var played = 0;
            var limit = Math.Min(save.cupOpponentIds.Length, Rounds);
            for (var i = 0; i < limit; i++)
            {
                if (!string.IsNullOrEmpty(save.cupOpponentIds[i]))
                    played = i + 1;
            }
            return played;
        }

        /// <summary>Deterministic seeded draw used for the whole season.</summary>
        public static string[] BracketOrder(CareerSaveData save)
        {
            var clubs = WorldDatabase.GetLeagueClubs(save.leagueId);
            var order = new string[clubs.Length];
            for (var i = 0; i < clubs.Length; i++)
                order[i] = clubs[i].Id;

            var random = new DeterministicRandom(unchecked(
                (uint)save.worldSeed * 2654435761u ^ (uint)save.season * 40503u));
            for (var i = order.Length - 1; i > 0; i--)
            {
                var swap = random.Range(0, i + 1);
                var value = order[i];
                order[i] = order[swap];
                order[swap] = value;
            }
            return order;
        }

        /// <summary>The user's tie for the next round, or null when out or finished.</summary>
        public static CareerCupTie GetUserTie(CareerSaveData save)
        {
            if (save == null || save.cupRound < 1 || save.cupRound > Rounds)
                return null;

            var participants = BracketOrder(save);
            for (var round = 1; round <= Rounds; round++)
            {
                var ties = BuildRound(participants, round);
                CareerCupTie userTie = null;
                foreach (var tie in ties)
                {
                    if (tie.Involves(save.managedClubId))
                    {
                        userTie = tie;
                        break;
                    }
                }

                if (userTie == null)
                    return null;
                if (round == save.cupRound)
                    return userTie;

                var winners = new List<string>(ties.Count);
                foreach (var tie in ties)
                    winners.Add(ResolveRoundTie(save, tie, round));
                if (!winners.Contains(save.managedClubId))
                    return null;
                participants = winners.ToArray();
            }
            return null;
        }

        /// <summary>
        /// Records the user's cup score for the pending round (the tie follows
        /// the league fixture of the same week). Draws are settled on penalties.
        /// </summary>
        public static bool RecordUserResult(CareerSaveData save, int userGoals, int opponentGoals)
        {
            if (save == null || userGoals < 0 || opponentGoals < 0)
                return false;

            var tie = GetUserTie(save);
            if (tie == null)
                return false;

            var round = tie.Round;
            var index = round - 1;
            EnsureArrays(save);

            save.cupOpponentIds[index] = tie.OpponentFor(save.managedClubId);
            save.cupUserGoals[index] = userGoals;
            save.cupOpponentGoals[index] = opponentGoals;

            var shootout = new CareerShootout(0, 0);
            var userWon = userGoals > opponentGoals;
            if (userGoals == opponentGoals)
            {
                shootout = SimulateShootout(save, tie, round);
                userWon = shootout.UserWon;
            }
            save.cupUserPenalties[index] = shootout.UserScore;
            save.cupOpponentPenalties[index] = shootout.OpponentScore;

            save.cupPending = false;
            if (!userWon)
            {
                save.cupRound = 0;
            }
            else if (round >= Rounds)
            {
                save.cupRound = 0;
                save.cupChampionId = save.managedClubId;
            }
            else
            {
                save.cupRound = round + 1;
            }
            return true;
        }

        /// <summary>
        /// Wins the cup for the user, or simulates the rest of the bracket.
        /// Returns an empty id while the user still has a tie to play.
        /// </summary>
        public static string ResolveChampion(CareerSaveData save)
        {
            if (save == null)
                return string.Empty;

            var played = PlayedRounds(save);
            var participants = BracketOrder(save);
            for (var round = 1; round <= Rounds; round++)
            {
                var ties = BuildRound(participants, round);
                var winners = new List<string>(ties.Count);
                foreach (var tie in ties)
                {
                    // Never invent a result while the user still has this tie to play.
                    if (tie.Involves(save.managedClubId) && round > played && save.cupRound > 0)
                        return string.Empty;
                    winners.Add(ResolveRoundTie(save, tie, round));
                }
                participants = winners.ToArray();
            }
            return participants.Length == 1 ? participants[0] : string.Empty;
        }

        public static CareerShootout SimulateShootout(CareerSaveData save, CareerCupTie tie, int round)
        {
            if (save == null || tie == null || !tie.IsValid)
                return new CareerShootout(0, 0);

            var userClub = WorldDatabase.GetClub(save.managedClubId);
            var opponentClub = WorldDatabase.GetClub(tie.OpponentFor(save.managedClubId));
            var random = new DeterministicRandom(
                TieSeed(save, round, tie.HomeClubId, tie.AwayClubId) ^ 0x5F3759DFu);

            var userScore = 0;
            var opponentScore = 0;
            for (var kick = 0; kick < 5; kick++)
            {
                if (KickScores(random, userClub))
                    userScore++;
                if (KickScores(random, opponentClub))
                    opponentScore++;
            }

            var guard = 0;
            while (userScore == opponentScore && guard++ < 24)
            {
                if (KickScores(random, userClub))
                    userScore++;
                if (KickScores(random, opponentClub))
                    opponentScore++;
            }

            if (userScore == opponentScore)
                userScore++;
            return new CareerShootout(userScore, opponentScore);
        }

        public static void ResetForSeason(CareerSaveData save)
        {
            if (save == null)
                return;

            save.cupRound = 1;
            save.cupPending = false;
            save.cupChampionId = string.Empty;
            save.cupOpponentIds = new string[Rounds];
            save.cupUserGoals = new int[Rounds];
            save.cupOpponentGoals = new int[Rounds];
            save.cupUserPenalties = new int[Rounds];
            save.cupOpponentPenalties = new int[Rounds];
        }

        public static void Normalize(CareerSaveData save)
        {
            if (save == null)
                return;

            EnsureArrays(save);
            save.cupRound = Clamp(save.cupRound, 0, Rounds);
            for (var i = 0; i < Rounds; i++)
            {
                save.cupOpponentIds[i] ??= string.Empty;
                save.cupUserGoals[i] = Math.Max(0, save.cupUserGoals[i]);
                save.cupOpponentGoals[i] = Math.Max(0, save.cupOpponentGoals[i]);
                save.cupUserPenalties[i] = Math.Max(0, save.cupUserPenalties[i]);
                save.cupOpponentPenalties[i] = Math.Max(0, save.cupOpponentPenalties[i]);
            }

            if (save.cupRound > 0 && save.matchweek > WeekForRound(save.cupRound))
            {
                // The season has already passed this round; the run is over.
                save.cupRound = 0;
                save.cupPending = false;
            }

            if (save.cupPending && GetUserTie(save) == null)
                save.cupPending = false;

            save.honours = SanitizeHonours(save.honours);
        }

        public static string[] SanitizeHonours(string[] honours)
        {
            if (honours == null || honours.Length == 0)
                return Array.Empty<string>();

            var result = new List<string>(Math.Min(honours.Length, MaxHonours));
            foreach (var honour in honours)
            {
                if (string.IsNullOrEmpty(honour) || result.Contains(honour))
                    continue;
                result.Add(honour);
                if (result.Count >= MaxHonours)
                    break;
            }
            return result.ToArray();
        }

        private static string ResolveRoundTie(CareerSaveData save, CareerCupTie tie, int round)
        {
            var involvesUser = tie.Involves(save.managedClubId);
            if (involvesUser && round <= PlayedRounds(save))
            {
                var index = round - 1;
                var userGoals = save.cupUserGoals[index];
                var opponentGoals = save.cupOpponentGoals[index];
                if (userGoals != opponentGoals)
                    return userGoals > opponentGoals
                        ? save.managedClubId
                        : tie.OpponentFor(save.managedClubId);

                var userPenalties = save.cupUserPenalties[index];
                var opponentPenalties = save.cupOpponentPenalties[index];
                if (userPenalties != opponentPenalties)
                    return userPenalties > opponentPenalties
                        ? save.managedClubId
                        : tie.OpponentFor(save.managedClubId);

                var shootout = SimulateShootout(save, tie, round);
                return shootout.UserWon ? save.managedClubId : tie.OpponentFor(save.managedClubId);
            }

            return SimulateWinner(save, tie, round);
        }

        private static string SimulateWinner(CareerSaveData save, CareerCupTie tie, int round)
        {
            var home = WorldDatabase.GetClub(tie.HomeClubId);
            var away = WorldDatabase.GetClub(tie.AwayClubId);
            var seed = TieSeed(save, round, tie.HomeClubId, tie.AwayClubId);
            var score = WorldSimulation.Simulate(home, away, unchecked((int)seed));
            if (score.HomeGoals != score.AwayGoals)
                return score.HomeGoals > score.AwayGoals ? tie.HomeClubId : tie.AwayClubId;

            var random = new DeterministicRandom(seed ^ 0x9E3779B9u);
            var edge = ((home != null ? home.Strength : 60) - (away != null ? away.Strength : 60)) * 0.02f;
            return random.Value01 < Clamp01(0.5f + edge) ? tie.HomeClubId : tie.AwayClubId;
        }

        private static bool KickScores(DeterministicRandom random, WorldClub club)
        {
            var chance = 0.72f + ((club != null ? club.Strength : 60) - 60) * 0.004f;
            return random.Value01 < Clamp01(chance, 0.55f, 0.9f);
        }

        private static uint TieSeed(CareerSaveData save, int round, string homeId, string awayId)
        {
            var key = WorldHash.Combine(save.leagueId + "|" + round + "|" + homeId + "|" + awayId);
            return unchecked((uint)save.worldSeed * 2654435761u ^ (uint)save.season * 2246822519u ^ key);
        }

        private static List<CareerCupTie> BuildRound(string[] participants, int round)
        {
            var ties = new List<CareerCupTie>(participants.Length / 2);
            for (var i = 0; i + 1 < participants.Length; i += 2)
            {
                ties.Add(new CareerCupTie
                {
                    Round = round,
                    HomeClubId = participants[i],
                    AwayClubId = participants[i + 1]
                });
            }
            return ties;
        }

        private static void EnsureArrays(CareerSaveData save)
        {
            save.cupOpponentIds = Resize(save.cupOpponentIds, string.Empty);
            save.cupUserGoals = Resize(save.cupUserGoals, 0);
            save.cupOpponentGoals = Resize(save.cupOpponentGoals, 0);
            save.cupUserPenalties = Resize(save.cupUserPenalties, 0);
            save.cupOpponentPenalties = Resize(save.cupOpponentPenalties, 0);
        }

        private static T[] Resize<T>(T[] source, T fallback)
        {
            var result = new T[Rounds];
            for (var i = 0; i < Rounds; i++)
                result[i] = source != null && i < source.Length ? source[i] : fallback;
            return result;
        }

        private static int Clamp(int value, int minimum, int maximum)
        {
            return value < minimum ? minimum : value > maximum ? maximum : value;
        }

        private static float Clamp01(float value, float minimum = 0f, float maximum = 1f)
        {
            return value < minimum ? minimum : value > maximum ? maximum : value;
        }
    }
}
