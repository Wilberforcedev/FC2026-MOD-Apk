using System;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using UnityEngine;

namespace FC2026
{
    public sealed class NetworkSessionManager : MonoBehaviour
    {
        [SerializeField] private string defaultAddress = "127.0.0.1";
        [SerializeField] private ushort defaultPort = 7777;
        public string LastStatus { get; private set; } = "Offline";
        public event Action<string> StatusChanged;

        private void Awake()
        {
            if (NetworkManager.Singleton == null) return;
            NetworkManager.Singleton.OnServerStarted += HandleServerStarted;
            NetworkManager.Singleton.OnClientConnectedCallback += HandleClientConnected;
            NetworkManager.Singleton.OnClientDisconnectCallback += HandleClientDisconnected;
        }

        public void StartHost(ushort port = 0)
        {
            var manager = NetworkManager.Singleton;
            if (manager == null) { SetStatus("NetworkManager missing"); return; }
            ConfigureTransport("0.0.0.0", port == 0 ? defaultPort : port);
            SetStatus(manager.StartHost() ? "Hosting" : "Host failed");
        }

        public void StartClient(string address = "", ushort port = 0)
        {
            var manager = NetworkManager.Singleton;
            if (manager == null) { SetStatus("NetworkManager missing"); return; }
            ConfigureTransport(string.IsNullOrWhiteSpace(address) ? defaultAddress : address, port == 0 ? defaultPort : port);
            SetStatus(manager.StartClient() ? "Connecting" : "Client failed");
        }

        public void StopSession()
        {
            NetworkManager.Singleton?.Shutdown();
            SetStatus("Offline");
        }

        private void ConfigureTransport(string address, ushort port)
        {
            var transport = NetworkManager.Singleton?.GetComponent<UnityTransport>();
            if (transport != null) transport.SetConnectionData(address, port, "0.0.0.0");
        }

        private void HandleServerStarted() => SetStatus("Hosting");
        private void HandleClientConnected(ulong clientId) { if (NetworkManager.Singleton != null && clientId == NetworkManager.Singleton.LocalClientId) SetStatus("Connected"); }
        private void HandleClientDisconnected(ulong clientId) => SetStatus("Disconnected");
        private void SetStatus(string status) { LastStatus = status; StatusChanged?.Invoke(status); }
    }
}
