using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using FC2026.Gameplay;

namespace FC2026.Core
{
    public sealed class MatchManager3D : MonoBehaviour
    {
        private const float PitchWidth = 68f;
        private const float PitchLength = 105f;
        private const float GoalWidth = 7.32f;
        private const float GoalHeight = 2.44f;

        private readonly List<(Transform transform, Vector3 start)> playerStarts = new();

        private BallController ball;
        private FootballPlayerController userPlayer;
        private BroadcastCameraController broadcastCamera;
        private int homeScore;
        private int awayScore;
        private bool resetting;
        private GUIStyle scoreStyle;
        private GUIStyle helpStyle;
        private GUIStyle goalStyle;
        private float goalBannerUntil;
        private string goalBanner = string.Empty;
        private float ballOutUntil;
        private GUIStyle buttonStyle;
        private GUIStyle labelSmallStyle;
        private Texture2D joystickDisc;
        private const float MatchDurationSeconds = 180f;
        private float matchElapsed;
        private float nextCommentaryAt = 8f;
        private string commentary = "The referee gets us underway!";
        private bool matchFinished;
        private bool resultSaved;
        private GUIStyle commentaryStyle;
        private GUIStyle fullTimeStyle;

        private readonly Vector3[] homeFormation =
        {
            new(0, 0, -48),
            new(-23, 0, -36), new(-8, 0, -39), new(8, 0, -39), new(23, 0, -36),
            new(-15, 0, -18), new(0, 0, -21), new(15, 0, -18),
            new(-21, 0, 4), new(0, 0, 11), new(21, 0, 4),
        };

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Screen.orientation = ScreenOrientation.AutoRotation;
            Screen.autorotateToPortrait = false;
            Screen.autorotateToPortraitUpsideDown = false;
            Screen.autorotateToLandscapeLeft = true;
            Screen.autorotateToLandscapeRight = true;

            BuildWorld();
            CreateJoystickTexture();
        }

        private void Update()
        {
            if (matchFinished) return;
            matchElapsed += Time.deltaTime;
            if (matchElapsed >= MatchDurationSeconds)
            {
                matchFinished = true;
                commentary = "Full time! The referee brings the match to an end.";
                goalBannerUntil = 0f;
                return;
            }
            if (matchElapsed >= nextCommentaryAt)
            {
                UpdateCommentary();
                nextCommentaryAt = matchElapsed + Random.Range(12f, 21f);
            }
            if (userPlayer == null || !userPlayer.IsUserControlled)
            {
                var controllers = FindObjectsByType<FootballPlayerController>(FindObjectsSortMode.None);
                foreach (var controller in controllers)
                {
                    if (controller == null || !controller.IsUserControlled || controller.TeamDirection != 1)
                        continue;
                    userPlayer = controller;
                    broadcastCamera?.SetControlledPlayer(userPlayer.transform);
                    break;
                }
            }

            if (ball == null || resetting || Time.time < ballOutUntil)
                return;

            var position = ball.transform.position;
            // Keep the prototype match playable: loose balls beyond the touchline,
            // goal line or below the pitch are brought back for a centre restart.
            if (Mathf.Abs(position.x) > PitchWidth * 0.5f + 7f ||
                Mathf.Abs(position.z) > PitchLength * 0.5f + 7f || position.y < -2f)
            {
                ballOutUntil = Time.time + 1.25f;
                ball.ResetBall(new Vector3(0f, 0.14f, 0f));
                goalBanner = "BALL OUT — RESTART";
                goalBannerUntil = Time.time + 1.15f;
            }
        }

        private void BuildWorld()
        {
            CreateLighting();
            CreatePitch();
            CreateStadiumShell();
            CreateGoals();
            CreateBall();
            CreateTeams();
            CreateBroadcastCamera();
        }

        private void CreateLighting()
        {
            RenderSettings.ambientLight = new Color(0.38f, 0.42f, 0.5f);

            var sun = new GameObject("Stadium Floodlight Sun");
            sun.transform.SetParent(transform);
            var light = sun.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.25f;
            light.color = new Color(1f, 0.96f, 0.9f);
            light.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(48f, -34f, 0f);

            for (var i = 0; i < 4; i++)
            {
                var flood = new GameObject($"Floodlight {i + 1}");
                flood.transform.SetParent(transform);
                var spot = flood.AddComponent<Light>();
                spot.type = LightType.Spot;
                spot.range = 95f;
                spot.intensity = 850f;
                spot.spotAngle = 68f;
                spot.color = new Color(0.88f, 0.94f, 1f);
                var x = i % 2 == 0 ? -39f : 39f;
                var z = i < 2 ? -46f : 46f;
                flood.transform.position = new Vector3(x, 24f, z);
                flood.transform.LookAt(Vector3.zero);
            }
        }

