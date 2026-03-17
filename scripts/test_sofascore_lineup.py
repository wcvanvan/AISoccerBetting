#!/usr/bin/env python3
"""Test script: fetch lineup data from Sofascore via soccerdata."""

import sys
import json

try:
    from soccerdata import Sofascore
except ImportError:
    print("ERROR: soccerdata Sofascore not available. Try: pip install soccerdata", file=sys.stderr)
    sys.exit(1)

# Use a recent/upcoming match
league = sys.argv[1] if len(sys.argv) > 1 else "ENG-Premier League"
season = sys.argv[2] if len(sys.argv) > 2 else "2025-2026"

print(f"Testing Sofascore for league={league}, season={season}\n")

ss = Sofascore(leagues=league, seasons=season)

# 1. List available methods
print("=== Available methods ===")
methods = [m for m in dir(ss) if not m.startswith("_") and callable(getattr(ss, m))]
print("\n".join(methods))
print()

# 2. Try to read schedule
print("=== Schedule (last 5 matches) ===")
try:
    schedule = ss.read_schedule()
    print(f"Total matches: {len(schedule)}")
    print(f"Columns: {list(schedule.columns)}")
    print()
    print(schedule.tail(5).to_string())
    print()
except Exception as e:
    print(f"read_schedule failed: {e}\n")

# 3. Try to read lineups
print("=== Lineups ===")
try:
    lineups = ss.read_lineups()
    print(f"Total entries: {len(lineups)}")
    print(f"Columns: {list(lineups.columns)}")
    print()
    # Show a sample
    print(lineups.tail(20).to_string())
    print()
except Exception as e:
    print(f"read_lineups failed: {e}\n")

# 4. Try any other lineup-related methods
for method_name in methods:
    if "lineup" in method_name.lower() or "formation" in method_name.lower():
        print(f"=== {method_name} ===")
        try:
            result = getattr(ss, method_name)()
            if hasattr(result, "head"):
                print(f"Shape: {result.shape}")
                print(f"Columns: {list(result.columns)}")
                print(result.head(10).to_string())
            else:
                print(result)
        except Exception as e:
            print(f"{method_name} failed: {e}")
        print()
