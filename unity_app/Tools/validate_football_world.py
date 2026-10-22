#!/usr/bin/env python3
"""Validate AERO Soccer 2027 football-world JSON catalogs (Python standard library only)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "Assets" / "Data" / "FootballWorld"

def load(name, key):
    with (ROOT / name).open(encoding="utf-8") as handle:
        data = json.load(handle)
    rows = data.get(key)
    if not isinstance(rows, list):
        raise ValueError(f"{name}: expected array property '{key}'")
    return rows

def require_unique(rows, label):
    ids = [row.get("id") for row in rows]
    if any(not value for value in ids):
        raise ValueError(f"{label}: missing ID")
    if len(ids) != len(set(ids)):
        raise ValueError(f"{label}: duplicate IDs found")

def main():
    leagues = load("leagues.json", "leagues")
    clubs = load("clubs.json", "clubs")
    players = load("players.json", "players")
    competitions = load("competitions.json", "competitions")
    require_unique(leagues, "league")
    require_unique(clubs, "club")
    require_unique(players, "player")
    require_unique(competitions, "competition")
    expected_counts = {"leagues": 25, "clubs": 300, "players": 7500, "competitions": 26}
    actual_counts = {"leagues": len(leagues), "clubs": len(clubs), "players": len(players), "competitions": len(competitions)}
    for name, expected in expected_counts.items():
        if actual_counts[name] != expected:
            raise ValueError(f"{name}: expected {expected} records, found {actual_counts[name]}")
    league_ids = {row["id"] for row in leagues}
    club_ids = {row["id"] for row in clubs}
    errors = []
    for club in clubs:
        if club.get("leagueId") not in league_ids:
            errors.append(f"Club {club.get('id')} references unknown league {club.get('leagueId')}")
        if not club.get("displayName"):
            errors.append(f"Club {club.get('id')} has no displayName")
        if not club.get("stadiumName"):
            errors.append(f"Club {club.get('id')} has no stadiumName")
    for player in players:
        if player.get("clubId") not in club_ids:
            errors.append(f"Player {player.get('id')} references unknown club {player.get('clubId')}")
        if not player.get("displayName"):
            errors.append(f"Player {player.get('id')} has no displayName")
        overall = player.get("overall", 0)
        if not 1 <= overall <= 99:
            errors.append(f"Player {player.get('id')} has invalid overall {overall}")
        for attribute in ("pace", "shooting", "passing", "dribbling", "defending", "physicality"):
            rating = player.get(attribute, 0)
            if not isinstance(rating, (int, float)) or not 1 <= rating <= 99:
                errors.append(f"Player {player.get('id')} has invalid {attribute} {rating}")
        if not player.get("position"):
            errors.append(f"Player {player.get('id')} has no position")
    for competition in competitions:
        for league_id in competition.get("eligibleLeagueIds", []):
            if league_id not in league_ids:
                errors.append(f"Competition {competition.get('id')} references unknown league {league_id}")
    for league in leagues:
        actual = sum(1 for club in clubs if club.get("leagueId") == league["id"])
        if actual != league.get("clubCount"):
            errors.append(f"League {league['id']} declares {league.get('clubCount')} clubs; found {actual}")
    print(f"Leagues: {len(leagues)}")
    print(f"Clubs: {len(clubs)}")
    print(f"Players: {len(players)}")
    print(f"Competitions: {len(competitions)}")
    if errors:
        print(f"FAILED: {len(errors)} validation error(s)")
        print("\n".join(errors))
        return 1
    print("PASS: expected catalog counts, unique IDs, required names, league-club-player links, competition links and 1..99 ratings")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