        private void CreatePitch()
        {
            var grass = CreateMaterial(new Color(0.055f, 0.34f, 0.12f), 0.42f);
            var stripe = CreateMaterial(new Color(0.065f, 0.40f, 0.14f), 0.42f);
            var line = CreateMaterial(new Color(0.95f, 0.97f, 1f), 0.2f);

            var pitch = GameObject.CreatePrimitive(PrimitiveType.Plane);
            pitch.name = "3D Pitch";
            pitch.transform.SetParent(transform);
            pitch.transform.localScale = new Vector3(PitchWidth / 10f, 1f, PitchLength / 10f);
            pitch.GetComponent<Renderer>().material = grass;

            for (var i = 0; i < 10; i += 2)
            {
                var strip = GameObject.CreatePrimitive(PrimitiveType.Cube);
                strip.name = $"Mowing Stripe {i + 1}";
                strip.transform.SetParent(transform);
                strip.transform.position = new Vector3(0f, 0.012f, -PitchLength / 2f + (i + 0.5f) * (PitchLength / 10f));
                strip.transform.localScale = new Vector3(PitchWidth, 0.018f, PitchLength / 10f);
                strip.GetComponent<Renderer>().material = stripe;
                Destroy(strip.GetComponent<Collider>());
            }

            CreateLine(new Vector3(0, 0.035f, -PitchLength / 2f), new Vector3(PitchWidth, 0.04f, 0.12f), line);
            CreateLine(new Vector3(0, 0.035f, PitchLength / 2f), new Vector3(PitchWidth, 0.04f, 0.12f), line);
            CreateLine(new Vector3(-PitchWidth / 2f, 0.035f, 0), new Vector3(0.12f, 0.04f, PitchLength), line);
            CreateLine(new Vector3(PitchWidth / 2f, 0.035f, 0), new Vector3(0.12f, 0.04f, PitchLength), line);
            CreateLine(new Vector3(0, 0.035f, 0), new Vector3(PitchWidth, 0.04f, 0.12f), line);

            // Penalty boxes give the prototype a true regulation-scale visual reference.
            CreatePenaltyBox(-1, line);
            CreatePenaltyBox(1, line);
            CreatePitchDetails(line);
        }

        private void CreatePenaltyBox(int side, Material line)
        {
            var goalZ = side * PitchLength / 2f;
            var boxDepth = 16.5f;
            var boxWidth = 40.32f;
            var insideZ = goalZ - side * boxDepth;
            CreateLine(new Vector3(0, 0.036f, insideZ), new Vector3(boxWidth, 0.04f, 0.1f), line);
            CreateLine(new Vector3(-boxWidth / 2f, 0.036f, goalZ - side * boxDepth / 2f), new Vector3(0.1f, 0.04f, boxDepth), line);
            CreateLine(new Vector3(boxWidth / 2f, 0.036f, goalZ - side * boxDepth / 2f), new Vector3(0.1f, 0.04f, boxDepth), line);
        }

        private void CreatePitchDetails(Material line)
        {
            var sixYardDepth = 5.5f;
            var sixYardWidth = 18.32f;

            for (var side = -1; side <= 1; side += 2)
            {
                var goalZ = side * PitchLength / 2f;
                var insideZ = goalZ - side * sixYardDepth;

                CreateLine(new Vector3(0f, 0.035f, insideZ), new Vector3(sixYardWidth, 0.04f, 0.1f), line);
                CreateLine(new Vector3(-sixYardWidth / 2f, 0.035f, goalZ - side * sixYardDepth / 2f), new Vector3(0.1f, 0.04f, sixYardDepth), line);
                CreateLine(new Vector3(sixYardWidth / 2f, 0.035f, goalZ - side * sixYardDepth / 2f), new Vector3(0.1f, 0.04f, sixYardDepth), line);

                var penaltyZ = side * (PitchLength / 2f - 11f);
                CreatePitchSpot("Penalty Spot", new Vector3(0f, 0.075f, penaltyZ), line);

                if (side < 0)
                    CreatePitchCurve("South Penalty Arc", new Vector3(0f, 0.078f, penaltyZ), 9.15f, 36.9f, 143.1f, 36, line);
                else
                    CreatePitchCurve("North Penalty Arc", new Vector3(0f, 0.078f, penaltyZ), 9.15f, 216.9f, 323.1f, 36, line);
            }

            CreatePitchCurve("Centre Circle", new Vector3(0f, 0.078f, 0f), 9.15f, 0f, 360f, 64, line);
            CreatePitchSpot("Centre Spot", new Vector3(0f, 0.075f, 0f), line);

            var cornerRadius = 1f;
            CreatePitchCurve("South West Corner Arc", new Vector3(-PitchWidth / 2f, 0.078f, -PitchLength / 2f), cornerRadius, 0f, 90f, 12, line);
            CreatePitchCurve("South East Corner Arc", new Vector3(PitchWidth / 2f, 0.078f, -PitchLength / 2f), cornerRadius, 90f, 180f, 12, line);
            CreatePitchCurve("North East Corner Arc", new Vector3(PitchWidth / 2f, 0.078f, PitchLength / 2f), cornerRadius, 180f, 270f, 12, line);
            CreatePitchCurve("North West Corner Arc", new Vector3(-PitchWidth / 2f, 0.078f, PitchLength / 2f), cornerRadius, 270f, 360f, 12, line);
        }

