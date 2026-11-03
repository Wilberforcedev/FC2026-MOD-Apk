using System;
using System.Collections.Generic;

namespace FC2026.World
{
    /// <summary>
    /// Deterministic fictional football world: six confederations, 96 countries,
    /// one national top division per country (16 clubs each), generated squads and
    /// a double round-robin fixture list. Clubs and players are invented; country
    /// names are factual and no real club crests, kits or player likenesses are used.
    /// </summary>
    public static class WorldDatabase
    {
        public const int DefaultWorldSeed = 20261103;
        public const int ClubsPerLeague = 16;
        public const int PlayersPerClub = 18;
        public const int MatchweeksPerSeason = (ClubsPerLeague - 1) * 2;
        public const string DefaultLeagueId = "uga-top";

        private static readonly WorldCountry[] Countries =
        {
            // UEFA
            new("eng", "England", "UEFA", 5, NameStyle.English),
            new("esp", "Spain", "UEFA", 5, NameStyle.Latin),
            new("ita", "Italy", "UEFA", 5, NameStyle.Italian),
            new("ger", "Germany", "UEFA", 5, NameStyle.Germanic),
            new("fra", "France", "UEFA", 5, NameStyle.French),
            new("por", "Portugal", "UEFA", 4, NameStyle.Portuguese),
            new("ned", "Netherlands", "UEFA", 4, NameStyle.Dutch),
            new("bel", "Belgium", "UEFA", 4, NameStyle.French),
            new("tur", "Turkey", "UEFA", 4, NameStyle.Turkic),
            new("sco", "Scotland", "UEFA", 3, NameStyle.English),
            new("aut", "Austria", "UEFA", 3, NameStyle.Germanic),
            new("sui", "Switzerland", "UEFA", 3, NameStyle.Germanic),
            new("den", "Denmark", "UEFA", 3, NameStyle.Nordic),
            new("swe", "Sweden", "UEFA", 3, NameStyle.Nordic),
            new("nor", "Norway", "UEFA", 3, NameStyle.Nordic),
            new("pol", "Poland", "UEFA", 3, NameStyle.Slavic),
            new("cze", "Czechia", "UEFA", 3, NameStyle.Slavic),
            new("cro", "Croatia", "UEFA", 3, NameStyle.Balkan),
            new("srb", "Serbia", "UEFA", 3, NameStyle.Balkan),
            new("gre", "Greece", "UEFA", 3, NameStyle.Greek),
            new("rou", "Romania", "UEFA", 3, NameStyle.Balkan),
            new("hun", "Hungary", "UEFA", 3, NameStyle.Slavic),
            new("irl", "Ireland", "UEFA", 3, NameStyle.English),
            new("wal", "Wales", "UEFA", 3, NameStyle.English),
            new("nir", "Northern Ireland", "UEFA", 2, NameStyle.English),
            new("isl", "Iceland", "UEFA", 2, NameStyle.Nordic),
            new("fin", "Finland", "UEFA", 2, NameStyle.Nordic),
            new("bul", "Bulgaria", "UEFA", 2, NameStyle.Slavic),
            new("svk", "Slovakia", "UEFA", 2, NameStyle.Slavic),
            new("svn", "Slovenia", "UEFA", 2, NameStyle.Balkan),
            new("bih", "Bosnia and Herzegovina", "UEFA", 2, NameStyle.Balkan),
            new("mkd", "North Macedonia", "UEFA", 2, NameStyle.Balkan),

            // CONMEBOL
            new("bra", "Brazil", "CONMEBOL", 5, NameStyle.Portuguese),
            new("arg", "Argentina", "CONMEBOL", 5, NameStyle.Latin),
            new("uru", "Uruguay", "CONMEBOL", 4, NameStyle.Latin),
            new("col", "Colombia", "CONMEBOL", 4, NameStyle.Latin),
            new("chi", "Chile", "CONMEBOL", 3, NameStyle.Latin),
            new("per", "Peru", "CONMEBOL", 3, NameStyle.Latin),
            new("ecu", "Ecuador", "CONMEBOL", 3, NameStyle.Latin),
            new("par", "Paraguay", "CONMEBOL", 2, NameStyle.Latin),
            new("bol", "Bolivia", "CONMEBOL", 2, NameStyle.Latin),
            new("ven", "Venezuela", "CONMEBOL", 2, NameStyle.Latin),

            // CONCACAF
            new("mex", "Mexico", "CONCACAF", 4, NameStyle.Latin),
            new("usa", "United States", "CONCACAF", 4, NameStyle.English),
            new("can", "Canada", "CONCACAF", 3, NameStyle.English),
            new("crc", "Costa Rica", "CONCACAF", 3, NameStyle.Latin),
            new("hon", "Honduras", "CONCACAF", 2, NameStyle.Latin),
            new("gua", "Guatemala", "CONCACAF", 2, NameStyle.Latin),
            new("slv", "El Salvador", "CONCACAF", 2, NameStyle.Latin),
            new("pan", "Panama", "CONCACAF", 2, NameStyle.Latin),
            new("nca", "Nicaragua", "CONCACAF", 1, NameStyle.Latin),
            new("jam", "Jamaica", "CONCACAF", 2, NameStyle.English),
            new("tri", "Trinidad and Tobago", "CONCACAF", 2, NameStyle.English),
            new("hai", "Haiti", "CONCACAF", 1, NameStyle.French),
            new("dom", "Dominican Republic", "CONCACAF", 2, NameStyle.Latin),
            new("cub", "Cuba", "CONCACAF", 1, NameStyle.Latin),

            // CAF
            new("egy", "Egypt", "CAF", 4, NameStyle.Arabic),
            new("mar", "Morocco", "CAF", 4, NameStyle.Arabic),
            new("alg", "Algeria", "CAF", 3, NameStyle.Arabic),
            new("tun", "Tunisia", "CAF", 3, NameStyle.Arabic),
            new("nga", "Nigeria", "CAF", 4, NameStyle.WestAfrican),
            new("gha", "Ghana", "CAF", 4, NameStyle.WestAfrican),
            new("sen", "Senegal", "CAF", 3, NameStyle.WestAfrican),
            new("civ", "Ivory Coast", "CAF", 3, NameStyle.WestAfrican),
            new("cmr", "Cameroon", "CAF", 3, NameStyle.WestAfrican),
            new("rsa", "South Africa", "CAF", 3, NameStyle.SouthernAfrican),
            new("mli", "Mali", "CAF", 2, NameStyle.WestAfrican),
            new("bur", "Burkina Faso", "CAF", 2, NameStyle.WestAfrican),
            new("zam", "Zambia", "CAF", 2, NameStyle.SouthernAfrican),
            new("uga", "Uganda", "CAF", 2, NameStyle.EastAfrican),
            new("ken", "Kenya", "CAF", 2, NameStyle.EastAfrican),
            new("tan", "Tanzania", "CAF", 2, NameStyle.EastAfrican),
            new("ang", "Angola", "CAF", 2, NameStyle.SouthernAfrican),
            new("cod", "DR Congo", "CAF", 2, NameStyle.WestAfrican),

            // AFC
            new("jpn", "Japan", "AFC", 4, NameStyle.Japanese),
            new("kor", "South Korea", "AFC", 4, NameStyle.Korean),
            new("chn", "China", "AFC", 3, NameStyle.Chinese),
            new("ksa", "Saudi Arabia", "AFC", 4, NameStyle.Arabic),
            new("qat", "Qatar", "AFC", 3, NameStyle.Arabic),
            new("uae", "United Arab Emirates", "AFC", 3, NameStyle.Arabic),
            new("irn", "Iran", "AFC", 3, NameStyle.Persian),
            new("irq", "Iraq", "AFC", 2, NameStyle.Arabic),
            new("uzb", "Uzbekistan", "AFC", 2, NameStyle.Turkic),
            new("aus", "Australia", "AFC", 3, NameStyle.English),
            new("tha", "Thailand", "AFC", 3, NameStyle.SoutheastAsian),
            new("vie", "Vietnam", "AFC", 2, NameStyle.SoutheastAsian),
            new("mas", "Malaysia", "AFC", 2, NameStyle.SoutheastAsian),
            new("idn", "Indonesia", "AFC", 2, NameStyle.SoutheastAsian),
            new("ind", "India", "AFC", 2, NameStyle.SouthAsian),
            new("jor", "Jordan", "AFC", 2, NameStyle.Arabic),
            new("bhr", "Bahrain", "AFC", 1, NameStyle.Arabic),
            new("oma", "Oman", "AFC", 1, NameStyle.Arabic),

            // OFC
            new("nzl", "New Zealand", "OFC", 3, NameStyle.English),
            new("fij", "Fiji", "OFC", 1, NameStyle.Polynesian),
            new("png", "Papua New Guinea", "OFC", 1, NameStyle.Polynesian),
            new("sol", "Solomon Islands", "OFC", 1, NameStyle.Polynesian)
        };

