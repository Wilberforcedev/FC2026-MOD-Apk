using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    [Serializable]
    public sealed class SeasonFixture
    {
        public string fixtureId;
        public string competitionId;
        public string leagueId;
        public int season;
        public int matchweek;
        public string homeClubId;
        public string awayClubId;
        public bool isPlayed;
        public int homeGoals;
        public int awayGoals;
    }

    [Serializable]
    public sealed class ClubSeasonStanding
    {
        public string clubId;
        public int played;
        public int wins;
        public int draws;
        public int losses;
        public int goalsFor;
        public int goalsAgainst;
        public int points;
        public int GoalDifference => goalsFor - goalsAgainst;
    }

    public sealed class SeasonCalendarManager : MonoBehaviour
    {
        [SerializeField] private FootballWorldDatabase database;
        [SerializeField] private int season = 1;
        [SerializeField] private string leagueId = "continental-premier";
        [SerializeField] private List<SeasonFixture> fixtures = new();
        [SerializeField] private List<ClubSeasonStanding> standings = new();

        public int Season => season;
        public string LeagueId => leagueId;
        public IReadOnlyList<SeasonFixture> Fixtures => fixtures;
        public IReadOnlyList<ClubSeasonStanding> Standings => standings.OrderByDescending(item => item.points).ThenByDescending(item => item.GoalDifference).ThenByDescending(item => item.goalsFor).ToList();
        public event Action CalendarChanged;

        public void Configure(FootballWorldDatabase worldDatabase) => database = worldDatabase;

        public bool GenerateSeason(string targetLeagueId, int targetSeason = 1)
        {
            if (database == null) database = FindFirstObjectByType<FootballWorldCatalogLoader>()?.Database;
            var clubs = database?.ClubsForLeague(targetLeagueId).ToList();
            if (clubs == null || clubs.Count < 2) return false;
            leagueId = targetLeagueId;
            season = targetSeason;
            fixtures = GenerateDoubleRoundRobin(clubs, targetLeagueId, targetSeason);
            standings = clubs.Select(club => new ClubSeasonStanding { clubId = club.id }).ToList();
            CalendarChanged?.Invoke();
            return true;
        }

        public IReadOnlyList<SeasonFixture> FixturesForMatchweek(int matchweek) => fixtures.Where(item => item.matchweek == matchweek).ToList();
        public SeasonFixture NextFixture => fixtures.FirstOrDefault(item => !item.isPlayed);
        public ClubSeasonStanding StandingForClub(string clubId) => standings.FirstOrDefault(item => item.clubId == clubId);

        public bool RecordResult(string fixtureId, int homeGoals, int awayGoals)
        {
            var fixture = fixtures.FirstOrDefault(item => item.fixtureId == fixtureId);
            if (fixture == null || fixture.isPlayed || homeGoals < 0 || awayGoals < 0) return false;
            fixture.isPlayed = true;
            fixture.homeGoals = homeGoals;
            fixture.awayGoals = awayGoals;
            var home = StandingForClub(fixture.homeClubId);
            var away = StandingForClub(fixture.awayClubId);
            if (home == null || away == null) return false;
            home.played++; away.played++;
            home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
            away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
            if (homeGoals > awayGoals) { home.wins++; home.points += 3; away.losses++; }
            else if (awayGoals > homeGoals) { away.wins++; away.points += 3; home.losses++; }
            else { home.draws++; away.draws++; home.points++; away.points++; }
            CalendarChanged?.Invoke();
            return true;
        }

        public void ClearCalendar()
        {
            fixtures.Clear(); standings.Clear(); CalendarChanged?.Invoke();
        }

        private static List<SeasonFixture> GenerateDoubleRoundRobin(IReadOnlyList<WorldClubDefinition> sourceClubs, string targetLeagueId, int targetSeason)
        {
            var clubs = sourceClubs.ToList();
            if (clubs.Count % 2 != 0) clubs.Add(null);
            var roundCount = clubs.Count - 1;
            var halfRoundCount = clubs.Count / 2;
            var firstLeg = new List<SeasonFixture>();
            var rotation = clubs.ToList();
            for (var round = 0; round < roundCount; round++)
            {
                for (var pair = 0; pair < halfRoundCount; pair++)
                {
                    var first = rotation[pair];
                    var second = rotation[rotation.Count - 1 - pair];
                    if (first == null || second == null) continue;
                    var home = (round + pair) % 2 == 0 ? first : second;
                    var away = home == first ? second : first;
                    firstLeg.Add(new SeasonFixture
                    {
                        fixtureId = $"s{targetSeason}-{targetLeagueId}-w{round + 1}-{pair + 1}-1",
                        competitionId = $"{targetLeagueId}-league",
                        leagueId = targetLeagueId,
                        season = targetSeason,
                        matchweek = round + 1,
                        homeClubId = home.id,
                        awayClubId = away.id
                    });
                }
                rotation = Rotate(rotation);
            }
            var secondLeg = firstLeg.Select(fixture => new SeasonFixture
            {
                fixtureId = fixture.fixtureId.Replace("-1", "-2"), competitionId = fixture.competitionId, leagueId = fixture.leagueId, season = fixture.season,
                matchweek = fixture.matchweek + roundCount, homeClubId = fixture.awayClubId, awayClubId = fixture.homeClubId
            });
            return firstLeg.Concat(secondLeg).OrderBy(item => item.matchweek).ThenBy(item => item.fixtureId).ToList();
        }

        private static List<WorldClubDefinition> Rotate(List<WorldClubDefinition> clubs)
        {
            var next = clubs.ToList();
            var fixedClub = next[0];
            var moving = next.Skip(1).ToList();
            var last = moving[^1];
            moving.RemoveAt(moving.Count - 1);
            moving.Insert(0, last);
            return new[] { fixedClub }.Concat(moving).ToList();
        }
    }
}