        private void CreatePitchSpot(string name, Vector3 position, Material material)
        {
            var spot = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            spot.name = name;
            spot.transform.SetParent(transform);
            spot.transform.position = position;
            spot.transform.localScale = new Vector3(0.34f, 0.025f, 0.34f);
            spot.GetComponent<Renderer>().material = material;
            Destroy(spot.GetComponent<Collider>());
        }

        private void CreatePitchCurve(string name, Vector3 center, float radius, float startDegrees, float endDegrees, int segments, Material material)
        {
            var curve = new GameObject(name);
            curve.transform.SetParent(transform);

            var renderer = curve.AddComponent<LineRenderer>();
            renderer.useWorldSpace = true;
            renderer.loop = false;
            renderer.positionCount = segments + 1;
            renderer.startWidth = 0.11f;
            renderer.endWidth = 0.11f;
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;
            renderer.numCapVertices = 2;
            renderer.numCornerVertices = 2;

            for (var i = 0; i <= segments; i++)
            {
                var angle = Mathf.Lerp(startDegrees, endDegrees, i / (float)segments) * Mathf.Deg2Rad;
                renderer.SetPosition(i, new Vector3(
                    center.x + Mathf.Cos(angle) * radius,
                    center.y,
                    center.z + Mathf.Sin(angle) * radius));
            }
        }

        private void CreateGoalNet(int side, float goalZ, Material material)
        {
            const float depth = 2.5f;
            const int acrossCount = 8;
            const int depthCount = 4;
            const int heightCount = 4;

            var backZ = goalZ + side * depth;
            var vertices = new List<Vector3>();
            var triangles = new List<int>();

            for (var i = 0; i <= acrossCount; i++)
            {
                var x = Mathf.Lerp(-GoalWidth / 2f, GoalWidth / 2f, i / (float)acrossCount);
                AddNetSegment(vertices, triangles, new Vector3(x, 0.05f, backZ), new Vector3(x, GoalHeight, backZ));
            }

            for (var i = 0; i <= heightCount; i++)
            {
                var y = Mathf.Lerp(0.05f, GoalHeight, i / (float)heightCount);
                AddNetSegment(vertices, triangles, new Vector3(-GoalWidth / 2f, y, backZ), new Vector3(GoalWidth / 2f, y, backZ));
            }

            for (var edge = -1; edge <= 1; edge += 2)
            {
                var x = edge * GoalWidth / 2f;
                for (var i = 0; i <= depthCount; i++)
                {
                    var z = Mathf.Lerp(goalZ, backZ, i / (float)depthCount);
                    AddNetSegment(vertices, triangles, new Vector3(x, 0.05f, z), new Vector3(x, GoalHeight, z));
                }

                for (var i = 0; i <= heightCount; i++)
                {
                    var y = Mathf.Lerp(0.05f, GoalHeight, i / (float)heightCount);
                    AddNetSegment(vertices, triangles, new Vector3(x, y, goalZ), new Vector3(x, y, backZ));
                }
            }

            for (var i = 0; i <= acrossCount; i++)
            {
                var x = Mathf.Lerp(-GoalWidth / 2f, GoalWidth / 2f, i / (float)acrossCount);
                AddNetSegment(vertices, triangles, new Vector3(x, GoalHeight, goalZ), new Vector3(x, GoalHeight, backZ));
            }

            for (var i = 0; i <= depthCount; i++)
            {
                var z = Mathf.Lerp(goalZ, backZ, i / (float)depthCount);
                AddNetSegment(vertices, triangles, new Vector3(-GoalWidth / 2f, GoalHeight, z), new Vector3(GoalWidth / 2f, GoalHeight, z));
            }

            var mesh = new Mesh { name = "Goal Net Mesh" };
            mesh.SetVertices(vertices);
            mesh.SetTriangles(triangles, 0);
            mesh.RecalculateNormals();

            var net = new GameObject("Goal Net");
            net.transform.SetParent(transform);
            var filter = net.AddComponent<MeshFilter>();
            var renderer = net.AddComponent<MeshRenderer>();
            filter.sharedMesh = mesh;
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            renderer.receiveShadows = false;
        }

