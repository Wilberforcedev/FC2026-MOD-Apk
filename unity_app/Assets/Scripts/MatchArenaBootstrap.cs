using System.Collections.Generic;
using UnityEngine;

namespace FC2026
{
    public sealed class MatchArenaBootstrap : MonoBehaviour
    {
        [SerializeField] private Material pitchMaterial;
        [SerializeField] private Material homeMaterial;
        [SerializeField] private Material awayMaterial;
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
            CreateTeamFormation(ball, GameBootstrap.Instance.UserTeam, true, homeMaterial);
            CreateTeamFormation(ball, GameBootstrap.Instance.OpponentTeam, false, awayMaterial);
        }

        private void CreateTeamFormation(BallController ball, TeamData team, bool home, Material kit)
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
                var playerObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                playerObject.name = $"{team.players[i].displayName} ({team.players[i].position})";
                playerObject.transform.position = slots[i];
                playerObject.transform.localScale = new Vector3(0.8f, 1.05f, 0.8f);
                playerObject.GetComponent<Renderer>().sharedMaterial = kit != null ? kit : CreateMaterial(home ? new Color(0.1f, 0.55f, 0.9f) : new Color(0.85f, 0.08f, 0.08f));
                playerObject.AddComponent<CharacterController>();
                var controller = playerObject.AddComponent<FootballerController>();
                controller.Initialize(team.players[i], home && i == 9 ? FindFirstObjectByType<MobileInputController>() : null);
                if (!home || i != 9)
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
