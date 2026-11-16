using System;
using System.Collections.Generic;

namespace FC2026.World
{
    /// <summary>
    /// Read-only, deterministic access to the complete generated football world.
    /// Clubs and fictional squads are generated lazily by WorldDatabase and
    /// cached there; callers can browse the entire catalog without hardcoding
    /// individual countries or leagues.
    /// </summary>
    public static class WorldCatalog
    {
        public static int ClubCount => WorldDatabase.GetCountries().Count * WorldDatabase.ClubsPerLeague;
        public static int PlayerCount => ClubCount * WorldDatabase.PlayersPerClub;

        public static WorldClub[] GetAllClubs()
        {
            var clubs = new List<WorldClub>(ClubCount);
            var countries = WorldDatabase.GetCountries();
            for (var i = 0; i < countries.Count; i++)
            {
                var league = WorldDatabase.GetLeagueForCountry(countries[i].Id);
                if (league == null)
                    continue;

                var leagueClubs = WorldDatabase.GetLeagueClubs(league.Id);
                for (var j = 0; j < leagueClubs.Length; j++)
                {
                    var club = leagueClubs[j];
                    if (club != null)
                        clubs.Add(club);
                }
            }

            return clubs.ToArray();
        }

        public static WorldPlayer[] GetAllPlayers()
        {
            var players = new List<WorldPlayer>(PlayerCount);
            var clubs = GetAllClubs();
            for (var i = 0; i < clubs.Length; i++)
            {
                var squad = WorldDatabase.GetSquad(clubs[i].Id);
                for (var j = 0; j < squad.Length; j++)
                {
                    var player = squad[j];
                    if (player != null)
                        players.Add(player);
                }
            }

            return players.ToArray();
        }

        public static bool TryGetClub(string clubId, out WorldClub club)
        {
            club = WorldDatabase.GetClub(clubId);
            return club != null;
        }

        public static bool TryGetPlayer(string playerId, out WorldPlayer player)
        {
            player = WorldDatabase.GetPlayer(playerId);
            return player != null;
        }
    }
}