        private static readonly string[] LeagueTemplates =
        {
            "National Championship", "Premier Division", "Super League",
            "First Division", "Top Flight", "National League"
        };

        private static readonly Dictionary<string, WorldCountry> CountriesById = BuildCountryIndex();
        private static readonly WorldLeague[] Leagues = BuildLeagues();
        private static readonly Dictionary<string, WorldLeague> LeaguesById = BuildLeagueIndex();

        private static readonly Dictionary<string, WorldClub> ClubsById = new();
        private static readonly Dictionary<string, WorldPlayer[]> Squads = new();
        private static readonly Dictionary<string, WorldFixture[]> Fixtures = new();

        private static readonly PlayerPosition[] SquadTemplate =
        {
            PlayerPosition.Goalkeeper, PlayerPosition.Goalkeeper,
            PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
            PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
            PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder,
            PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder,
            PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward
        };

        private static readonly WorldColor[] ClubPalette =
        {
            WorldColor.FromBytes(196, 30, 45), WorldColor.FromBytes(20, 44, 120),
            WorldColor.FromBytes(238, 238, 242), WorldColor.FromBytes(12, 122, 74),
            WorldColor.FromBytes(244, 186, 20), WorldColor.FromBytes(92, 42, 132),
            WorldColor.FromBytes(0, 150, 200), WorldColor.FromBytes(220, 92, 24),
            WorldColor.FromBytes(30, 30, 34), WorldColor.FromBytes(150, 22, 84),
            WorldColor.FromBytes(0, 92, 164), WorldColor.FromBytes(110, 170, 30),
            WorldColor.FromBytes(246, 120, 150), WorldColor.FromBytes(58, 58, 78),
            WorldColor.FromBytes(180, 140, 90), WorldColor.FromBytes(0, 160, 160),
            WorldColor.FromBytes(120, 0, 0), WorldColor.FromBytes(200, 200, 212),
            WorldColor.FromBytes(40, 90, 40), WorldColor.FromBytes(214, 178, 40),
            WorldColor.FromBytes(24, 120, 190), WorldColor.FromBytes(130, 20, 20),
            WorldColor.FromBytes(90, 90, 90), WorldColor.FromBytes(250, 250, 250)
        };

