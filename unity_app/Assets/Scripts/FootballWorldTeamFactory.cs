using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace FC2026
{
    /// <summary>Maps the expanded world catalog into the existing match/career data model.</summary>
    public static class FootballWorldTeamFactory
    {
        public static TeamData CreateTeam(FootballWorldDatabase database, string clubId)
        {
            var club = database?.FindClub(clubId);
            if (club == null) return null;
            var team = new TeamData { id = club.id, displayName = club.displayName };
            if (ColorUtility.TryParseHtmlString(club.primaryColorHex, out var primary)) team.primaryColor = primary;
            if (ColorUtility.TryParseHtmlString(club.secondaryColorHex, out var secondary)) team.secondaryColor = secondary;
            team.players = database.PlayersForClub(club.id).Select(CreatePlayer).ToList();
            return team;
        }

        public static PlayerData CreatePlayer(WorldPlayerDefinition source)
        {
            if (source == null) return null;
            if (!Enum.TryParse(source.position, true, out PlayerPosition position)) position = PlayerPosition.CM;
            return new PlayerData
            {
                id = source.id,
                displayName = source.displayName,
                position = position,
                overall = Mathf.Clamp(source.overall, 1, 99),
                pace = Mathf.Clamp(source.pace, 1, 99),
                shooting = Mathf.Clamp(source.shooting, 1, 99),
                passing = Mathf.Clamp(source.passing, 1, 99),
                dribbling = Mathf.Clamp(source.dribbling, 1, 99),
                defending = Mathf.Clamp(source.defending, 1, 99),
                physicality = Mathf.Clamp(source.physicality, 1, 99),
                isGoalkeeper = position == PlayerPosition.GK
            };
        }

        public static List<TeamData> CreateLeagueTeams(FootballWorldDatabase database, string leagueId)
        {
            return database?.ClubsForLeague(leagueId).Select(club => CreateTeam(database, club.id)).Where(team => team != null).ToList()
                ?? new List<TeamData>();
        }
    }
}