        private static void AddNetSegment(List<Vector3> vertices, List<int> triangles, Vector3 start, Vector3 end)
        {
            var direction = (end - start).normalized;
            var side = Vector3.Cross(direction, Vector3.up);
            if (side.sqrMagnitude < 0.001f)
                side = Vector3.Cross(direction, Vector3.forward);
            side = side.normalized * 0.018f;

            var first = vertices.Count;
            vertices.Add(start - side);
            vertices.Add(start + side);
            vertices.Add(end + side);
            vertices.Add(end - side);
            triangles.Add(first);
            triangles.Add(first + 1);
            triangles.Add(first + 2);
            triangles.Add(first);
            triangles.Add(first + 2);
            triangles.Add(first + 3);
        }

        private void CreateLine(Vector3 position, Vector3 scale, Material material)
        {
            var line = GameObject.CreatePrimitive(PrimitiveType.Cube);
            line.name = "Pitch Line";
            line.transform.SetParent(transform);
            line.transform.position = position;
            line.transform.localScale = scale;
            line.GetComponent<Renderer>().material = material;
            Destroy(line.GetComponent<Collider>());
        }

        private void CreateStadiumShell()
        {
            var concrete = CreateMaterial(new Color(0.055f, 0.075f, 0.11f), 0.55f);
            var crowdBlue = CreateMaterial(new Color(0.08f, 0.2f, 0.42f), 0.4f);
            var crowdGold = CreateMaterial(new Color(0.65f, 0.38f, 0.04f), 0.45f);

            CreateStand("West Stand", new Vector3(-47f, 6f, 0), new Vector3(20f, 12f, 118f), concrete, crowdBlue);
            CreateStand("East Stand", new Vector3(47f, 6f, 0), new Vector3(20f, 12f, 118f), concrete, crowdGold);
            CreateStand("North Stand", new Vector3(0, 6f, 66f), new Vector3(76f, 12f, 20f), concrete, crowdBlue);
            CreateStand("South Stand", new Vector3(0, 6f, -66f), new Vector3(76f, 12f, 20f), concrete, crowdGold);

            var canopy = CreateMaterial(new Color(0.025f, 0.04f, 0.065f), 0.62f);
            CreateStadiumBlock("West Canopy", new Vector3(-47f, 17.6f, 0f), new Vector3(21f, 0.8f, 120f), canopy);
            CreateStadiumBlock("East Canopy", new Vector3(47f, 17.6f, 0f), new Vector3(21f, 0.8f, 120f), canopy);
            CreateStadiumBlock("North Canopy", new Vector3(0f, 17.6f, 66f), new Vector3(78f, 0.8f, 21f), canopy);
            CreateStadiumBlock("South Canopy", new Vector3(0f, 17.6f, -66f), new Vector3(78f, 0.8f, 21f), canopy);

            var fascia = CreateMaterial(new Color(0.025f, 0.12f, 0.16f), 0.48f);
            CreateStadiumBlock("West LED Fascia", new Vector3(-36.7f, 1.15f, 0f), new Vector3(0.35f, 0.7f, 104f), fascia);
            CreateStadiumBlock("East LED Fascia", new Vector3(36.7f, 1.15f, 0f), new Vector3(0.35f, 0.7f, 104f), fascia);
            CreateStadiumBlock("North LED Fascia", new Vector3(0f, 1.15f, 52.2f), new Vector3(66f, 0.7f, 0.35f), fascia);
            CreateStadiumBlock("South LED Fascia", new Vector3(0f, 1.15f, -52.2f), new Vector3(66f, 0.7f, 0.35f), fascia);
        }

        private void CreateStadiumBlock(string name, Vector3 position, Vector3 scale, Material material)
        {
            var block = GameObject.CreatePrimitive(PrimitiveType.Cube);
            block.name = name;
            block.transform.SetParent(transform);
            block.transform.position = position;
            block.transform.localScale = scale;
            block.GetComponent<Renderer>().material = material;
            Destroy(block.GetComponent<Collider>());
        }

        private void CreateStand(string name, Vector3 position, Vector3 scale, Material baseMaterial, Material crowdMaterial)
        {
            var stand = GameObject.CreatePrimitive(PrimitiveType.Cube);
            stand.name = name;
            stand.transform.SetParent(transform);
            stand.transform.position = position;
            stand.transform.localScale = scale;
            stand.GetComponent<Renderer>().material = baseMaterial;

            var crowd = GameObject.CreatePrimitive(PrimitiveType.Cube);
            crowd.name = name + " Crowd";
            crowd.transform.SetParent(transform);
            crowd.transform.position = position + Vector3.up * 6.4f;
            crowd.transform.localScale = new Vector3(scale.x * 0.92f, 1.3f, scale.z * 0.92f);
            crowd.GetComponent<Renderer>().material = crowdMaterial;
            Destroy(crowd.GetComponent<Collider>());
        }

