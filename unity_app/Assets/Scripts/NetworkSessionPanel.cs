using System.Threading.Tasks;
using Unity.Netcode;
using UnityEngine;

namespace FC2026
{
    public sealed class NetworkSessionPanel : MonoBehaviour
    {
        [SerializeField] private UnityServicesOnlineSession online;
        [SerializeField] private NetworkSessionManager lanFallback;
        [SerializeField] private NetworkMatchState matchState;
        private string lobbyName = "FC 2026 Match";
        private string lobbyCode = string.Empty;
        private string address = "127.0.0.1";
        private string playerName = "Player";
        private string status = "Connecting to online services...";

        private void Awake()
        {
            online = online != null ? online : FindFirstObjectByType<UnityServicesOnlineSession>();
            lanFallback = lanFallback != null ? lanFallback : FindFirstObjectByType<NetworkSessionManager>();
            matchState = matchState != null ? matchState : FindFirstObjectByType<NetworkMatchState>();
            if (online != null) online.StatusChanged += HandleStatusChanged;
        }

        private void OnDestroy() { if (online != null) online.StatusChanged -= HandleStatusChanged; }

        private void OnGUI()
        {
            GUILayout.BeginArea(new Rect(18, 18, 300, 340), GUI.skin.box);
            GUILayout.Label("FC 2026  /  ONLINE MATCH");
            GUILayout.Label(status);
            GUILayout.Label("Player name");
            playerName = GUILayout.TextField(playerName);
            GUILayout.Space(4);
            GUILayout.Label("Internet match via Lobby + Relay");
            lobbyName = GUILayout.TextField(lobbyName);
            if (GUILayout.Button("CREATE ONLINE LOBBY")) _ = CreateLobbyAsync();
            GUILayout.Label("Invite code");
            lobbyCode = GUILayout.TextField(lobbyCode);
            if (GUILayout.Button("JOIN ONLINE LOBBY")) _ = JoinLobbyAsync();
            GUILayout.Space(8);
            GUILayout.Label("LAN fallback");
            address = GUILayout.TextField(address);
            if (GUILayout.Button("HOST LAN")) lanFallback?.StartHost();
            if (GUILayout.Button("JOIN LAN")) lanFallback?.StartClient(address);
            if (NetworkManager.Singleton != null && NetworkManager.Singleton.IsConnectedClient)
            {
                if (GUILayout.Button("READY UP")) _ = online != null ? online.SetReadyAsync(true) : Task.CompletedTask;
                if (GUILayout.Button("START MATCH")) matchState?.StartMatchServerRpc();
                if (GUILayout.Button("LEAVE MATCH")) _ = online != null ? online.LeaveAsync() : Task.CompletedTask;
                GUILayout.Label($"Score  {matchState?.HomeScore.Value ?? 0} - {matchState?.AwayScore.Value ?? 0}");
            }
            GUILayout.EndArea();
        }

        private async Task CreateLobbyAsync()
        {
            if (online == null) { status = "Online session component missing"; return; }
            await online.CreateLobbyAndHostAsync(lobbyName, 2);
            status = online.Status + (string.IsNullOrEmpty(online.RelayJoinCode) ? string.Empty : $"\nShare code: {online.RelayJoinCode}");
        }

        private async Task JoinLobbyAsync()
        {
            if (online == null) { status = "Online session component missing"; return; }
            await online.JoinLobbyAndClientAsync(lobbyCode);
            status = online.Status;
        }

        private void HandleStatusChanged(string next) => status = next;
    }
}
