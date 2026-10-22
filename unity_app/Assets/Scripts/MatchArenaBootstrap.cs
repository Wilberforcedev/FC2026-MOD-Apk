using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    public sealed class MatchArenaBootstrap : MonoBehaviour
    {
        [SerializeField] private Material pitchMaterial;
        [SerializeField] private Material homeMaterial;
        [SerializeField] private Material awayMaterial;
        [SerializeField] private GameObject footballerVisualPrefab;
        [SerializeField] private bool buildOnStart = true;
        private readonly List<GameObject> spawned = new();

        private void Start()
        {
            if (buildOnStart) BuildArena();
        }

        [ContextMenu("Build Arena")]
        public void BuildArena()
        {
            ClearArena();
            var game = GameBootstrap.Instance;
            if (game == null || game.UserTeam == null || game.OpponentTeam == null)
            {
                Debug.LogWarning("[AERO Match] GameBootstrap or match teams are not ready.", this);
                return;
            }
            footballerVisualPrefab ??= Resources.Load<GameObject>("AERO/FootballerVisual");
            var pitch = GameObject.CreatePrimitive(PrimitiveType.Cube);
            pitch.name = "Pitch";
            pitch.transform.SetPositionAndRotation(Vector3.zero, Quaternion.identity);
            pitch.transform.localScale = new Vector3(68f, 0.18f, 105f);
            pitch.GetComponent<Renderer>().sharedMaterial = pitchMaterial != null ? pitchMaterial : CreateMaterial(new Color(0.04f, 0.32f, 0.12f));
            spawned.Add(pitch);

            var ballObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            ballObject.name = "Match Ball";
            ballObject.transform.position = new Vector3(0f, 0.55f, 0f);
            ballObject.transform.localScale = Vector3.one * 0.45f;
            ballObject.AddComponent<Rigidbody>();
            var ball = ballObject.AddComponent<BallController>();
            spawned.Add(ballObject);

            var input = new GameObject("Mobile Input").AddComponent<MobileInputController>();
            spawned.Add(input.gameObject);
            CreateCamera(ball);
            bool userIsHome = game.UserTeamIsHome;
            CreateTeamFormation(ball, game.UserTeam, userIsHome, true, userIsHome ? homeMaterial : awayMaterial);
            CreateTeamFormation(ball, game.OpponentTeam, !userIsHome, false, userIsHome ? awayMaterial : homeMaterial);
            if (GetComponent<AEROPitchPresentation>() == null) gameObject.AddComponent<AEROPitchPresentation>();
        }

        private void CreateTeamFormation(BallController ball, TeamData team, bool home, bool userTeam, Material kit)
        {
            var slots = new[]
            {
                new Vector3(0f, 0.9f, home ? -43f : 43f), new Vector3(-25f, 0.9f, home ? -29f : 29f), new Vector3(-8f, 0.9f, home ? -31f : 31f),
                new Vector3(8f, 0.9f, home ? -31f : 31f), new Vector3(25f, 0.9f, home ? -29f : 29f), new Vector3(-14f, 0.9f, home ? -12f : 12f),
                new Vector3(0f, 0.9f, home ? -10f : 10f), new Vector3(14f, 0.9f, home ? -12f : 12f), new Vector3(-20f, 0.9f, home ? 12f : -12f),
                new Vector3(0f, 0.9f, home ? 18f : -18f), new Vector3(20f, 0.9f, home ? 12f : -12f)
            };
            for (var i = 0; i < Mathf.Min(11, team.players.Count); i++)
            {
                GameObject playerObject;
                if (footballerVisualPrefab != null)
                {
                    // Keep movement/collision on a clean root; put the rigged visual underneath it.
                    playerObject = new GameObject($"{team.players[i].displayName} ({team.players[i].position})");
                    var visual = Instantiate(footballerVisualPrefab, playerObject.transform);
                    visual.transform.localPosition = Vector3.down * 0.9f;
                    visual.transform.localRotation = Quaternion.identity;
                    visual.transform.localScale = Vector3.one;
                    foreach (var visualCollider in visual.GetComponentsInChildren<Collider>()) visualCollider.enabled = false;
                }
                else
                {
                    playerObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                    playerObject.transform.localScale = new Vector3(0.8f, 0.9f, 0.8f);
                    playerObject.GetComponent<Renderer>().sharedMaterial = kit != null ? kit : CreateMaterial(home ? new Color(0.1f, 0.55f, 0.9f) : new Color(0.85f, 0.08f, 0.08f));
                }
                playerObject.name = $"{team.players[i].displayName} ({team.players[i].position})";
                playerObject.transform.position = slots[i];
                var characterMotor = playerObject.AddComponent<CharacterController>();
                characterMotor.center = Vector3.zero;
                characterMotor.height = 2f;
                characterMotor.radius = 0.38f;
                var controller = playerObject.AddComponent<FootballerController>();
                bool isControlledPlayer = userTeam && i == 9;
                controller.Initialize(team.players[i], isControlledPlayer ? FindFirstObjectByType<MobileInputController>() : null);
                controller.IsUserControlled = isControlledPlayer;
                if (!isControlledPlayer)
                {
                    var ai = playerObject.AddComponent<TacticalAI>();
                    ai.Initialize(ball, slots[i]);
                }
                spawned.Add(playerObject);
            }
        }

        private void CreateCamera(BallController ball)
        {
            var cameraObject = new GameObject("Match Camera");
            cameraObject.transform.position = new Vector3(0f, 22f, -25f);
            var camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 54f;
            var controller = cameraObject.AddComponent<MatchCameraController>();
            controller.Configure(camera, ball);
            spawned.Add(cameraObject);
        }

        private static Material CreateMaterial(Color color)
        {
            var material = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            material.color = color;
            return material;
        }

        private void ClearArena()
        {
            foreach (var item in spawned) if (item != null) Destroy(item);
            spawned.Clear();
        }
    }
}
