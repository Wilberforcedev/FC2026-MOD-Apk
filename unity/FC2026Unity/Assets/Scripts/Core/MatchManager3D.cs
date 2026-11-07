using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using FC2026.Gameplay;
using FC2026.World;

namespace FC2026.Core
{
    public sealed class MatchManager3D : MonoBehaviour
    {
        private const float PitchWidth = 68f;
        private const float PitchLength = 105f;
        private const float GoalWidth = 7.32f;
        private const float GoalHeight = 2.44f;

        private readonly List<(Transform transform, Vector3 start)> playerStarts = new();

        private const float HalfDurationSeconds = 90f;

        private BallController ball;
        private FootballPlayerController userPlayer;
        private BroadcastCameraController broadcastCamera;
        private int homeScore;
        private int awayScore;
        private bool resetting;
        private bool paused;
        private bool live;
        private bool halfTimePending;
        private int half;
        private float halfElapsed;
        private float autoSwitchTimer;
        private float homePossession;
        private float awayPossession;
        private GUIStyle scoreStyle;
        private GUIStyle helpStyle;
        private GUIStyle goalStyle;
        private float goalBannerUntil;
        private string goalBanner = string.Empty;
        private GUIStyle buttonStyle;
        private GUIStyle primaryButtonStyle;
        private GUIStyle flowButtonStyle;
        private GUIStyle panelStyle;
        private GUIStyle labelSmallStyle;
        private Texture2D joystickDisc;
        private Texture2D modalBackdrop;
        private float matchElapsed;
        private float nextCommentaryAt = 8f;
        private string commentary = "The referee gets us underway!";
        private bool matchFinished;
        private bool resultSaved;
        private GUIStyle commentaryStyle;
        private GUIStyle fullTimeStyle;

        private Vector3[] homeFormation;
        private string formationId = "4-3-3";
        private string homeTeamName = "HOME";
        private string awayTeamName = "AWAY";
        private WorldClub homeClub;
        private WorldClub awayClub;
        private CareerSaveData careerSave;
        private CareerNextFixture nextFixture;
        private bool cupTie;
        private bool cupShootoutPending;
        private CareerShootout cupShootout;
        private string matchLabel = "LEAGUE";

        public static MatchManager3D Instance { get; private set; }
        public static bool IsLive => Instance != null && Instance.live;
        public bool Live => live;

        private void Awake()
        {
            Instance = this;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Screen.orientation = ScreenOrientation.AutoRotation;
            Screen.autorotateToPortrait = false;
            Screen.autorotateToPortraitUpsideDown = false;
            Screen.autorotateToLandscapeLeft = true;
            Screen.autorotateToLandscapeRight = true;

            var career = CareerSaveSystem.Load();
            careerSave = career;
            formationId = career != null ? career.formationId : "4-3-3";
            homeFormation = CareerFormationSystem.GetPositions(career != null ? career.formationId : null,
                career != null ? career.tacticalStyle : null);
            ResolveTeamNames(career);

            BuildWorld();
            CreateJoystickTexture();
            StartCoroutine(StartMatch());
        }

        private void OnDestroy()
        {
            if (paused)
                Time.timeScale = 1f;
            if (Instance == this)
                Instance = null;
        }

        private void ResolveTeamNames(CareerSaveData career)
        {
            if (career == null)
                return;

            nextFixture = CareerLeagueSystem.GetNextFixture(career);
            cupTie = nextFixture.Kind == CareerFixtureKind.Cup;
            matchLabel = cupTie ? CareerCupSystem.ShortRoundName(nextFixture.Round) : "LEAGUE";

            homeClub = WorldDatabase.GetClub(career.managedClubId);
            awayClub = WorldDatabase.GetClub(nextFixture.OpponentClubId);
            homeTeamName = homeClub != null ? homeClub.Name : "HOME";
            awayTeamName = awayClub != null ? awayClub.Name : "AWAY";
        }

        private IEnumerator StartMatch()
        {
            yield return new WaitForSeconds(1.1f);
            yield return StartCoroutine(BeginKickoff(1, 0.7f));
        }

        private void Update()
        {
            if (matchFinished)
                return;

            if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P))
            {
                if (paused)
                    ResumeMatch();
                else if (live)
                    PauseMatch();
            }

            if (paused)
                return;

            if (userPlayer == null || !userPlayer.IsUserControlled)
                FindUserPlayer();

            if (halfTimePending || !live)
                return;

            halfElapsed += Time.deltaTime;
            matchElapsed += Time.deltaTime;
            TrackPossession();

            if (halfElapsed >= HalfDurationSeconds)
            {
                EndHalf();
                return;
            }

            if (matchElapsed >= nextCommentaryAt)
            {
                UpdateCommentary();
                nextCommentaryAt = matchElapsed + Random.Range(12f, 21f);
            }

            UpdateAutoSwitch();

            if (ball == null)
                return;