        private static readonly WorldColor[] KeeperPalette =
        {
            WorldColor.FromBytes(238, 206, 34), WorldColor.FromBytes(240, 104, 22),
            WorldColor.FromBytes(30, 180, 120), WorldColor.FromBytes(250, 80, 140),
            WorldColor.FromBytes(100, 200, 220), WorldColor.FromBytes(190, 40, 40),
            WorldColor.FromBytes(120, 80, 200), WorldColor.FromBytes(230, 230, 230)
        };

        private static readonly string[] StadiumSuffixes = { "Park", "Arena", "Stadium", "Ground", "Field", "Bowl" };

        public static IReadOnlyList<WorldCountry> GetCountries()
        {
            return Countries;
        }

        public static WorldCountry GetCountry(string countryId)
        {
            if (string.IsNullOrEmpty(countryId))
                return null;
            return CountriesById.TryGetValue(countryId, out var country) ? country : null;
        }

        public static WorldLeague GetLeague(string leagueId)
        {
            if (string.IsNullOrEmpty(leagueId))
                return null;
            return LeaguesById.TryGetValue(leagueId, out var league) ? league : null;
        }

        public static WorldLeague GetLeagueForCountry(string countryId)
        {
            var country = GetCountry(countryId);
            return country == null ? null : GetLeague(country.Id + "-top");
        }

        public static WorldLeague GetDefaultLeague()
        {
            return GetLeague(DefaultLeagueId);
        }

        public static WorldClub[] GetLeagueClubs(string leagueId)
        {
            var league = GetLeague(leagueId);
            if (league == null)
                return Array.Empty<WorldClub>();
            EnsureClubs(league);
            return league.Clubs;
        }

        public static WorldClub GetClub(string clubId)
        {
            if (string.IsNullOrEmpty(clubId))
                return null;
            if (ClubsById.TryGetValue(clubId, out var known))
                return known;

            var separator = clubId.IndexOf('-');
            if (separator <= 0)
                return null;

            var league = GetLeague(clubId.Substring(0, separator) + "-top");
            if (league == null)
                return null;
            EnsureClubs(league);
            return ClubsById.TryGetValue(clubId, out var club) ? club : null;
        }

