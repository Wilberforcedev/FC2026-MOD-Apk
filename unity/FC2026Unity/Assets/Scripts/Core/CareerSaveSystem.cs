using System;
using System.Linq;
using FC2026.World;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Local, offline-first career persistence for Android and Editor builds.
    /// Saves only the managed league table; every other club, player and
    /// fixture is regenerated from the deterministic world database.
    /// </summary>
    public static class CareerSaveSystem
    {
        public const int CurrentSchemaVersion = CareerSchema.Version;
        private const string SaveKey = "fc2026.career.save.v1";

        private static readonly string[] LegacyClubIds =
        {
            "kampala_city", "villa", "express", "bright_stars"
        };

        public static bool Save(CareerSaveData data)
        {
            if (data == null)
                return false;

            Normalize(data);
            if (!IsValid(data))
                return false;

            try
            {
                PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(data));
                PlayerPrefs.Save();
                return true;
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"FC 2026 career save failed: {exception.Message}");
                return false;
            }
        }

        public static CareerSaveData Load()
        {
            if (!PlayerPrefs.HasKey(SaveKey))
                return null;

            try
            {
                var json = PlayerPrefs.GetString(SaveKey, string.Empty);
                if (string.IsNullOrWhiteSpace(json))
                    return null;

                var data = JsonUtility.FromJson<CareerSaveData>(json);
                if (data == null)
                    return null;

                var needsPersist = data.schemaVersion != CurrentSchemaVersion;
                if (data.schemaVersion < CurrentSchemaVersion)
                    Migrate(data);
                else
                    Normalize(data);

                if (!IsValid(data))
                    return null;

                if (needsPersist && !Save(data))
                    Debug.LogWarning("FC 2026: career save migration could not be persisted.");
                return data;
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"FC 2026 career save could not be loaded: {exception.Message}");
                return null;
            }
        }

        public static void Delete()
        {
            PlayerPrefs.DeleteKey(SaveKey);
            PlayerPrefs.Save();
            CareerTransferSystem.Invalidate();
        }

        private static void Migrate(CareerSaveData data)
        {
            var previousVersion = data.schemaVersion;
            data.schemaVersion = CurrentSchemaVersion;
            data.worldSeed = data.worldSeed == 0 ? WorldDatabase.DefaultWorldSeed : data.worldSeed;

            // v1-v3 used four hardcoded Ugandan club ids. Map the managed club
            // into the generated Uganda top division by its legacy order, keep
            // the player's career record and start the new table fresh.
            if (previousVersion < 4)
            {
                var legacyIndex = Array.IndexOf(LegacyClubIds, data.managedClubId);
                data.leagueId = WorldDatabase.DefaultLeagueId;
                data.matchweek = 1;
                data.standings = Array.Empty<CareerClubStanding>();

                Normalize(data);

                var clubs = WorldDatabase.GetLeagueClubs(data.leagueId);
                if (clubs.Length > 0)
                    data.managedClubId = clubs[legacyIndex >= 0 && legacyIndex < clubs.Length ? legacyIndex : 0].Id;

                // Rebuild contracts against the remapped club.
                Normalize(data);
                return;
            }

            // v4 added the cup, v6 added transfers and contracts. Normalize
            // fills the new fields and generates default contract end dates.
            Normalize(data);
        }

        private static void Normalize(CareerSaveData data)
        {
            data.schemaVersion = CurrentSchemaVersion;
            data.worldSeed = data.worldSeed == 0 ? WorldDatabase.DefaultWorldSeed : data.worldSeed;
            data.season = Math.Max(1, data.season);
            data.transferBudget = Math.Max(0, data.transferBudget);
            data.played = Math.Max(0, data.played);
            data.wins = Math.Max(0, data.wins);
            data.draws = Math.Max(0, data.draws);
            data.losses = Math.Max(0, data.losses);
            data.formationId = CareerFormationSystem.NormalizeFormation(data.formationId);
            data.tacticalStyle = CareerFormationSystem.NormalizeTacticalStyle(data.tacticalStyle);
            CareerLeagueSystem.EnsureStandings(data);
            CareerCupSystem.Normalize(data);
            CareerTransferSystem.Normalize(data);
        }

        private static bool StandingIsValid(CareerClubStanding standing, string leagueId)
        {
            var club = standing == null ? null : WorldDatabase.GetClub(standing.clubId);
            return standing != null
                && club != null
                && club.LeagueId == leagueId
                && standing.played >= 0
                && standing.wins >= 0
                && standing.draws >= 0
                && standing.losses >= 0
                && standing.goalsFor >= 0
                && standing.goalsAgainst >= 0
                && standing.wins + standing.draws + standing.losses == standing.played;
        }

        private static bool IsValid(CareerSaveData data)
        {
            if (data == null
                || data.schemaVersion != CurrentSchemaVersion
                || data.season < 1
                || data.matchweek < 1
                || data.matchweek > WorldDatabase.MatchweeksPerSeason
                || data.transferBudget < 0
                || data.played < 0
                || data.wins < 0
                || data.draws < 0
                || data.losses < 0
                || data.wins + data.draws + data.losses > data.played
                || string.IsNullOrEmpty(data.managedClubId)
                || !CareerFormationSystem.IsValidFormation(data.formationId)
                || !CareerFormationSystem.IsValidTacticalStyle(data.tacticalStyle)
                || data.standings == null
                || data.standings.Length != WorldDatabase.ClubsPerLeague
                || !CareerLeagueSystem.IsClubInLeague(data.leagueId, data.managedClubId)
                || data.standings.Any(item => !StandingIsValid(item, data.leagueId))
                || !CupDataIsValid(data)
                || !CareerTransferSystem.DataIsValid(data))
            {
                return false;
            }

            return data.standings
                .Select(item => item.clubId)
                .Distinct(StringComparer.Ordinal)
                .Count() == data.standings.Length;
        }

        private static bool CupDataIsValid(CareerSaveData data)
        {
            if (data.cupRound < 0
                || data.cupRound > CareerCupSystem.Rounds
                || data.honours == null
                || data.honours.Length > CareerCupSystem.MaxHonours
                || data.cupOpponentIds == null
                || data.cupUserGoals == null
                || data.cupOpponentGoals == null
                || data.cupUserPenalties == null
                || data.cupOpponentPenalties == null
                || data.cupOpponentIds.Length != CareerCupSystem.Rounds
                || data.cupUserGoals.Length != CareerCupSystem.Rounds
                || data.cupOpponentGoals.Length != CareerCupSystem.Rounds
                || data.cupUserPenalties.Length != CareerCupSystem.Rounds
                || data.cupOpponentPenalties.Length != CareerCupSystem.Rounds)
            {
                return false;
            }

            for (var i = 0; i < CareerCupSystem.Rounds; i++)
            {
                if (data.cupUserGoals[i] < 0
                    || data.cupOpponentGoals[i] < 0
                    || data.cupUserPenalties[i] < 0
                    || data.cupOpponentPenalties[i] < 0)
                {
                    return false;
                }

                var opponentId = data.cupOpponentIds[i];
                if (string.IsNullOrEmpty(opponentId))
                    continue;
                if (!CareerLeagueSystem.IsClubInLeague(data.leagueId, opponentId))
                    return false;
            }

            if (!string.IsNullOrEmpty(data.cupChampionId) &&
                !CareerLeagueSystem.IsClubInLeague(data.leagueId, data.cupChampionId))
            {
                return false;
            }

            return true;
        }
    }
}
