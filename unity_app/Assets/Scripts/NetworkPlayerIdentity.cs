using Unity.Collections;
using Unity.Netcode;
using UnityEngine;

namespace FC2026
{
    public sealed class NetworkPlayerIdentity : NetworkBehaviour
    {
        public readonly NetworkVariable<FixedString64Bytes> DisplayName = new("Player", NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        public readonly NetworkVariable<int> TeamSide = new(0, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);
        public readonly NetworkVariable<bool> Ready = new(false, NetworkVariableReadPermission.Everyone, NetworkVariableWritePermission.Server);

        public override void OnNetworkSpawn()
        {
            if (IsOwner) SetIdentityServerRpc($"Player {OwnerClientId + 1}", 0);
        }

        [ServerRpc]
        public void SetIdentityServerRpc(string displayName, int teamSide)
        {
            DisplayName.Value = displayName.Substring(0, Mathf.Min(displayName.Length, 64));
            TeamSide.Value = Mathf.Clamp(teamSide, 0, 1);
        }

        [ServerRpc]
        public void SetReadyServerRpc(bool ready) => Ready.Value = ready;
    }
}