        private void CreateGoals()
        {
            var white = CreateMaterial(Color.white, 0.1f);
            CreateGoal(-1, white, true);
            CreateGoal(1, white, false);
        }

        private void CreateGoal(int side, Material material, bool homeGoal)
        {
            var z = side * (PitchLength / 2f + 0.25f);
            var left = -GoalWidth / 2f;
            var right = GoalWidth / 2f;

            CreatePost(new Vector3(left, GoalHeight / 2f, z), new Vector3(0.12f, GoalHeight, 0.12f), material);
            CreatePost(new Vector3(right, GoalHeight / 2f, z), new Vector3(0.12f, GoalHeight, 0.12f), material);
            CreatePost(new Vector3(0, GoalHeight, z), new Vector3(GoalWidth, 0.12f, 0.12f), material);

            var trigger = new GameObject(homeGoal ? "Home Goal Trigger" : "Away Goal Trigger");
            trigger.transform.SetParent(transform);
            trigger.transform.position = new Vector3(0f, GoalHeight * 0.5f, z + side * 1.15f);
            var collider = trigger.AddComponent<BoxCollider>();
            collider.isTrigger = true;
            collider.size = new Vector3(GoalWidth - 0.15f, GoalHeight, 2.2f);
            var goalTrigger = trigger.AddComponent<GoalTrigger>();
            goalTrigger.HomeGoal = homeGoal;
            goalTrigger.Match = this;
            CreateGoalNet(side, z, material);
        }

        private void CreatePost(Vector3 position, Vector3 scale, Material material)
        {
            var post = GameObject.CreatePrimitive(PrimitiveType.Cube);
            post.name = "Goal Post";
            post.transform.SetParent(transform);
            post.transform.position = position;
            post.transform.localScale = scale;
            post.GetComponent<Renderer>().material = material;
        }

        private void CreateBall()
        {
            var ballObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            ballObject.name = "FC2026 Match Ball";
            ballObject.transform.SetParent(transform);
            ballObject.transform.position = new Vector3(0f, 0.14f, 0f);
            ballObject.transform.localScale = Vector3.one * 0.22f;
            ballObject.GetComponent<Renderer>().material = CreateMaterial(new Color(0.96f, 0.97f, 1f), 0.28f);
            ballObject.AddComponent<Rigidbody>();
            ball = ballObject.AddComponent<BallController>();
        }

        private void CreateTeams()
        {
            var homeMaterial = CreateMaterial(new Color(0.96f, 0.96f, 0.99f), 0.3f);
            var awayMaterial = CreateMaterial(new Color(0.07f, 0.28f, 0.72f), 0.32f);
            var homeKeeperMaterial = CreateMaterial(new Color(0.95f, 0.65f, 0.08f), 0.3f);
            var awayKeeperMaterial = CreateMaterial(new Color(0.88f, 0.17f, 0.22f), 0.3f);
            var homeShorts = CreateMaterial(new Color(0.08f, 0.1f, 0.18f), 0.35f);
            var awayShorts = CreateMaterial(new Color(0.03f, 0.08f, 0.2f), 0.35f);

            for (var i = 0; i < homeFormation.Length; i++)
            {
                var height = 0.94f + ((i * 7) % 11) * 0.012f;
                if (i == 0) height = 1.10f;
                if (i == 9) height = 1.04f;
                var width = i is 2 or 3 or 9 ? 1.07f : 0.96f;
                var isUser = i == 9;
                var goalkeeper = i == 0;
                var player = CreatePlayer($"Home Player {i + 1}", homeFormation[i], goalkeeper ? homeKeeperMaterial : homeMaterial, homeShorts, height, width, isUser, 1, goalkeeper);
                if (isUser)
                    userPlayer = player.GetComponent<FootballPlayerController>();
            }

            for (var i = 0; i < homeFormation.Length; i++)
            {
                var mirrored = new Vector3(-homeFormation[i].x, 0f, -homeFormation[i].z);
                var height = 0.95f + ((i * 5) % 9) * 0.014f;
                if (i == 0) height = 1.08f;
                if (i == 9) height = 1.12f;
                var width = i is 0 or 2 or 3 or 9 ? 1.08f : 0.97f;
                var goalkeeper = i == 0;
                CreatePlayer($"Away Player {i + 1}", mirrored, goalkeeper ? awayKeeperMaterial : awayMaterial, awayShorts, height, width, false, -1, goalkeeper);
            }
        }

