using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using Unity.Services.Authentication;
using Unity.Services.Core;
using Unity.Services.Lobbies;
using Unity.Services.Lobbies.Models;
using Unity.Services.Relay;
using Unity.Services.Relay.Models;
using UnityEngine;

namespace FC2026
{
    public sealed class UnityServicesOnlineSession : MonoBehaviour
    {
        public const string RelayJoinCodeKey = "relayJoinCode";
        public Lobby CurrentLobby { get; private set; }
        public string RelayJoinCode { get; private set; } = string.Empty;
        public bool IsReady { get; private set; }
        public string Status { get; private set; } = "Offline";
        public event Action<string> StatusChanged;
        public event Action<Lobby> LobbyChanged;

        private float heartbeatTimer;
        private float lobbyPollTimer;

        private async void Start() => await InitializeAsync();

        public async Task InitializeAsync()
        {
            try
            {
                if (UnityServices.State != ServicesInitializationState.Initialized)
                    await UnityServices.InitializeAsync();
                if (!AuthenticationService.Instance.IsSignedIn)
                    await AuthenticationService.Instance.SignInAnonymouslyAsync();
                SetStatus("Online services ready");
            }
            catch (Exception exception) { SetStatus($"Services error: {exception.Message}"); }
        }

        public async Task<bool> CreateLobbyAndHostAsync(string lobbyName, int maxPlayers = 2)
        {
            await EnsureInitializedAsync();
            try
            {
                var allocation = await RelayService.Instance.CreateAllocationAsync(maxPlayers - 1);
                RelayJoinCode = await RelayService.Instance.GetJoinCodeAsync(allocation.AllocationId);
                ConfigureHostRelay(allocation);
                CurrentLobby = await LobbyService.Instance.CreateLobbyAsync(
                    string.IsNullOrWhiteSpace(lobbyName) ? "FC 2026 Match" : lobbyName,
                    maxPlayers,
                    new CreateLobbyOptions
                    {
                        IsPrivate = false,
                        Data = new Dictionary<string, DataObject>
                        {
                            { RelayJoinCodeKey, new DataObject(DataObject.VisibilityOptions.Member, RelayJoinCode) }
                        }
                    });
                if (!NetworkManager.Singleton.StartHost()) { SetStatus("Host failed"); return false; }
                SetStatus($"Hosting {CurrentLobby.Name} • Code {RelayJoinCode}");
                LobbyChanged?.Invoke(CurrentLobby);
                return true;
            }
            catch (Exception exception) { SetStatus($"Create lobby failed: {exception.Message}"); return false; }
        }

        public async Task<bool> JoinLobbyAndClientAsync(string lobbyCode)
        {
            await EnsureInitializedAsync();
            try
            {
                CurrentLobby = await LobbyService.Instance.JoinLobbyByCodeAsync(lobbyCode.Trim().ToUpperInvariant());
                if (!CurrentLobby.Data.TryGetValue(RelayJoinCodeKey, out var relayData)) { SetStatus("Lobby has no Relay code"); return false; }
                RelayJoinCode = relayData.Value;
                var joinAllocation = await RelayService.Instance.JoinAllocationAsync(RelayJoinCode);
                ConfigureClientRelay(joinAllocation);
                if (!NetworkManager.Singleton.StartClient()) { SetStatus("Client failed"); return false; }
                SetStatus($"Joining {CurrentLobby.Name}");
                LobbyChanged?.Invoke(CurrentLobby);
                return true;
            }
            catch (Exception exception) { SetStatus($"Join lobby failed: {exception.Message}"); return false; }
        }

        public async Task RefreshLobbyAsync()
        {
            if (CurrentLobby == null || string.IsNullOrEmpty(CurrentLobby.Id)) return;
            try { CurrentLobby = await LobbyService.Instance.GetLobbyAsync(CurrentLobby.Id); LobbyChanged?.Invoke(CurrentLobby); }
            catch (LobbyServiceException exception) { SetStatus($"Lobby refresh failed: {exception.Message}"); }
        }

        public async Task SetReadyAsync(bool ready)
        {
            if (CurrentLobby == null || string.IsNullOrEmpty(AuthenticationService.Instance.PlayerId)) return;
            try
            {
                CurrentLobby = await LobbyService.Instance.UpdatePlayerAsync(CurrentLobby.Id, AuthenticationService.Instance.PlayerId, new UpdatePlayerOptions { Data = new Dictionary<string, PlayerDataObject> { { "ready", new PlayerDataObject(PlayerDataObject.VisibilityOptions.Member, ready ? "1" : "0") } } });
                IsReady = ready;
                LobbyChanged?.Invoke(CurrentLobby);
            }
            catch (LobbyServiceException exception) { SetStatus($"Ready update failed: {exception.Message}"); }
        }

        public async Task LeaveAsync()
        {
            try
            {
                if (CurrentLobby != null && AuthenticationService.Instance.IsSignedIn)
                    await LobbyService.Instance.RemovePlayerAsync(CurrentLobby.Id, AuthenticationService.Instance.PlayerId);
            }
            catch (LobbyServiceException exception) { Debug.LogWarning(exception.Message); }
            NetworkManager.Singleton?.Shutdown();
            CurrentLobby = null;
            RelayJoinCode = string.Empty;
            SetStatus("Offline");
        }

        private async Task EnsureInitializedAsync()
        {
            if (UnityServices.State != ServicesInitializationState.Initialized || !AuthenticationService.Instance.IsSignedIn)
                await InitializeAsync();
        }

        private void Update()
        {
            if (CurrentLobby == null || !AuthenticationService.Instance.IsSignedIn) return;
            heartbeatTimer += Time.deltaTime;
            lobbyPollTimer += Time.deltaTime;
            if (NetworkManager.Singleton.IsHost && heartbeatTimer >= 15f) { heartbeatTimer = 0f; _ = LobbyService.Instance.SendHeartbeatPingAsync(CurrentLobby.Id); }
            if (lobbyPollTimer >= 5f) { lobbyPollTimer = 0f; _ = RefreshLobbyAsync(); }
        }

        private static void ConfigureHostRelay(Allocation allocation)
        {
            var transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
            transport.SetHostRelayData(allocation.RelayServer.IpV4, (ushort)allocation.RelayServer.Port, allocation.AllocationIdBytes, allocation.Key, allocation.ConnectionData, true);
        }

        private static void ConfigureClientRelay(JoinAllocation allocation)
        {
            var transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
            transport.SetClientRelayData(allocation.RelayServer.IpV4, (ushort)allocation.RelayServer.Port, allocation.AllocationIdBytes, allocation.Key, allocation.ConnectionData, allocation.HostConnectionData, true);
        }

        private void SetStatus(string status) { Status = status; StatusChanged?.Invoke(status); }
    }
}
