import csv
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def match_curators(genre: str, moods: list[str], limit: int = 5) -> list[dict]:
    """Rank local curators by overlap with genre/subgenre and mood tags."""
    genre_terms = set(genre.lower().replace("/", " ").replace(",", " ").split())
    mood_terms = {word.lower().strip() for mood in moods for word in mood.split()}
    ranked = []
    with (ROOT / "data" / "curators.csv").open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            subgenres = [x.strip() for x in row["subgenres"].split("|") if x.strip()]
            vibes = [x.strip() for x in row["vibe_tags"].split("|") if x.strip()]
            sub_terms = {x.lower() for s in subgenres for x in s.replace("/", " ").split()}
            vibe_terms = {x.lower() for v in vibes for x in v.split()}
            genre_score = len(genre_terms & sub_terms)
            mood_score = len(mood_terms & vibe_terms)
            score = genre_score * 3 + mood_score
            reason = (f"Genre overlap: {', '.join(sorted(genre_terms & sub_terms)) or 'electronic music'}. "
                      f"Mood overlap: {', '.join(sorted(mood_terms & vibe_terms)) or 'complementary curator vibe'}.")
            ranked.append((score, row["name"], {**row, "subgenres": subgenres,
                           "vibe_tags": vibes, "reason": reason}))
    ranked.sort(key=lambda x: (-x[0], x[1]))
    return [item[2] for item in ranked[:limit]]


def build_release_dates(release_date: str) -> list[dict]:
    """Return six teaser days, release day, and seven follow-up days."""
    release = date.fromisoformat(release_date)
    start = release - timedelta(days=6)
    result = []
    for i in range(14):
        d = start + timedelta(days=i)
        offset = (d - release).days
        phase = "teaser" if offset < 0 else "launch day" if offset == 0 else "follow-up"
        result.append({"day": i + 1, "date": d.isoformat(), "phase": phase})
    return result
