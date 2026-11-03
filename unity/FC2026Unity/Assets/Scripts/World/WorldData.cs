using System;

namespace FC2026.World
{
    public enum PlayerPosition
    {
        Goalkeeper,
        Defender,
        Midfielder,
        Forward
    }

    public enum NameStyle
    {
        English,
        Latin,
        Portuguese,
        French,
        Germanic,
        Dutch,
        Nordic,
        Italian,
        Slavic,
        Balkan,
        Greek,
        Turkic,
        Arabic,
        Persian,
        WestAfrican,
        EastAfrican,
        SouthernAfrican,
        Japanese,
        Korean,
        Chinese,
        SoutheastAsian,
        SouthAsian,
        Polynesian
    }

    public readonly struct WorldColor
    {
        public readonly float R;
        public readonly float G;
        public readonly float B;

        public WorldColor(float r, float g, float b)
        {
            R = r;
            G = g;
            B = b;
        }

        public static WorldColor FromBytes(int r, int g, int b)
        {
            return new WorldColor(r / 255f, g / 255f, b / 255f);
        }

        public float DistanceTo(WorldColor other)
        {
            var dr = R - other.R;
            var dg = G - other.G;
            var db = B - other.B;
            return (float)Math.Sqrt(dr * dr + dg * dg + db * db);
        }
    }

    public sealed class WorldCountry
    {
        public readonly string Id;
        public readonly string Name;
        public readonly string Confederation;
        public readonly int Strength;
        public readonly NameStyle NameStyle;

        public WorldCountry(string id, string name, string confederation, int strength, NameStyle nameStyle)
        {
            Id = id;
            Name = name;
            Confederation = confederation;
            Strength = strength;
            NameStyle = nameStyle;
        }
    }

    public sealed class WorldLeague
    {
        public readonly string Id;
        public readonly string CountryId;
        public readonly string Name;
        public WorldClub[] Clubs = Array.Empty<WorldClub>();

        public WorldLeague(string id, string countryId, string name)
        {
            Id = id;
            CountryId = countryId;
            Name = name;
        }
    }

    public sealed class WorldClub
    {
        public string Id;
        public string LeagueId;
        public string CountryId;
        public string Name;
        public string ShortName;
        public string City;
        public string StadiumName;
        public WorldColor PrimaryColor;
        public WorldColor SecondaryColor;
        public WorldColor GoalkeeperColor;
        public int Strength;
        public int Capacity;
        public long TransferBudget;
    }

    public sealed class WorldPlayer
    {
        public string Id;
        public string ClubId;
        public string Name;
        public PlayerPosition Position;
        public int ShirtNumber;
        public int Age;
        public int Overall;
        public int Pace;
        public int Shooting;
        public int Passing;
        public int Defending;
        public int Physical;
        public int HeightCm;
        public bool LeftFooted;
        public int SkinTone;
        public int HairColor;
        public int HairStyle;
        public int FaceVariant;
    }

    public readonly struct WorldFixture
    {
        public readonly int Matchweek;
        public readonly string HomeClubId;
        public readonly string AwayClubId;

        public WorldFixture(int matchweek, string homeClubId, string awayClubId)
        {
            Matchweek = matchweek;
            HomeClubId = homeClubId;
            AwayClubId = awayClubId;
        }

        public bool IsValid => !string.IsNullOrEmpty(HomeClubId) && !string.IsNullOrEmpty(AwayClubId);
    }

    public readonly struct WorldScoreline
    {
        public readonly int HomeGoals;
        public readonly int AwayGoals;

        public WorldScoreline(int homeGoals, int awayGoals)
        {
            HomeGoals = homeGoals;
            AwayGoals = awayGoals;
        }
    }
}
