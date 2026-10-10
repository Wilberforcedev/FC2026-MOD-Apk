using System;
using UnityEngine;

namespace FC2026
{
    public enum NegotiationState { None, Open, CounterOffer, Accepted, Rejected, Completed }

    [Serializable]
    public sealed class TransferOffer
    {
        public int transferFee;
        public int weeklyWage;
        public int contractYears = 3;
    }

    public sealed class TransferNegotiationManager : MonoBehaviour
    {
        [SerializeField] private CareerManager career;
        [SerializeField] private SquadManager squad;
        [SerializeField] private TransferListing activeListing;
        [SerializeField] private TransferOffer activeOffer;
        [SerializeField] private NegotiationState state;
        [SerializeField] private int negotiationRound;

        public TransferListing ActiveListing => activeListing;
        public TransferOffer ActiveOffer => activeOffer;
        public NegotiationState State => state;
        public int NegotiationRound => negotiationRound;
        public event Action<NegotiationState, string> NegotiationChanged;

        public void Configure(CareerManager careerManager, SquadManager squadManager)
        {
            career = careerManager;
            squad = squadManager;
        }

        public bool OpenNegotiation(TransferListing listing)
        {
            if (listing?.player == null || state == NegotiationState.Open || state == NegotiationState.CounterOffer) return false;
            activeListing = listing;
            activeOffer = new TransferOffer { transferFee = Mathf.RoundToInt(listing.fee * .86f), weeklyWage = Mathf.Max(500, listing.player.overall * 500), contractYears = 3 };
            negotiationRound = 0;
            state = NegotiationState.Open;
            Notify("Negotiations opened. Make a credible offer to the selling club.");
            return true;
        }

        public NegotiationState SubmitOffer(int transferFee, int weeklyWage, int contractYears)
        {
            if (activeListing?.player == null || (state != NegotiationState.Open && state != NegotiationState.CounterOffer)) return NegotiationState.None;
            if (transferFee < 0 || weeklyWage < 0 || contractYears < 1) { Reject("Offer terms are invalid."); return state; }
            negotiationRound++;
            activeOffer = new TransferOffer { transferFee = transferFee, weeklyWage = weeklyWage, contractYears = contractYears };
            var feeRatio = transferFee / (float)Mathf.Max(1, activeListing.fee);
            var wageTarget = activeListing.player.overall * 700;
            var wageRatio = weeklyWage / (float)Mathf.Max(1, wageTarget);
            if (feeRatio >= .98f && wageRatio >= .9f && CanAfford(transferFee))
            {
                state = NegotiationState.Accepted;
                Notify($"Offer accepted. {activeListing.player.displayName} is ready to join.");
            }
            else if (feeRatio >= .72f && negotiationRound < 3 && CanAfford(transferFee))
            {
                state = NegotiationState.CounterOffer;
                activeOffer.transferFee = Mathf.CeilToInt(activeListing.fee * Mathf.Min(1.02f, feeRatio + .12f));
                activeOffer.weeklyWage = Mathf.Max(weeklyWage, Mathf.RoundToInt(wageTarget * .95f));
                Notify($"Counter-offer received: €{activeOffer.transferFee / 1000000f:0.0}M and €{activeOffer.weeklyWage:N0}/week.");
            }
            else Reject("The selling club rejected the offer.");
            return state;
        }

        public bool CompleteAcceptedTransfer()
        {
            if (state != NegotiationState.Accepted || activeListing == null || career == null || !career.SpendTransferBudget(activeOffer.transferFee)) return false;
            if (squad?.CurrentTeam != null && !squad.CurrentTeam.players.Contains(activeListing.player)) squad.CurrentTeam.players.Add(activeListing.player);
            state = NegotiationState.Completed;
            Notify($"Deal completed. {activeListing.player.displayName} has joined the squad.");
            return true;
        }

        public void Reject(string reason) { state = NegotiationState.Rejected; Notify(reason); }
        public void Cancel() { activeListing = null; activeOffer = null; state = NegotiationState.None; negotiationRound = 0; Notify("Negotiation closed."); }
        private bool CanAfford(int fee) => career == null || career.CanAfford(fee);
        private void Notify(string message) => NegotiationChanged?.Invoke(state, message);
    }
}