        private GameObject CreatePlayer(string name, Vector3 start, Material shirt, Material shorts, float heightScale, float widthScale, bool user, int attackDirection, bool goalkeeper = false)
        {
            var player = new GameObject(name);
            player.transform.SetParent(transform);
            player.transform.position = start;

            var rigidbody = player.AddComponent<Rigidbody>();
            rigidbody.mass = 78f;
            rigidbody.linearDamping = 4.2f;
            rigidbody.angularDamping = 8f;
            rigidbody.constraints = RigidbodyConstraints.FreezeRotation;
            rigidbody.interpolation = RigidbodyInterpolation.Interpolate;

            var capsule = player.AddComponent<CapsuleCollider>();
            capsule.height = 1.82f * heightScale;
            capsule.radius = 0.31f * widthScale;
            capsule.center = new Vector3(0, capsule.height / 2f, 0);

            var torso = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            torso.name = "3D Body";
            torso.transform.SetParent(player.transform);
            torso.transform.localPosition = new Vector3(0, 0.9f * heightScale, 0);
            torso.transform.localScale = new Vector3(0.62f * widthScale, 0.9f * heightScale, 0.5f * widthScale);
            torso.GetComponent<Renderer>().material = shirt;
            Destroy(torso.GetComponent<Collider>());

            var lower = GameObject.CreatePrimitive(PrimitiveType.Cube);
            lower.name = "Shorts";
            lower.transform.SetParent(player.transform);
            lower.transform.localPosition = new Vector3(0, 0.78f * heightScale, 0);
            lower.transform.localScale = new Vector3(0.62f * widthScale, 0.34f, 0.46f * widthScale);
            lower.GetComponent<Renderer>().material = shorts;
            Destroy(lower.GetComponent<Collider>());

            var skin = CreateMaterial(new Color(0.55f + (name.GetHashCode() & 3) * 0.07f, 0.34f, 0.22f), 0.38f);
            var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.transform.SetParent(player.transform);
            head.transform.localPosition = new Vector3(0, 1.95f * heightScale, 0.04f);
            head.transform.localScale = Vector3.one * 0.42f;
            head.GetComponent<Renderer>().material = skin;
            Destroy(head.GetComponent<Collider>());

            var hair = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            hair.name = "Hair";
            hair.transform.SetParent(head.transform);
            hair.transform.localPosition = new Vector3(0, 0.34f, -0.02f);
            hair.transform.localScale = new Vector3(1.02f, 0.45f, 1.02f);
            hair.GetComponent<Renderer>().material = CreateMaterial(new Color(0.035f, 0.025f, 0.02f), 0.52f);
            Destroy(hair.GetComponent<Collider>());

            var controller = player.AddComponent<FootballPlayerController>();
            controller.SetUserControlled(user);
            controller.TeamDirection = attackDirection;

            var ai = player.AddComponent<SimpleFootballAI>();
            ai.Configure(start, attackDirection, goalkeeper ? 0.9f : 0.92f + Random.value * 0.16f, goalkeeper);
            ai.enabled = !user;

            playerStarts.Add((player.transform, start));
            return player;
        }

        private void CreateBroadcastCamera()
        {
            var cameraObject = new GameObject("Broadcast Camera");
            cameraObject.transform.SetParent(transform);
            cameraObject.transform.position = new Vector3(0f, 27f, -31f);
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.allowHDR = true;
            cameraObject.AddComponent<AudioListener>();
            broadcastCamera = cameraObject.AddComponent<BroadcastCameraController>();
            broadcastCamera.Configure(ball.transform, userPlayer != null ? userPlayer.transform : null);
        }