        public static WorldPlayer[] GetSquad(string clubId)
        {
            if (string.IsNullOrEmpty(clubId))
                return Array.Empty<WorldPlayer>();
            if (Squads.TryGetValue(clubId, out var cached))
                return cached;

            var club = GetClub(clubId);
            if (club == null)
                return Array.Empty<WorldPlayer>();

            var country = GetCountry(club.CountryId);
            var style = country != null ? country.NameStyle : NameStyle.English;
            var random = new DeterministicRandom(WorldHash.Combine(clubId, DefaultWorldSeed + 17));
            var players = new WorldPlayer[PlayersPerClub];
            var usedNames = new HashSet<string>();

            for (var i = 0; i < PlayersPerClub; i++)
            {
                var position = SquadTemplate[i];
                var overall = Clamp(club.Strength + OverallOffset(position) + random.Range(-4, 5), 42, 94);
                var pace = Clamp(overall + PaceOffset(position) + random.Range(-6, 7), 40, 96);
                var shooting = Clamp(overall + ShootingOffset(position) + random.Range(-6, 7), 28, 96);
                var passing = Clamp(overall + PassingOffset(position) + random.Range(-6, 7), 34, 96);
                var defending = Clamp(overall + DefendingOffset(position) + random.Range(-6, 7), 28, 96);
                var physical = Clamp(overall + PhysicalOffset(position) + random.Range(-4, 5), 40, 96);
                var skinTone = PickSkinTone(style, random);
                var faceVariant = skinTone >= 3 ? 1 : skinTone >= 2 ? 0 : 2;

                players[i] = new WorldPlayer
                {
                    Id = clubId + "-p" + i,
                    ClubId = clubId,
                    Name = UniquePlayerName(style, random, usedNames),
                    Position = position,
                    ShirtNumber = i + 1,
                    Age = random.Range(17, position == PlayerPosition.Goalkeeper ? 39 : 35),
                    Overall = overall,
                    Pace = pace,
                    Shooting = shooting,
                    Passing = passing,
                    Defending = defending,
                    Physical = physical,
                    HeightCm = HeightFor(position, random),
                    LeftFooted = random.Range(0, 4) == 0,
                    SkinTone = skinTone,
                    HairColor = HairColorFor(style, random),
                    HairStyle = random.Range(0, 6),
                    FaceVariant = faceVariant
                };
            }

            Squads[clubId] = players;
            return players;
        }

        public static WorldFixture[] GetFixtures(string leagueId)
        {
            var league = GetLeague(leagueId);
            if (league == null)
                return Array.Empty<WorldFixture>();
            if (Fixtures.TryGetValue(league.Id, out var cached))
                return cached;

            var generated = BuildFixtures(GetLeagueClubs(league.Id));
            Fixtures[league.Id] = generated;
            return generated;
        }

        public static WorldFixture GetFixtureForClub(string leagueId, string clubId, int matchweek)
        {
            if (string.IsNullOrEmpty(clubId))
                return default;

            var fixtures = GetFixtures(leagueId);
            var perWeek = ClubsPerLeague / 2;
            var start = (Math.Max(1, matchweek) - 1) * perWeek;
            for (var i = start; i < start + perWeek && i < fixtures.Length; i++)
            {
                var fixture = fixtures[i];
                if (fixture.HomeClubId == clubId || fixture.AwayClubId == clubId)
                    return fixture;
            }
            return default;
        }

        public static int MatchweekCount(string leagueId)
        {
            return GetLeague(leagueId) == null ? 0 : MatchweeksPerSeason;
        }

