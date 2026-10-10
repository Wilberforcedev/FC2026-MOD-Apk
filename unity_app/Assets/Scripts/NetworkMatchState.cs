using Unity.Netcode;
using UnityEngine;

namespace FC2026
{
    public sealed class NetworkMatchState : NetworkBehaviour
    {
        public readonly NetworkVariable<int> HomeScore = new(0, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        public readonly NetworkVariable<int> AwayScore = new(0, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        public readonly NetworkVariable<float> MatchSeconds = new(0f, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        public readonly NetworkVariable<bool> MatchRunning = new(false, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        [SerializeField] private float matchLengthSeconds = 360f;

        public override void OnNetworkSpawn()
        {
            if (IsServer) ResetMatch();
        }

        private void Update()
        {
            if (!IsServer || !MatchRunning.Value) return;
            MatchSeconds.Value += Time.deltaTime;
            if (MatchSeconds.Value >= matchLengthSeconds) MatchRunning.Value = false;
        }

        [ServerRpc(RequireOwnership = false)] public void StartMatchServerRpc() { ResetMatch(); MatchRunning.Value = true; }
        [ServerRpc(RequireOwnership = false)] public void PauseMatchServerRpc() => MatchRunning.Value = !MatchRunning.Value;
        [ServerRpc(RequireOwnership = false)] public void RegisterGoalServerRpc(bool homeTeam) { if (!MatchRunning.Value) return; if (homeTeam) HomeScore.Value++; else AwayScore.Value++; }

        private void ResetMatch() { HomeScore.Value = 0; AwayScore.Value = 0; MatchSeconds.Value = 0f; MatchRunning.Value = false; }
    }
}