        private Material CreateMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            return material;
        }

        public void RegisterGoal(bool homeGoal)
        {
            if (resetting)
                return;

            // Entering the home goal means the away side scored, and vice versa.
            if (homeGoal) awayScore++;
            else homeScore++;

            goalBanner = homeGoal ? "GOAL — AWAY" : "GOAL — HOME";
            commentary = homeGoal ? "GOAL for the away side! What a finish!" : "GOAL for the home side! The crowd erupts!";
            nextCommentaryAt = matchElapsed + 14f;
            goalBannerUntil = Time.time + 2.2f;
            StartCoroutine(ResetAfterGoal());
        }

        private IEnumerator ResetAfterGoal()
        {
            resetting = true;
            if (ball != null)
            {
                ball.Body.linearVelocity = Vector3.zero;
                ball.Body.angularVelocity = Vector3.zero;
            }

            yield return new WaitForSeconds(1.5f);

            if (ball != null)
                ball.ResetBall(new Vector3(0f, 0.14f, 0f));

            foreach (var entry in playerStarts)
            {
                if (entry.transform == null) continue;
                var rb = entry.transform.GetComponent<Rigidbody>();
                if (rb != null)
                {
                    rb.linearVelocity = Vector3.zero;
                    rb.angularVelocity = Vector3.zero;
                }
                entry.transform.position = entry.start;
            }

            resetting = false;
        }

        private void OnGUI()
        {
            scoreStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 24, 22, 48),
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };

            helpStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.UpperLeft,
                fontSize = Mathf.Clamp(Screen.height / 52, 13, 24),
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.82f, 0.92f, 1f) }
            };

            goalStyle ??= new GUIStyle(scoreStyle)
            {
                fontSize = Mathf.Clamp(Screen.height / 12, 38, 82),
                normal = { textColor = new Color(1f, 0.83f, 0.12f) }
            };

            buttonStyle ??= new GUIStyle(GUI.skin.button)
            {
                fontSize = Mathf.Clamp(Mathf.RoundToInt(Mathf.Clamp(Screen.height * 0.105f, 62f, 88f) / 6f), 10, 16),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white },
                hover = { textColor = Color.white },
                active = { textColor = Color.white }
            };

            labelSmallStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 65, 11, 18),
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.78f, 0.88f, 0.98f) }
            };

            var boardWidth = Mathf.Clamp(Screen.width * 0.34f, 260f, 470f);
            var boardRect = new Rect((Screen.width - boardWidth) * 0.5f, 12f, boardWidth, 62f);
            GUI.Box(boardRect, string.Empty);
            GUI.Label(new Rect(boardRect.x, boardRect.y + 2f, boardRect.width, 36f), $"HOME   {homeScore}  —  {awayScore}   AWAY", scoreStyle);
            GUI.Label(new Rect(boardRect.x, boardRect.y + 36f, boardRect.width, 20f), "FC 2026  •  FRIENDLY", labelSmallStyle);

            if (Application.isMobilePlatform)
                DrawMobileControls();
            else
                GUI.Label(new Rect(18f, Screen.height - 48f, Screen.width - 36f, 36f),
                    "WASD / arrows: move   •   Shift: sprint   •   Space: shoot   •   E: pass   •   Q: through ball   •   X: tackle   •   Tab: switch", helpStyle);

            if (Time.time < goalBannerUntil)
                GUI.Label(new Rect(0, Screen.height * 0.33f, Screen.width, 100f), goalBanner, goalStyle);

            commentaryStyle ??= new GUIStyle(GUI.skin.box)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 48, 14, 24),
                wordWrap = true,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
            GUI.Box(new Rect(Screen.width * 0.12f, 82f, Screen.width * 0.76f, 42f), commentary, commentaryStyle);
            var remaining = Mathf.Max(0f, MatchDurationSeconds - matchElapsed);
            GUI.Label(new Rect(Screen.width * 0.42f, 128f, Screen.width * 0.16f, 28f),
                $"{Mathf.FloorToInt(remaining / 60f):00}:{Mathf.FloorToInt(remaining % 60f):00}", labelSmallStyle);

            if (matchFinished)
            {
                fullTimeStyle ??= new GUIStyle(GUI.skin.label)
                {
                    alignment = TextAnchor.MiddleCenter,
                    fontSize = Mathf.Clamp(Screen.height / 16, 28, 54),
                    fontStyle = FontStyle.Bold,
                    normal = { textColor = Color.white }
                };
                var panel = new Rect(Screen.width * 0.18f, Screen.height * 0.28f, Screen.width * 0.64f, Screen.height * 0.42f);
                GUI.Box(panel, string.Empty);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 22f, panel.width - 24f, 62f), "FULL TIME", fullTimeStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 92f, panel.width - 24f, 58f),
                    $"HOME  {homeScore}  —  {awayScore}  AWAY", scoreStyle);
                if (GUI.Button(new Rect(panel.x + panel.width * 0.15f, panel.y + panel.height - 82f,
                    panel.width * 0.7f, 56f), "SAVE RESULT & RETURN TO CAREER", buttonStyle))
                    CompleteCareerMatch();
            }
        }

        private void UpdateCommentary()
        {
            string[] lines =
            {
                "Good pressure from the defence; there is no room to turn.",
                "The midfield battle is heating up as both teams look for a gap.",
                "A chance is building here — the runners are moving into space.",
                "The crowd is urging the players forward.",
                "A strong challenge wins the ball back in midfield.",
                "The passing needs to be quicker if they are to break through.",
                "Both teams are working hard to keep their shape."
            };
            commentary = lines[Random.Range(0, lines.Length)];
        }

        private void CompleteCareerMatch()
        {
            if (resultSaved) return;
            resultSaved = true;
            var save = CareerSaveSystem.Load();
            if (save != null)
            {
                save.played++;
                if (homeScore > awayScore) save.wins++;
                else if (homeScore < awayScore) save.losses++;
                else save.draws++;
                save.matchweek++;
                if (save.matchweek > 38)
                {
                    save.matchweek = 1;
                    save.season++;
                    save.transferBudget += 2500000;
                }
                if (!CareerSaveSystem.Save(save))
                    Debug.LogWarning("FC 2026: match finished, but career result could not be saved.");
            }
            // The hub and match manager share this root. Preserve it and remove only generated children.
            for (var i = transform.childCount - 1; i >= 0; i--)
                Destroy(transform.GetChild(i).gameObject);
            enabled = false;
            var hub = GetComponent<CareerHubManager>();
            if (hub != null)
            {
                hub.RefreshCareer();
                hub.enabled = true;
            }
        }

        private void DrawMobileControls()
        {
            if (userPlayer == null)
                return;

            var move = Vector2.zero;
            var radius = Mathf.Clamp(Screen.height * 0.115f, 64f, 94f);
            var joyCenter = new Vector2(radius + 28f, Screen.height - radius - 30f);
            var stickOffset = Vector2.zero;
            for (var i = 0; i < Input.touchCount; i++)
            {
                var touch = Input.GetTouch(i);
                var point = new Vector2(touch.position.x, Screen.height - touch.position.y);
                var delta = point - joyCenter;
                if (point.x < Screen.width * 0.44f && delta.sqrMagnitude <= radius * radius * 2.6f)
                {
                    stickOffset = Vector2.ClampMagnitude(delta, radius);
                    move = stickOffset / radius;
                    break;
                }
            }

            DrawJoystick(joyCenter, radius, stickOffset);

            var right = Screen.width - 24f;
            var bottom = Screen.height - 24f;
            var actionSize = Mathf.Clamp(Screen.height * 0.105f, 62f, 88f);
            var gap = actionSize * 0.13f;
            Rect ActionRect(int column, int row) => new Rect(
                right - actionSize - column * (actionSize + gap),
                bottom - actionSize - row * (actionSize + gap), actionSize, actionSize);

            if (GUI.Button(ActionRect(0, 0), "SHOOT", buttonStyle))
                userPlayer.QueueShot();
            if (GUI.Button(ActionRect(1, 0), "PASS", buttonStyle))
                userPlayer.QueuePass();
            if (GUI.Button(ActionRect(0, 1), "TACKLE", buttonStyle))
                userPlayer.QueueTackle();
            if (GUI.Button(ActionRect(1, 1), "THROUGH", buttonStyle))
                userPlayer.QueueThroughBall();
            var sprint = GUI.RepeatButton(ActionRect(0, 2), "SPRINT", buttonStyle);
            if (GUI.Button(ActionRect(1, 2), "SWITCH", buttonStyle))
                userPlayer.SwitchToNearestTeammate();
            if (GUI.Button(ActionRect(0, 3), "CHIP", buttonStyle))
                userPlayer.QueueChipShot();
            if (GUI.Button(ActionRect(1, 3), "FINESSE", buttonStyle))
                userPlayer.QueueFinesseShot();

            // Keep the analogue stick live while another finger taps an action.
            userPlayer.SetMobileMove(move, sprint);

            GUI.color = Color.white;
        }

        private void DrawJoystick(Vector2 center, float radius, Vector2 offset)
        {
            if (joystickDisc == null)
                CreateJoystickTexture();
            GUI.color = new Color(0.03f, 0.08f, 0.13f, 0.55f);
            GUI.DrawTexture(new Rect(center.x - radius, center.y - radius, radius * 2f, radius * 2f), joystickDisc);
            var knobRadius = radius * 0.39f;
            GUI.color = new Color(0.32f, 0.9f, 0.68f, 0.83f);
            var knobCenter = center + offset;
            GUI.DrawTexture(new Rect(knobCenter.x - knobRadius, knobCenter.y - knobRadius, knobRadius * 2f, knobRadius * 2f), joystickDisc);
            GUI.color = Color.white;
        }

        private void CreateJoystickTexture()
        {
            if (joystickDisc != null)
                return;
            const int size = 64;
            joystickDisc = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                name = "FC 2026 Virtual Joystick Disc",
                hideFlags = HideFlags.HideAndDontSave,
                filterMode = FilterMode.Bilinear
            };
            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
            {
                var distance = Vector2.Distance(new Vector2(x, y), new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f));
                var alpha = Mathf.Clamp01((size * 0.48f - distance) / 2f);
                joystickDisc.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }
            joystickDisc.Apply(false, true);
        }
    }
}
