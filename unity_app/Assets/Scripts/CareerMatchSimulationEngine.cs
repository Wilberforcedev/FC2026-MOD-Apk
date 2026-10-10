using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    public enum CareerMatchEventType { Kickoff, Shot, Goal, YellowCard, HalfTime, FullTime }

    [Serializable]
    public sealed class CareerMatchEvent
    {
        public int minute;
        public CareerMatchEventType type;
        public bool homeTeam;
        public string playerName;
        public string message;
    }

    public sealed class CareerMatchSimulationEngine : MonoBehaviour
    {
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private SeasonCalendarManager calendar;
        [SerializeField] private float gameMinutesPerSecond = 1f;
        [SerializeField] private int maxEvents = 80;

        private readonly List<CareerMatchEvent> events = new();
        private System.Random random;
        private float minuteAccumulator;
        private SeasonFixture fixture;
        private bool isRunning;
        private int homeScore;
        private int awayScore;

        public SeasonFixture Fixture => fixture;
        public IReadOnlyList<CareerMatchEvent> Events => events;
        public WorldClubDefinition HomeClub => database?.FindClub(fixture?.homeClubId);
        public WorldClubDefinition AwayClub => database?.FindClub(fixture?.awayClubId);
        public int CurrentMinute { get; private set; }
        public int HomeScore => homeScore;
        public int AwayScore => awayScore;
        public bool IsRunning => isRunning;
        public bool IsComplete { get; private set; }
        public float SimulationSpeed { get; private set; } = 1f;
        public event Action<CareerMatchEvent> EventAdded;
        public event Action StateChanged;
        public event Action<SeasonFixture> MatchCompleted;

        private void Awake()
        {
            database ??= FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            calendar ??= FindFirstObjectByType<SeasonCalendarManager>();
        }

        public void Configure(FootballWorldDatabase worldDatabase, SeasonCalendarManager seasonCalendar)
        {
            database = worldDatabase;
            calendar = seasonCalendar;
        }

        private void Update()
        {
            if (!isRunning || IsComplete) return;
            minuteAccumulator += Time.deltaTime * gameMinutesPerSecond * SimulationSpeed;
            while (minuteAccumulator >= 1f && CurrentMinute < 90)
            {
                minuteAccumulator -= 1f;
                SimulateMinute(++CurrentMinute);
            }
            if (CurrentMinute >= 90) FinishMatch();
        }

        public bool StartNextMatch()
        {
            if (calendar == null || database == null) return false;
            var next = calendar.NextFixture;
            if (next == null) return false;
            return StartFixture(next);
        }

        public bool StartFixture(SeasonFixture target)
        {
            if (target == null || database?.FindClub(target.homeClubId) == null || database.FindClub(target.awayClubId) == null) return false;
            fixture = target;
            random = new System.Random(StableHash(target.fixtureId));
            events.Clear();
            CurrentMinute = 0;
            homeScore = 0;
            awayScore = 0;
            minuteAccumulator = 0f;
            SimulationSpeed = 1f;
            IsComplete = false;
            isRunning = true;
            AddEvent(new CareerMatchEvent { minute = 0, type = CareerMatchEventType.Kickoff, message = $"Kick-off at {HomeClub.stadiumName}." });
            StateChanged?.Invoke();
            return true;
        }

        public void TogglePause()
        {
            if (fixture == null || IsComplete) return;
            isRunning = !isRunning;
            StateChanged?.Invoke();
        }

        public void SetSimulationSpeed(float speed)
        {
            SimulationSpeed = Mathf.Clamp(speed, .25f, 8f);
            StateChanged?.Invoke();
        }

        public void SkipToFullTime()
        {
            if (fixture == null || IsComplete) return;
            while (CurrentMinute < 90) SimulateMinute(++CurrentMinute);
            FinishMatch();
        }

        private void SimulateMinute(int minute)
        {
            var homeRating = TeamRating(fixture.homeClubId);
            var awayRating = TeamRating(fixture.awayClubId);
            var totalRating = Mathf.Max(1f, homeRating + awayRating);
            var homeChance = .012f + (homeRating / totalRating) * .018f;
            var awayChance = .012f + (awayRating / totalRating) * .018f;
            if (random.NextDouble() < homeChance) ScoreGoal(true, minute);
            else if (random.NextDouble() < awayChance) ScoreGoal(false, minute);
            else if (random.NextDouble() < .12) AddEvent(new CareerMatchEvent { minute = minute, type = CareerMatchEventType.Shot, homeTeam = random.NextDouble() < homeRating / totalRating, message = $"{minute}' A shot is saved by the goalkeeper." });
            else if (random.NextDouble() < .035) AddEvent(new CareerMatchEvent { minute = minute, type = CareerMatchEventType.YellowCard, homeTeam = random.NextDouble() < .5, message = $"{minute}' The referee shows a yellow card." });
            if (minute == 45) AddEvent(new CareerMatchEvent { minute = minute, type = CareerMatchEventType.HalfTime, message = "Half-time. The managers make their tactical adjustments." });
        }

        private void ScoreGoal(bool homeTeam, int minute)
        {
            if (homeTeam) homeScore++; else awayScore++;
            var scorer = Scorer(homeTeam);
            AddEvent(new CareerMatchEvent { minute = minute, type = CareerMatchEventType.Goal, homeTeam = homeTeam, playerName = scorer, message = $"{minute}' GOAL! {scorer} finds the net for {(homeTeam ? HomeClub.displayName : AwayClub.displayName)}." });
        }

        private void FinishMatch()
        {
            isRunning = false;
            IsComplete = true;
            CurrentMinute = 90;
            AddEvent(new CareerMatchEvent { minute = 90, type = CareerMatchEventType.FullTime, message = $"Full-time. {HomeClub.displayName} {homeScore}–{awayScore} {AwayClub.displayName}." });
            calendar?.RecordResult(fixture.fixtureId, homeScore, awayScore);
            MatchCompleted?.Invoke(fixture);
            StateChanged?.Invoke();
        }

        private void AddEvent(CareerMatchEvent matchEvent)
        {
            if (events.Count >= maxEvents) events.RemoveAt(0);
            events.Add(matchEvent);
            EventAdded?.Invoke(matchEvent);
        }

        private int TeamRating(string clubId)
        {
            var players = database.PlayersForClub(clubId);
            return players.Count == 0 ? 75 : Mathf.RoundToInt(players.Average(item => item.overall));
        }

        private string Scorer(bool homeTeam)
        {
            var clubId = homeTeam ? fixture.homeClubId : fixture.awayClubId;
            var players = database.PlayersForClub(clubId).Where(item => item.position is "ST" or "LW" or "RW" or "CAM").ToList();
            return players.Count == 0 ? (homeTeam ? HomeClub.shortName : AwayClub.shortName) : players[random.Next(players.Count)].displayName;
        }

        private static int StableHash(string value)
        {
            unchecked { var hash = 23; foreach (var character in value ?? string.Empty) hash = hash * 31 + character; return hash; }
        }
    }
}