        private static void EnsureClubs(WorldLeague league)
        {
            if (league.Clubs.Length > 0)
                return;

            var country = GetCountry(league.CountryId);
            if (country == null)
                return;

            var random = new DeterministicRandom(WorldHash.Combine(league.Id, DefaultWorldSeed));
            var ranks = new int[ClubsPerLeague];
            for (var i = 0; i < ranks.Length; i++)
                ranks[i] = i;
            for (var i = ranks.Length - 1; i > 0; i--)
            {
                var swap = random.Range(0, i + 1);
                var value = ranks[i];
                ranks[i] = ranks[swap];
                ranks[swap] = value;
            }

            var clubs = new WorldClub[ClubsPerLeague];
            var usedCities = new HashSet<string>();
            var usedShortNames = new HashSet<string>();
            var baseStrength = 46 + country.Strength * 6;
            var spread = 0.45f + country.Strength * 0.04f;

            for (var index = 0; index < ClubsPerLeague; index++)
            {
                var rank = ranks[index];
                var city = UniqueCity(country.NameStyle, random, usedCities);
                var clubName = city + " " + WorldNames.ClubSuffix(country.NameStyle, random);
                var strength = Clamp((int)Math.Round(baseStrength + (ClubsPerLeague - 1 - rank) * spread + random.Range(-2, 3)), 40, 92);
                var primary = random.Pick(ClubPalette);
                var secondary = PickContrast(primary, random);
                var goalkeeper = PickKeeper(primary, random);
                var shortName = UniqueShortName(city, usedShortNames);
                var club = new WorldClub
                {
                    Id = league.CountryId + "-" + index.ToString("00"),
                    LeagueId = league.Id,
                    CountryId = league.CountryId,
                    Name = clubName,
                    ShortName = shortName,
                    City = city,
                    StadiumName = city + " " + random.Pick(StadiumSuffixes),
                    PrimaryColor = primary,
                    SecondaryColor = secondary,
                    GoalkeeperColor = goalkeeper,
                    Strength = strength,
                    Capacity = 3500 + (strength - 35) * 700 + random.Range(0, 5000),
                    TransferBudget = (long)(Math.Pow(Math.Max(1, strength - 42), 2) * 18000) + random.Range(0, 4000000)
                };

                clubs[index] = club;
                ClubsById[club.Id] = club;
            }

            league.Clubs = clubs;
        }

        private static WorldFixture[] BuildFixtures(WorldClub[] clubs)
        {
            var count = clubs.Length;
            if (count < 2)
                return Array.Empty<WorldFixture>();

            var order = new int[count];
            for (var i = 0; i < count; i++)
                order[i] = i;

            var fixtures = new List<WorldFixture>(count * (count - 1));
            for (var round = 0; round < count - 1; round++)
            {
                for (var pair = 0; pair < count / 2; pair++)
                {
                    var first = order[pair];
                    var second = order[count - 1 - pair];
                    var firstIsHome = (round + pair) % 2 == 0;
                    fixtures.Add(firstIsHome
                        ? new WorldFixture(round + 1, clubs[first].Id, clubs[second].Id)
                        : new WorldFixture(round + 1, clubs[second].Id, clubs[first].Id));
                }

                var last = order[count - 1];
                for (var i = count - 1; i > 1; i--)
                    order[i] = order[i - 1];
                order[1] = last;
            }

            var firstLeg = fixtures.Count;
            for (var i = 0; i < firstLeg; i++)
            {
                var fixture = fixtures[i];
                fixtures.Add(new WorldFixture(fixture.Matchweek + count - 1, fixture.AwayClubId, fixture.HomeClubId));
            }

            return fixtures.ToArray();
        }

        private static string UniqueCity(NameStyle style, DeterministicRandom random, HashSet<string> used)
        {
            for (var attempt = 0; attempt < 40; attempt++)
            {
                var city = WorldNames.CityName(style, random);
                if (used.Add(city))
                    return city;
            }

            var fallback = WorldNames.CityName(style, random) + (used.Count + 1);
            used.Add(fallback);
            return fallback;
        }

        private static string UniqueShortName(string city, HashSet<string> used)
        {
            var prefix = city.Length > 3 ? city.Substring(0, 3) : city;
            var candidate = prefix.ToUpperInvariant();
            var suffix = 2;
            while (!used.Add(candidate))
            {
                candidate = prefix.ToUpperInvariant() + suffix;
                suffix++;
            }
            return candidate;
        }

        private static string UniquePlayerName(NameStyle style, DeterministicRandom random, HashSet<string> used)
        {
            for (var attempt = 0; attempt < 30; attempt++)
            {
                var name = WorldNames.PersonName(style, random);
                if (used.Add(name))
                    return name;
            }

            var fallback = WorldNames.PersonName(style, random) + " " + (char)('A' + random.Range(0, 26)) + ".";
            used.Add(fallback);
            return fallback;
        }

        private static WorldColor PickContrast(WorldColor source, DeterministicRandom random)
        {
            for (var attempt = 0; attempt < 12; attempt++)
            {
                var candidate = random.Pick(ClubPalette);
                if (candidate.DistanceTo(source) >= 0.4f)
                    return candidate;
            }
            return source.R > 0.5f ? WorldColor.FromBytes(20, 20, 24) : WorldColor.FromBytes(240, 240, 244);
        }

