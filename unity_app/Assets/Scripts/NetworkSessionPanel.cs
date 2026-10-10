using Unity.Netcode;
using UnityEngine;

namespace FC2026
{
    public sealed class NetworkSessionPanel : MonoBehaviour
    {
        [SerializeField] private NetworkSessionManager sessions;
        [SerializeField] private NetworkMatchState matchState;
        private string address = "127.0.0.1";
        private string playerName = "Player";

        private void OnGUI()
        {
            if (sessions == null) sessions = FindFirstObjectByType<NetworkSessionManager>();
            if (matchState == null) matchState = FindFirstObjectByType<NetworkMatchState>();
            GUILayout.BeginArea(new Rect(18, 18, 260, 270), GUI.skin.box);
            GUILayout.Label("FC 2026  /  ONLINE MATCH");
            GUILayout.Label($"Status: {sessions?.LastStatus ?? "Offline"}");
            playerName = GUILayout.TextField(playerName);
            address = GUILayout.TextField(address);
            if (GUILayout.Button("HOST MATCH")) sessions?.StartHost();
            if (GUILayout.Button("JOIN MATCH")) sessions?.StartClient(address);
            if (NetworkManager.Singleton != null && NetworkManager.Singleton.IsConnectedClient)
            {
                if (GUILayout.Button("READY")) FindFirstObjectByType<NetworkPlayerIdentity>()?.SetReadyServerRpc(true);
                if (GUILayout.Button("START MATCH")) matchState?.StartMatchServerRpc();
                if (GUILayout.Button("LEAVE")) sessions?.StopSession();
                GUILayout.Label($"Score  {matchState?.HomeScore.Value ?? 0} - {matchState?.AwayScore.Value ?? 0}");
            }
            GUILayout.EndArea();
        }
    }
}
