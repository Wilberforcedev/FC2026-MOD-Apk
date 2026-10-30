using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    public enum TransferOfferStatus { Pending, Countered, Accepted, Rejected, Completed }

    [Serializable]
    public class TransferOffer
    {
        public string playerId;
        public string playerName;
        public int askingPrice;
        public int offeredFee;
        public int counterFee;
        public TransferOfferStatus status;
    }

    public sealed class TransferMarketManager : MonoBehaviour
    {
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private CareerManager career;
        [SerializeField] private TransferWindowManager transferWindow;
        [SerializeField] private string managedClubId;
        [SerializeField] private List<TransferOffer> offers = new();
        [SerializeField] private List<string> completedPlayerIds = new();

        public IReadOnlyList<TransferOffer> Offers => offers;
        public IReadOnlyList<WorldPlayerDefinition> ScoutingResults => database == null
            ? Array.Empty<WorldPlayerDefinition>()
            : database.players.Where(IsAvailable).OrderByDescending(x => x.overall).ToList();

        private void Awake()
        {
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            career ??= FindFirstObjectByType<CareerManager>();
            transferWindow ??= FindFirstObjectByType<TransferWindowManager>();
        }

        public void Configure(FootballWorldDatabase worldDatabase, CareerManager careerManager, string clubId)
        {
            Configure(worldDatabase, careerManager, clubId, transferWindow);
        }

        public void Configure(FootballWorldDatabase worldDatabase, CareerManager careerManager, string clubId,
            TransferWindowManager windowManager)
        {
            database = worldDatabase;
            career = careerManager;
            managedClubId = clubId;
            transferWindow = windowManager;
        }

        public bool IsTransferWindowOpen => transferWindow == null || transferWindow.IsWindowOpen;
        public string TransferWindowStatus => transferWindow == null ? "TRANSFER WINDOW UNCONFIGURED" : transferWindow.StatusLabel;

        public IReadOnlyList<WorldPlayerDefinition> Scout(string searchTerm = "", string position = null, int minimumOverall = 1)
        {
            if (database == null) return Array.Empty<WorldPlayerDefinition>();
            var query = database.players.Where(IsAvailable).Where(x => x.overall >= Mathf.Clamp(minimumOverall, 1, 99));
            if (!string.IsNullOrWhiteSpace(searchTerm))
                query = query.Where(x => (x.displayName ?? "").IndexOf(searchTerm, StringComparison.OrdinalIgnoreCase) >= 0);
            if (!string.IsNullOrWhiteSpace(position))
                query = query.Where(x => string.Equals(x.position, position, StringComparison.OrdinalIgnoreCase));
            return query.OrderByDescending(x => x.overall).ToList();
        }

        public TransferOffer MakeOffer(string playerId, int fee)
        {
            var target = database?.FindPlayer(playerId);
            if (!IsTransferWindowOpen || target == null || !IsAvailable(target) || fee <= 0) return null;
            var offer = new TransferOffer
            {
                playerId = target.id,
                playerName = target.displayName,
                askingPrice = SuggestedAskingPrice(target),
                offeredFee = fee,
                counterFee = fee >= SuggestedAskingPrice(target) ? 0 : Mathf.CeilToInt(SuggestedAskingPrice(target) * 1.1f),
                status = fee >= SuggestedAskingPrice(target) ? TransferOfferStatus.Accepted : TransferOfferStatus.Countered
            };
            offers.Add(offer);
            return offer;
        }

        public bool AcceptCounterOffer(TransferOffer offer)
        {
            if (offer == null || !offers.Contains(offer) || offer.status != TransferOfferStatus.Countered || offer.counterFee <= 0)
                return false;
            offer.offeredFee = offer.counterFee;
            offer.status = TransferOfferStatus.Accepted;
            return true;
        }

        public bool CompleteSigning(TransferOffer offer, int weeklyWage)
        {
            if (!IsTransferWindowOpen || offer == null || !offers.Contains(offer) || offer.status != TransferOfferStatus.Accepted ||
                career == null || weeklyWage <= 0 || !career.CanAfford(offer.offeredFee)) return false;
            var definition = database?.FindPlayer(offer.playerId);
            if (definition == null || !IsAvailable(definition)) return false;
            var player = ToPlayerData(definition);
            if (!career.SpendTransferBudget(offer.offeredFee)) return false;
            if (!career.AddPlayerToSquad(player, weeklyWage))
            {
                career.CreditTransferBudget(offer.offeredFee);
                return false;
            }
            completedPlayerIds.Add(definition.id);
            definition.clubId = managedClubId;
            offer.status = TransferOfferStatus.Completed;
            return true;
        }

        public bool SellPlayer(PlayerData player, int saleFee)
        {
            if (!IsTransferWindowOpen || career?.ManagedTeam?.players == null || player == null || saleFee <= 0 ||
                !career.ManagedTeam.players.Contains(player)) return false;
            if (!career.RemovePlayerFromSquad(player)) return false;
            career.CreditTransferBudget(saleFee);
            var definition = database?.FindPlayer(player.id);
            if (definition != null) definition.clubId = "free-agent";
            return true;
        }

        public int SuggestedAskingPrice(WorldPlayerDefinition player)
        {
            if (player == null) return 0;
            var ageFactor = player.age <= 23 ? 1.2f : player.age >= 32 ? .75f : 1f;
            return Mathf.Max(1000, Mathf.RoundToInt(Mathf.Max(player.marketValue, player.overall * 10000) * ageFactor));
        }

        private bool IsAvailable(WorldPlayerDefinition player)
        {
            if (player == null || string.IsNullOrWhiteSpace(player.id) || completedPlayerIds.Contains(player.id) ||
                string.Equals(player.clubId, managedClubId, StringComparison.OrdinalIgnoreCase)) return false;
            return career?.ManagedTeam?.players?.All(x => x == null || x.id != player.id) ?? true;
        }

        private static PlayerData ToPlayerData(WorldPlayerDefinition source)
        {
            PlayerPosition position;
            if (!Enum.TryParse(source.position, true, out position)) position = PlayerPosition.CM;
            return new PlayerData
            {
                id = source.id,
                displayName = source.displayName,
                position = position,
                overall = Mathf.Clamp(source.overall, 1, 99),
                pace = Mathf.Clamp(source.pace, 1, 99),
                shooting = Mathf.Clamp(source.shooting, 1, 99),
                passing = Mathf.Clamp(source.passing, 1, 99),
                dribbling = Mathf.Clamp(source.dribbling, 1, 99),
                defending = Mathf.Clamp(source.defending, 1, 99),
                physicality = Mathf.Clamp(source.physicality, 1, 99),
                isGoalkeeper = position == PlayerPosition.GK
            };
        }
    }
}