            var position = ball.transform.position;
            if (Mathf.Abs(position.x) > PitchWidth * 0.5f + 0.35f ||
                Mathf.Abs(position.z) > PitchLength * 0.5f + 0.35f || position.y < -2f)
            {
                HandleOutOfPlay(position);
            }
        }

        private void PauseMatch()
        {
            if (!live || paused)
                return;

            paused = true;
            live = false;
            Time.timeScale = 0f;
        }

        private void ResumeMatch()
        {
            if (!paused)
                return;

            paused = false;
            live = true;
            Time.timeScale = 1f;
        }

        private void FindUserPlayer()
        {
            foreach (var controller in FootballPlayerController.All)
            {
                if (controller == null || !controller.IsUserControlled)
                    continue;
                userPlayer = controller;
                broadcastCamera?.SetControlledPlayer(userPlayer.transform);
                return;
            }
        }

        private void TrackPossession()
        {
            var owner = ball != null ? ball.Owner : null;
            if (owner == null)
                return;

            if (owner.TeamId == 1) homePossession += Time.deltaTime;
            else awayPossession += Time.deltaTime;
        }

        private void UpdateAutoSwitch()
        {
            if (userPlayer == null || ball == null)
                return;

            autoSwitchTimer = Mathf.Max(0f, autoSwitchTimer - Time.deltaTime);
            if (autoSwitchTimer > 0f)
                return;

            var owner = ball.Owner;
            if (owner == null || owner.TeamDirection == userPlayer.TeamDirection)
                return;

            var ballPosition = ball.Position;
            var userDistance = FlatDistance(userPlayer.transform.position, ballPosition);
            var best = FootballPlayerController.FindNearestTo(ballPosition, userPlayer.TeamDirection, true);
            if (best == null || best == userPlayer)
                return;

            var bestDistance = FlatDistance(best.transform.position, ballPosition);
            if (bestDistance > userDistance - 5f)
                return;

            var switched = userPlayer.SwitchToNearestTeammate();
            if (switched != null && switched != userPlayer)
            {
                userPlayer = switched;
                broadcastCamera?.SetControlledPlayer(switched.transform);
                autoSwitchTimer = 0.9f;
            }
        }

        private static float FlatDistance(Vector3 a, Vector3 b)
        {
            a.y = 0f;
            b.y = 0f;
            return Vector3.Distance(a, b);
        }

        private void EndHalf()
        {
            if (half == 0)
            {
                halfTimePending = true;
                live = false;
                commentary = "Half time. The players head in for the break.";
                return;
            }

            FinishMatch();
        }

        public void BeginSecondHalf()
        {
            if (!halfTimePending)
                return;

            halfTimePending = false;
            half = 1;
            halfElapsed = 0f;
            commentary = "The second half is under way.";
            SwitchSides();
            StartCoroutine(BeginKickoff(1, 1.05f));
        }

        private void FinishMatch()
        {
            matchFinished = true;
            live = false;
            halfTimePending = false;
            commentary = "Full time! The referee brings the match to an end.";
            goalBannerUntil = 0f;

            if (!cupTie || homeScore != awayScore || careerSave == null)
                return;

            var tie = CareerCupSystem.GetUserTie(careerSave);
            if (tie == null)
                return;

            cupShootout = CareerCupSystem.SimulateShootout(careerSave, tie, tie.Round);
            cupShootoutPending = true;
            commentary = cupShootout.UserWon
                ? $"Penalties! {homeTeamName} win the shootout {cupShootout.UserScore}-{cupShootout.OpponentScore}."
                : $"Penalties! {awayTeamName} win the shootout {cupShootout.OpponentScore}-{cupShootout.UserScore}.";
        }

        private void SwitchSides()
        {
            foreach (var controller in FootballPlayerController.All)
            {
                if (controller == null)
                    continue;
                controller.FlipSides();
                var ai = controller.GetComponent<SimpleFootballAI>();
                if (ai != null)
                    ai.FlipSides();
            }

            for (var i = 0; i < playerStarts.Count; i++)
            {
                var entry = playerStarts[i];
                playerStarts[i] = (entry.transform, new Vector3(-entry.start.x, entry.start.y, -entry.start.z));
            }

            userPlayer?.ClearQueuedActions();
        }

        private IEnumerator BeginKickoff(int kickoffTeamDirection, float delay)
        {
            live = false;
            resetting = true;

            if (ball != null)
                ball.ResetBall(new Vector3(0f, 0.14f, 0f));

            foreach (var entry in playerStarts)
            {
                if (entry.transform == null) continue;
                var rigidbody = entry.transform.GetComponent<Rigidbody>();
                if (rigidbody != null)
                {
                    rigidbody.linearVelocity = Vector3.zero;
                    rigidbody.angularVelocity = Vector3.zero;
                }
                entry.transform.position = entry.start;
            }

            yield return new WaitForSeconds(delay);
            resetting = false;

            if (ball != null)
            {
                var taker = FootballPlayerController.FindNearestTo(new Vector3(0f, 0f, 0f), kickoffTeamDirection, true);
                if (taker != null)
                {
                    taker.transform.position = new Vector3(0f, taker.transform.position.y, -kickoffTeamDirection * 0.9f);
                    if (taker.Body != null)
                    {
                        taker.Body.linearVelocity = Vector3.zero;
                        taker.Body.angularVelocity = Vector3.zero;
                    }
                    ball.ForcePossession(taker);
                }
            }

            goalBanner = "KICK OFF";
            goalBannerUntil = Time.time + 1.1f;
            live = true;
        }

        private void HandleOutOfPlay(Vector3 position)
        {
            if (resetting)
                return;

            var lastDirection = LastTouchDirection();

            if (Mathf.Abs(position.x) > PitchWidth * 0.5f + 0.3f)
            {
                var awarded = lastDirection == 0 ? 1 : -lastDirection;
                var spot = new Vector3(
                    Mathf.Sign(position.x) * (PitchWidth * 0.5f - 0.5f),
                    0.14f,
                    Mathf.Clamp(position.z, -48f, 48f));
                StartCoroutine(RestartPlay(spot, awarded, false, 1.05f, "THROW-IN"));
                return;
            }

            if (Mathf.Abs(position.z) > PitchLength * 0.5f + 0.3f)
            {
                var side = Mathf.Sign(position.z);
                var defendingDirection = -side;
                if (lastDirection == defendingDirection)
                {
                    var awarded = -defendingDirection;
                    var cornerX = Mathf.Sign(position.x == 0f ? 1f : position.x) * (PitchWidth * 0.5f - 0.5f);
                    var spot = new Vector3(cornerX, 0.14f, side * (PitchLength * 0.5f - 0.5f));
                    StartCoroutine(RestartPlay(spot, awarded, false, 1.3f, "CORNER"));
                }
                else
                {
                    var spot = new Vector3(0f, 0.14f, side * (PitchLength * 0.5f - 5.5f));
                    StartCoroutine(RestartPlay(spot, defendingDirection, true, 1.1f, "GOAL KICK"));
                }
                return;
            }

            if (position.y < -2f)
                StartCoroutine(RestartPlay(new Vector3(0f, 0.14f, 0f), 1, false, 0.8f, "RESTART"));
        }

        private IEnumerator RestartPlay(Vector3 spot, int awardedDirection, bool useGoalkeeper, float delay, string label)
        {
            resetting = true;
            live = false;

            if (ball != null)
                ball.ResetBall(spot);

            yield return null;

            var taker = useGoalkeeper
                ? FindGoalkeeper(awardedDirection)
                : FootballPlayerController.FindNearestTo(spot, awardedDirection, true);

            if (taker != null && ball != null)
            {
                var standPosition = spot - new Vector3(0f, 0f, awardedDirection * 0.8f);
                standPosition.y = taker.transform.position.y;
                taker.transform.position = standPosition;
                taker.transform.rotation = Quaternion.LookRotation(new Vector3(0f, 0f, awardedDirection), Vector3.up);
                if (taker.Body != null)
                {
                    taker.Body.linearVelocity = Vector3.zero;
                    taker.Body.angularVelocity = Vector3.zero;
                }
                ball.ForcePossession(taker);
            }

            goalBanner = label;
            goalBannerUntil = Time.time + delay;
            commentary = label switch
            {
                "CORNER" => "A corner kick is awarded. Bodies pile into the box.",
                "GOAL KICK" => "The goalkeeper will restart play from the back.",
                "THROW-IN" => "A throw-in restarts the game down the touchline.",
                _ => "Play restarts."
            };

            yield return new WaitForSeconds(delay);
            resetting = false;
            live = true;
        }

        private int LastTouchDirection()
        {
            if (ball == null)
                return 0;
            if (ball.Owner != null)
                return ball.Owner.TeamDirection;

            var last = ball.LastKicker;
            var controller = last != null ? last.GetComponent<FootballPlayerController>() : null;
            return controller != null ? controller.TeamDirection : 0;
        }

        private static FootballPlayerController FindGoalkeeper(int teamDirection)
        {
            foreach (var controller in FootballPlayerController.All)
            {
                if (controller != null && controller.IsGoalkeeper && controller.TeamDirection == teamDirection)
                    return controller;
            }
            return null;
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
            StadiumPresentation.ApplyAtmosphere();
            RenderSettings.ambientLight = new Color(0.34f, 0.39f, 0.47f);

            var sun = new GameObject("Stadium Floodlight Sun");
            sun.transform.SetParent(transform);
            var light = sun.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.15f;
            light.color = new Color(1f, 0.95f, 0.88f);
            light.shadows = LightShadows.Soft;
            light.shadowStrength = 0.72f;
            sun.transform.rotation = Quaternion.Euler(46f, -38f, 0f);
            RenderSettings.sun = light;

            for (var i = 0; i < 4; i++)
            {
                var flood = new GameObject($"Floodlight {i + 1}");
                flood.transform.SetParent(transform);
                var spot = flood.AddComponent<Light>();
                spot.type = LightType.Spot;
                spot.range = 125f;
                spot.intensity = 340f;
                spot.spotAngle = 76f;
                spot.color = new Color(0.9f, 0.95f, 1f);
                spot.shadows = LightShadows.None;
                var x = i % 2 == 0 ? -39f : 39f;
                var z = i < 2 ? -46f : 46f;
                flood.transform.position = new Vector3(x, 24f, z);
                flood.transform.LookAt(Vector3.zero);
            }

            var metal = StadiumPresentation.CreateMetalMaterial();
            var glow = StadiumPresentation.CreateFloodlightMaterial();
            StadiumPresentation.CreateFloodlightTowers(transform, metal, glow);
        }

        private void CreatePitch()
        {
            var grass = StadiumPresentation.CreateGrassMaterial();
            var line = CreateMaterial(new Color(0.95f, 0.97f, 1f), 0.2f);

            var pitch = GameObject.CreatePrimitive(PrimitiveType.Plane);
            pitch.name = "3D Pitch";
            pitch.transform.SetParent(transform);
            pitch.transform.localScale = new Vector3(PitchWidth / 10f, 1f, PitchLength / 10f);
            pitch.GetComponent<Renderer>().material = grass;

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
            var crowdBlue = StadiumPresentation.CreateCrowdMaterial(new Color(0.12f, 0.3f, 0.6f), new Color(0.92f, 0.92f, 0.95f));
            var crowdGold = StadiumPresentation.CreateCrowdMaterial(new Color(0.75f, 0.45f, 0.06f), new Color(0.92f, 0.9f, 0.82f));

            CreateStand("West Stand", new Vector3(-47f, 6f, 0), new Vector3(20f, 12f, 118f), concrete, crowdBlue);
            CreateStand("East Stand", new Vector3(47f, 6f, 0), new Vector3(20f, 12f, 118f), concrete, crowdGold);
            CreateStand("North Stand", new Vector3(0, 6f, 66f), new Vector3(76f, 12f, 20f), concrete, crowdBlue);
            CreateStand("South Stand", new Vector3(0, 6f, -66f), new Vector3(76f, 12f, 20f), concrete, crowdGold);

            var canopy = CreateMaterial(new Color(0.025f, 0.04f, 0.065f), 0.62f);
            CreateStadiumBlock("West Canopy", new Vector3(-47f, 17.6f, 0f), new Vector3(21f, 0.8f, 120f), canopy);
            CreateStadiumBlock("East Canopy", new Vector3(47f, 17.6f, 0f), new Vector3(21f, 0.8f, 120f), canopy);
            CreateStadiumBlock("North Canopy", new Vector3(0f, 17.6f, 66f), new Vector3(78f, 0.8f, 21f), canopy);
            CreateStadiumBlock("South Canopy", new Vector3(0f, 17.6f, -66f), new Vector3(78f, 0.8f, 21f), canopy);

            var fascia = StadiumPresentation.CreateAdBoardMaterial(new Color(0.12f, 0.68f, 0.9f));
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

            var horizontal = scale.x > scale.z;
            var inward = horizontal
                ? new Vector3(0f, 0f, -Mathf.Sign(position.z))
                : new Vector3(-Mathf.Sign(position.x), 0f, 0f);
            var halfDepth = (horizontal ? scale.z : scale.x) * 0.5f;
            var tierDepth = halfDepth * 0.3f;

            for (var tier = 0; tier < 3; tier++)
            {
                var tierPosition = position
                                   + inward * (halfDepth - tier * tierDepth - tierDepth * 0.5f)
                                   + Vector3.up * (-4.6f + tier * 3.4f);
                var tierScale = horizontal
                    ? new Vector3(scale.x * 0.94f, 1.1f, tierDepth)
                    : new Vector3(tierDepth, 1.1f, scale.z * 0.94f);
                CreateStadiumBlock($"{name} Tier {tier + 1}", tierPosition, tierScale, crowdMaterial);
            }

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
            ballObject.GetComponent<Renderer>().material = StadiumPresentation.CreateBallMaterial();
            ballObject.AddComponent<Rigidbody>();
            ball = ballObject.AddComponent<BallController>();
        }

        private void CreateTeams()
        {
            var homePrimary = homeClub != null ? ToColor(homeClub.PrimaryColor) : new Color(0.96f, 0.96f, 0.99f);
            var homeSecondary = homeClub != null ? ToColor(homeClub.SecondaryColor) : new Color(0.08f, 0.1f, 0.18f);
            var awayPrimary = awayClub != null ? ToColor(awayClub.PrimaryColor) : new Color(0.07f, 0.28f, 0.72f);
            var awaySecondary = awayClub != null ? ToColor(awayClub.SecondaryColor) : new Color(0.03f, 0.08f, 0.2f);
            if (homeClub != null && awayClub != null && awayClub.PrimaryColor.DistanceTo(homeClub.PrimaryColor) < 0.4f)
            {
                awayPrimary = awayClub.SecondaryColor.DistanceTo(homeClub.PrimaryColor) >= 0.4f
                    ? ToColor(awayClub.SecondaryColor)
                    : homePrimary.grayscale > 0.5f
                        ? new Color(0.07f, 0.12f, 0.26f)
                        : new Color(0.96f, 0.96f, 0.99f);
            }

            var homeShirt = CreateMaterial(homePrimary, 0.3f);
            var awayShirt = CreateMaterial(awayPrimary, 0.32f);
            var homeKeeper = CreateMaterial(homeClub != null ? ToColor(homeClub.GoalkeeperColor) : new Color(0.95f, 0.65f, 0.08f), 0.3f);
            var awayKeeper = CreateMaterial(awayClub != null ? ToColor(awayClub.GoalkeeperColor) : new Color(0.88f, 0.17f, 0.22f), 0.3f);
            var homeShorts = CreateMaterial(homeSecondary, 0.35f);
            var awayShorts = CreateMaterial(awaySecondary, 0.35f);

            var homeLineup = BuildLineup(
                CareerTransferSystem.GetSquad(careerSave, homeClub != null ? homeClub.Id : string.Empty));
            var awayLineup = BuildLineup(
                CareerTransferSystem.GetSquad(careerSave, awayClub != null ? awayClub.Id : string.Empty));

            for (var i = 0; i < homeFormation.Length; i++)
            {
                var player = homeLineup[i];
                var role = RoleForIndex(i, formationId);
                var isUser = i == 9;
                var created = CreatePlayer(
                    player != null ? player.Name : $"Home Player {i + 1}",
                    homeFormation[i],
                    role == PlayerRole.Goalkeeper ? homeKeeper : homeShirt,
                    homeShorts,
                    HeightScaleFor(player, i),
                    WidthScaleFor(player, i),
                    isUser,
                    1,
                    role,
                    ShootingFor(player),
                    PassingFor(player),
                    SpeedFor(player),
                    player != null ? player.SkinTone : -1,
                    player != null ? player.HairColor : -1,
                    player != null ? player.FaceVariant : -1);
                if (isUser)
                    userPlayer = created.GetComponent<FootballPlayerController>();
            }

            for (var i = 0; i < homeFormation.Length; i++)
            {
                var player = awayLineup[i];
                var mirrored = new Vector3(-homeFormation[i].x, 0f, -homeFormation[i].z);
                var role = RoleForIndex(i, formationId);
                CreatePlayer(
                    player != null ? player.Name : $"Away Player {i + 1}",
                    mirrored,
                    role == PlayerRole.Goalkeeper ? awayKeeper : awayShirt,
                    awayShorts,
                    HeightScaleFor(player, i + 11),
                    WidthScaleFor(player, i + 11),
                    false,
                    -1,
                    role,
                    ShootingFor(player),
                    PassingFor(player),
                    SpeedFor(player),
                    player != null ? player.SkinTone : -1,
                    player != null ? player.HairColor : -1,
                    player != null ? player.FaceVariant : -1);
            }
        }

        private WorldPlayer[] BuildLineup(WorldPlayer[] squad)
        {
            var lineup = new WorldPlayer[homeFormation.Length];
            if (squad == null || squad.Length == 0)
                return lineup;

            var keepers = squad.Where(item => item != null && item.Position == PlayerPosition.Goalkeeper)
                .OrderByDescending(item => item.Overall).ToArray();
            var defenders = squad.Where(item => item != null && item.Position == PlayerPosition.Defender)
                .OrderByDescending(item => item.Overall).ToArray();
            var midfielders = squad.Where(item => item != null && item.Position == PlayerPosition.Midfielder)
                .OrderByDescending(item => item.Overall).ToArray();
            var forwards = squad.Where(item => item != null && item.Position == PlayerPosition.Forward)
                .OrderByDescending(item => item.Overall).ToArray();

            var keeperIndex = 0;
            var defenderIndex = 0;
            var midfielderIndex = 0;
            var forwardIndex = 0;
            for (var i = 0; i < lineup.Length; i++)
            {
                var role = RoleForIndex(i, formationId);
                lineup[i] = role switch
                {
                    PlayerRole.Goalkeeper => NextPlayer(keepers, ref keeperIndex),
                    PlayerRole.Defender => NextPlayer(defenders, ref defenderIndex),
                    PlayerRole.Midfielder => NextPlayer(midfielders, ref midfielderIndex),
                    _ => NextPlayer(forwards, ref forwardIndex)
                };
            }
            return lineup;
        }

        private static WorldPlayer NextPlayer(WorldPlayer[] players, ref int index)
        {
            if (players.Length == 0)
                return null;
            var player = players[Mathf.Min(index, players.Length - 1)];
            index++;
            return player;
        }

        private static PlayerRole RoleForIndex(int index, string formation)
        {
            if (index == 0)
                return PlayerRole.Goalkeeper;

            return formation switch
            {
                "4-2-3-1" => index <= 4 ? PlayerRole.Defender : index <= 9 ? PlayerRole.Midfielder : PlayerRole.Forward,
                "4-4-2" => index <= 4 ? PlayerRole.Defender : index <= 8 ? PlayerRole.Midfielder : PlayerRole.Forward,
                "3-5-2" => index <= 3 ? PlayerRole.Defender : index <= 8 ? PlayerRole.Midfielder : PlayerRole.Forward,
                _ => index <= 4 ? PlayerRole.Defender : index <= 7 ? PlayerRole.Midfielder : PlayerRole.Forward
            };
        }

        private static float Attribute01(int value)
        {
            return Mathf.Clamp01((value - 40f) / 54f);
        }

        private static float ShootingFor(WorldPlayer player)
        {
            return player == null ? 0.6f : Mathf.Lerp(0.32f, 0.95f, Attribute01(player.Shooting));
        }

        private static float PassingFor(WorldPlayer player)
        {
            return player == null ? 0.6f : Mathf.Lerp(0.32f, 0.95f, Attribute01(player.Passing));
        }

        private static float SpeedFor(WorldPlayer player)
        {
            return player == null ? 0.96f : 0.88f + Attribute01(player.Pace) * 0.26f;
        }

        private static float HeightScaleFor(WorldPlayer player, int index)
        {
            if (player != null)
                return Mathf.Clamp(player.HeightCm / 182f, 0.88f, 1.18f);
            return 0.95f + ((index * 7) % 11) * 0.012f;
        }

        private static float WidthScaleFor(WorldPlayer player, int index)
        {
            if (player != null)
                return Mathf.Clamp(0.9f + Attribute01(player.Physical) * 0.24f, 0.82f, 1.18f);
            return index is 2 or 3 or 9 ? 1.07f : 0.96f;
        }

        private static Color ToColor(WorldColor color)
        {
            return new Color(color.R, color.G, color.B);
        }

        private static Color SkinColorFor(int skinTone)
        {
            switch (Mathf.Clamp(skinTone, 0, 4))
            {
                case 0:
                    return new Color(0.86f, 0.68f, 0.55f);
                case 1:
                    return new Color(0.76f, 0.56f, 0.42f);
                case 2:
                    return new Color(0.64f, 0.44f, 0.31f);
                case 3:
                    return new Color(0.45f, 0.29f, 0.20f);
                default:
                    return new Color(0.32f, 0.20f, 0.14f);
            }
        }

        private static Color HairColorFor(int hairColor)
        {
            switch (Mathf.Clamp(hairColor, 0, 3))
            {
                case 0:
                    return new Color(0.035f, 0.025f, 0.02f);
                case 1:
                    return new Color(0.13f, 0.08f, 0.05f);
                case 2:
                    return new Color(0.26f, 0.16f, 0.08f);
                default:
                    return new Color(0.62f, 0.48f, 0.24f);
            }
        }

        private GameObject CreatePlayer(string name, Vector3 start, Material shirt, Material shorts, float heightScale, float widthScale,
            bool user, int attackDirection, PlayerRole role, float shooting, float passing, float speed,
            int skinTone, int hairColor, int faceVariant)
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

            var resolvedSkinTone = skinTone >= 0 ? skinTone : (name.GetHashCode() & int.MaxValue) % 3;
            var resolvedHairColor = hairColor >= 0 ? hairColor : (name.GetHashCode() & int.MaxValue) % 4;
            var skin = CreateMaterial(SkinColorFor(resolvedSkinTone), 0.38f);
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
            hair.GetComponent<Renderer>().material = CreateMaterial(HairColorFor(resolvedHairColor), 0.52f);
            Destroy(hair.GetComponent<Collider>());

            var controller = player.AddComponent<FootballPlayerController>();
            controller.Configure(role, start, attackDirection, shooting, passing,
                resolvedSkinTone, resolvedHairColor, faceVariant);
            controller.SetUserControlled(user);

            var ai = player.AddComponent<SimpleFootballAI>();
            ai.Configure(start, attackDirection, role, role == PlayerRole.Goalkeeper ? 0.9f : speed);
            ai.enabled = !user;

            playerStarts.Add((player.transform, start));
            return player;
        }

        private void CreateBroadcastCamera()
        {
            var previousHubCamera = transform.Find("Career Hub Camera");
            if (previousHubCamera != null)
                previousHubCamera.gameObject.SetActive(false);

            var cameraObject = new GameObject("Broadcast Camera");
            cameraObject.transform.SetParent(transform);
            cameraObject.transform.position = new Vector3(0f, 27f, -31f);
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.allowHDR = true;
            camera.depth = 1f;
            cameraObject.AddComponent<AudioListener>();
            broadcastCamera = cameraObject.AddComponent<BroadcastCameraController>();
            broadcastCamera.Configure(ball.transform, userPlayer != null ? userPlayer.transform : null);
        }

        private Material CreateMaterial(Color color, float smoothness)
        {
            var shader = Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Sprites/Default");
            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            return material;
        }

        public void RegisterGoal(bool homeGoal)
        {
            if (resetting || matchFinished || !live)
                return;

            var goalSide = homeGoal ? -1 : 1;
            var scoringTeamId = 1;
            foreach (var controller in FootballPlayerController.All)
            {
                if (controller != null && controller.TeamDirection == goalSide)
                {
                    scoringTeamId = controller.TeamId;
                    break;
                }
            }

            if (scoringTeamId == 1) homeScore++;
            else awayScore++;

            var scoringName = scoringTeamId == 1 ? homeTeamName : awayTeamName;
            goalBanner = $"GOAL — {scoringName.ToUpperInvariant()}";
            commentary = $"GOAL for {scoringName}! The crowd erupts!";
            nextCommentaryAt = matchElapsed + 14f;
            goalBannerUntil = Time.time + 2.4f;
            StartCoroutine(ResetAfterGoal(homeGoal));
        }

        private IEnumerator ResetAfterGoal(bool homeGoal)
        {
            resetting = true;
            live = false;
            if (ball != null)
            {
                ball.Body.linearVelocity = Vector3.zero;
                ball.Body.angularVelocity = Vector3.zero;
            }

            yield return new WaitForSeconds(1.5f);
            yield return StartCoroutine(BeginKickoff(homeGoal ? 1 : -1, 0.9f));
            resetting = false;
        }

        private void OnGUI()
        {
            scoreStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 30, 18, 34),
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
                normal = { textColor = HubTheme.GoldTextColor }
            };

            var hudButtonFontSize = Mathf.Clamp(
                Mathf.RoundToInt(Mathf.Clamp(Screen.height * 0.105f, 62f, 88f) / 6f), 10, 16);
            buttonStyle ??= HubTheme.SecondaryButton(hudButtonFontSize);
            primaryButtonStyle ??= HubTheme.PrimaryButton(hudButtonFontSize);
            flowButtonStyle ??= HubTheme.PrimaryButton(Mathf.Clamp(Screen.height / 36, 14, 22));
            panelStyle ??= HubTheme.Panel();

            labelSmallStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 65, 11, 18),
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.78f, 0.88f, 0.98f) }
            };

            var boardWidth = Mathf.Clamp(Screen.width * 0.46f, 320f, 640f);
            var boardRect = new Rect((Screen.width - boardWidth) * 0.5f, 10f, boardWidth, 84f);
            GUI.Box(boardRect, string.Empty, panelStyle);
            GUI.Label(new Rect(boardRect.x, boardRect.y + 2f, boardRect.width, 20f),
                $"{matchLabel}   •   {homeTeamName.ToUpperInvariant()}   •   {awayTeamName.ToUpperInvariant()}", labelSmallStyle);
            GUI.Label(new Rect(boardRect.x, boardRect.y + 19f, boardRect.width, 38f), $"{homeScore}  —  {awayScore}", scoreStyle);

            var totalPossession = homePossession + awayPossession;
            var homePossessionPercent = totalPossession > 0.5f ? Mathf.RoundToInt(homePossession / totalPossession * 100f) : 50;
            var minute = Mathf.Clamp(half * 45 + Mathf.FloorToInt(halfElapsed / HalfDurationSeconds * 45f), 0, 90);
            GUI.Label(new Rect(boardRect.x, boardRect.y + 60f, boardRect.width, 20f),
                $"{(half == 0 ? "1ST HALF" : "2ND HALF")}  {minute:00}'   •   POSSESSION {homePossessionPercent}% - {100 - homePossessionPercent}%",
                labelSmallStyle);

            if (Application.isMobilePlatform)
            {
                if (live && !halfTimePending && !matchFinished)
                {
                    var pauseRect = new Rect(Screen.width - 118f, 18f, 102f, 44f);
                    if (GUI.Button(pauseRect, "PAUSE", buttonStyle))
                        PauseMatch();
                    DrawMobileControls();
                }
            }
            else
                GUI.Label(new Rect(18f, Screen.height - 48f, Screen.width - 36f, 36f),
                    "WASD / arrows: move   •   Shift: sprint   •   Space: shoot   •   E: pass   •   Q: through ball   •   X: tackle   •   Tab: switch   •   P / Esc: pause", helpStyle);

            if (Time.time < goalBannerUntil)
                GUI.Label(new Rect(0, Screen.height * 0.33f, Screen.width, 100f), goalBanner, goalStyle);

            commentaryStyle ??= new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 48, 14, 24),
                wordWrap = true,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
            var commentaryRect = new Rect(Screen.width * 0.12f, 100f, Screen.width * 0.76f, 42f);
            GUI.Box(commentaryRect, string.Empty, panelStyle);
            GUI.Label(commentaryRect, commentary, commentaryStyle);

            if (paused || halfTimePending || matchFinished)
            {
                modalBackdrop ??= HubTheme.SolidTexture(new Color(0.02f, 0.035f, 0.05f, 0.72f));
                GUI.DrawTexture(new Rect(0f, 0f, Screen.width, Screen.height), modalBackdrop);
            }

            if (paused)
            {
                fullTimeStyle ??= CreatePanelStyle();
                var panelWidth = Mathf.Min(Screen.width * 0.7f, 500f);
                var panelHeight = Mathf.Clamp(Screen.height * 0.38f, 180f, 240f);
                var panel = new Rect((Screen.width - panelWidth) * 0.5f, (Screen.height - panelHeight) * 0.5f,
                    panelWidth, panelHeight);
                GUI.Box(panel, string.Empty, panelStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 20f, panel.width - 24f, 58f), "MATCH PAUSED", fullTimeStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 80f, panel.width - 24f, 42f),
                    $"{homeTeamName}  {homeScore}  —  {awayScore}  {awayTeamName}", scoreStyle);
                var resumeRect = new Rect(panel.x + panel.width * 0.16f, panel.y + panel.height - 70f,
                    panel.width * 0.68f, 50f);
                if (GUI.Button(resumeRect, "RESUME MATCH", flowButtonStyle))
                    ResumeMatch();
            }

            if (halfTimePending)
            {
                fullTimeStyle ??= CreatePanelStyle();
                var panel = new Rect(Screen.width * 0.2f, Screen.height * 0.3f, Screen.width * 0.6f, Screen.height * 0.36f);
                GUI.Box(panel, string.Empty, panelStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 20f, panel.width - 24f, 56f), "HALF TIME", fullTimeStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 84f, panel.width - 24f, 52f),
                    $"{homeTeamName}  {homeScore}  —  {awayScore}  {awayTeamName}", scoreStyle);
                if (GUI.Button(new Rect(panel.x + panel.width * 0.16f, panel.y + panel.height - 76f,
                    panel.width * 0.68f, 54f), "START SECOND HALF", flowButtonStyle))
                    BeginSecondHalf();
            }

            if (matchFinished)
            {
                fullTimeStyle ??= CreatePanelStyle();
                var panel = new Rect(Screen.width * 0.18f, Screen.height * 0.28f, Screen.width * 0.64f, Screen.height * 0.42f);
                GUI.Box(panel, string.Empty, panelStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 22f, panel.width - 24f, 62f),
                    cupShootoutPending ? "PENALTIES" : "FULL TIME", fullTimeStyle);
                GUI.Label(new Rect(panel.x + 12f, panel.y + 92f, panel.width - 24f, 58f),
                    $"{homeTeamName}  {homeScore}  —  {awayScore}  {awayTeamName}", scoreStyle);
                if (cupShootoutPending)
                    GUI.Label(new Rect(panel.x + 12f, panel.y + 146f, panel.width - 24f, 32f),
                        $"SHOOTOUT  {cupShootout.UserScore} — {cupShootout.OpponentScore}  •  {(cupShootout.UserWon ? homeTeamName + " ADVANCE" : awayTeamName + " ADVANCE")}",
                        labelSmallStyle);
                if (GUI.Button(new Rect(panel.x + panel.width * 0.15f, panel.y + panel.height - 82f,
                    panel.width * 0.7f, 56f), "SAVE RESULT & RETURN TO CAREER", flowButtonStyle))
                    CompleteCareerMatch();
            }
        }

        private static GUIStyle CreatePanelStyle()
        {
            return new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = Mathf.Clamp(Screen.height / 16, 28, 54),
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
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
                // The managed club always plays the left/home side of this scene,
                // so homeScore belongs to the user regardless of the fixture venue.
                if (!CareerLeagueSystem.CompleteNextFixture(save, homeScore, awayScore))
                    Debug.LogWarning("FC 2026: could not apply this match to the career.");
                else if (!CareerSaveSystem.Save(save))
                    Debug.LogWarning("FC 2026: match finished, but career result could not be saved.");
            }
            // The hub and match manager share this root. Preserve it and remove only generated children.
            for (var i = transform.childCount - 1; i >= 0; i--)
                Destroy(transform.GetChild(i).gameObject);

            var hasActiveCamera = false;
            foreach (var candidateCamera in FindObjectsByType<Camera>(FindObjectsSortMode.None))
            {
                if (candidateCamera == null)
                    continue;
                if (candidateCamera.transform.IsChildOf(transform))
                {
                    candidateCamera.gameObject.SetActive(false);
                    continue;
                }
                hasActiveCamera = true;
            }

            if (!hasActiveCamera)
            {
                var hubCameraObject = new GameObject("Career Hub Camera");
                hubCameraObject.transform.SetParent(transform);
                hubCameraObject.transform.position = new Vector3(0f, 1.8f, -7f);
                hubCameraObject.transform.rotation = Quaternion.Euler(3f, 0f, 0f);
                var hubCamera = hubCameraObject.AddComponent<Camera>();
                hubCamera.clearFlags = CameraClearFlags.SolidColor;
                hubCamera.backgroundColor = new Color(0.015f, 0.04f, 0.07f);
                hubCamera.fieldOfView = 60f;
                hubCamera.nearClipPlane = 0.1f;
                hubCamera.farClipPlane = 120f;
                hubCameraObject.AddComponent<AudioListener>();
            }

            var hub = GetComponent<CareerHubManager>();
            if (hub != null)
            {
                hub.RefreshCareer();
                hub.enabled = true;
            }

            // Remove this match component so the career hub can create a fresh manager
            // next time. Merely disabling it leaves a stale component that blocks rematches.
            Destroy(this);
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

            if (GUI.Button(ActionRect(0, 0), "SHOOT", primaryButtonStyle))
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