        private static WorldColor PickKeeper(WorldColor primary, DeterministicRandom random)
        {
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var candidate = random.Pick(KeeperPalette);
                if (candidate.DistanceTo(primary) >= 0.45f)
                    return candidate;
            }
            return KeeperPalette[0];
        }

        private static int PickSkinTone(NameStyle style, DeterministicRandom random)
        {
            switch (style)
            {
                case NameStyle.WestAfrican:
                case NameStyle.EastAfrican:
                case NameStyle.SouthernAfrican:
                    return random.Range(3, 5);
                case NameStyle.Arabic:
                case NameStyle.Persian:
                case NameStyle.SouthAsian:
                case NameStyle.Polynesian:
                    return random.Range(2, 5);
                case NameStyle.Latin:
                case NameStyle.Portuguese:
                case NameStyle.French:
                case NameStyle.Greek:
                case NameStyle.Balkan:
                case NameStyle.Turkic:
                    return random.Range(1, 4);
                case NameStyle.Japanese:
                case NameStyle.Korean:
                case NameStyle.Chinese:
                case NameStyle.SoutheastAsian:
                    return random.Range(1, 3);
                default:
                    return random.Range(0, 3);
            }
        }

        private static int HairColorFor(NameStyle style, DeterministicRandom random)
        {
            switch (style)
            {
                case NameStyle.WestAfrican:
                case NameStyle.EastAfrican:
                case NameStyle.SouthernAfrican:
                case NameStyle.Japanese:
                case NameStyle.Korean:
                case NameStyle.Chinese:
                    return 0;
                case NameStyle.English:
                case NameStyle.Germanic:
                case NameStyle.Dutch:
                case NameStyle.Nordic:
                case NameStyle.Slavic:
                    return random.Range(1, 4);
                default:
                    return random.Range(0, 3);
            }
        }

        private static int HeightFor(PlayerPosition position, DeterministicRandom random)
        {
            switch (position)
            {
                case PlayerPosition.Goalkeeper:
                    return random.Range(186, 200);
                case PlayerPosition.Defender:
                    return random.Range(178, 196);
                case PlayerPosition.Midfielder:
                    return random.Range(168, 187);
                default:
                    return random.Range(170, 192);
            }
        }

        private static int OverallOffset(PlayerPosition position)
        {
            return position == PlayerPosition.Goalkeeper ? -2 : 0;
        }

        private static int PaceOffset(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => -16,
                PlayerPosition.Defender => -2,
                PlayerPosition.Midfielder => 2,
                _ => 6
            };
        }

        private static int ShootingOffset(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => -26,
                PlayerPosition.Defender => -14,
                PlayerPosition.Midfielder => 1,
                _ => 9
            };
        }

        private static int PassingOffset(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => -8,
                PlayerPosition.Defender => -3,
                PlayerPosition.Midfielder => 8,
                _ => 0
            };
        }

        private static int DefendingOffset(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => 6,
                PlayerPosition.Defender => 9,
                PlayerPosition.Midfielder => 0,
                _ => -13
            };
        }

        private static int PhysicalOffset(PlayerPosition position)
        {
            return position switch
            {
                PlayerPosition.Goalkeeper => 6,
                PlayerPosition.Defender => 5,
                PlayerPosition.Midfielder => 0,
                _ => 2
            };
        }

        private static int Clamp(int value, int minimum, int maximum)
        {
            return value < minimum ? minimum : value > maximum ? maximum : value;
        }

        private static Dictionary<string, WorldCountry> BuildCountryIndex()
        {
            var index = new Dictionary<string, WorldCountry>(Countries.Length);
            foreach (var country in Countries)
                index[country.Id] = country;
            return index;
        }

        private static WorldLeague[] BuildLeagues()
        {
            var leagues = new WorldLeague[Countries.Length];
            for (var i = 0; i < Countries.Length; i++)
            {
                var country = Countries[i];
                var template = LeagueTemplates[WorldHash.Index(country.Id + "|league", LeagueTemplates.Length)];
                leagues[i] = new WorldLeague(country.Id + "-top", country.Id, country.Name + " " + template);
            }
            return leagues;
        }

        private static Dictionary<string, WorldLeague> BuildLeagueIndex()
        {
            var index = new Dictionary<string, WorldLeague>(Leagues.Length);
            foreach (var league in Leagues)
                index[league.Id] = league;
            return index;
        }
    }
}
