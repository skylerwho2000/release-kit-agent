from datetime import datetime, timezone
import re
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agent import get_client, structured_call
from models import BioPack, CaptionSchedule, CuratorMatches, PitchPack
from tools import build_release_dates, match_curators
from pricing import calculate_cost
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(title="Release Kit Agent")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])
ROOT = Path(__file__).resolve().parent
FRONTEND_DIST = ROOT / "frontend" / "dist"
OUTPUT_DIR = ROOT / "output"
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
session_runs: dict[str, int] = {}
INJECTION = re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions|system prompt|reveal\s+(the\s+)?prompt|disregard\s+(all\s+)?rules|developer message", re.I)


class ReleaseInput(BaseModel):
    artist_name: str = Field(max_length=80)
    track_title: str = Field(max_length=100)
    genre: str = Field(max_length=100)
    moods: str = Field(max_length=200)
    influences: str = Field(max_length=240)
    release_date: str = Field(max_length=10)
    about: str = Field(max_length=500)
    links: str = Field(max_length=500)
    session_id: str = Field(max_length=64)


@app.post("/api/generate")
def generate(payload: ReleaseInput):
    raw = payload.model_dump(exclude={"session_id"})
    for field, value in raw.items():
        if INJECTION.search(value):
            raise HTTPException(400, f"Generation blocked: prompt-injection wording detected in {field}. Please revise it.")
    runs = session_runs.get(payload.session_id, 0)
    if runs >= 10:
        raise HTTPException(429, "This session has reached its 10-run limit. Start a new browser session to continue.")
    try:
        dates = build_release_dates(payload.release_date)
    except ValueError:
        raise HTTPException(400, "Enter a valid release date in YYYY-MM-DD format.")
    session_runs[payload.session_id] = runs + 1
    context = {**raw, "moods": [x.strip() for x in payload.moods.split(",") if x.strip()],
               "influences": [x.strip() for x in payload.influences.split(",") if x.strip()]}
    outputs, usage = {}, {}
    try:
        client = get_client()
        matched = match_curators(payload.genre, context["moods"])
        outputs["curators"], usage["Curator Matcher"] = structured_call(
            client, "curator_matcher", CuratorMatches,
            "Explain these local curator matches. Keep each reason specific to the supplied track tags. Do not add curators.",
            {"track": context, "ranked_curators": matched}, 1200)
        outputs["bios"], usage["Bio Writer"] = structured_call(
            client, "bio_writer", BioPack,
            "Write a short bio, a long bio, and a track description. Write both bios strictly in third person: do not use first-person pronouns or first-person constructions such as I, me, my, we, or our. Refer to the artist by name or with they/their phrasing. The about text is a voice reference for tone and diction only; translate any first-person wording into third person. For the long bio use exactly 3-4 sentences and weave in every supplied relevant fact: artist name, location and production process from about, influences, genre, and moods. Omit a category if the user did not provide it. Never add facts or invent anything.",
            {"track": context, "voice_reference": payload.about}, 1200)
        outputs["pitches"], usage["Pitch Writer"] = structured_call(
            client, "pitch_writer", PitchPack,
            "Write exactly one pitch for each matched curator, preserving each curator name. Follow that curator's submission_notes and contact_style exactly; do not switch to another contact method. For Email, write a concise email with a greeting, a subject, and a sign-off. For DM, write a short conversational DM and set subject to an empty string (no subject line). For Submission form, write a concise paste-ready form message and leave subject empty unless the notes explicitly request a subject. Each pitch must cite one specific fit reason from that curator's match reason. If the notes request a private streaming link and the user did not provide a clearly private stream URL, include the exact placeholder [private link]. Only reuse user-provided links; never claim a link is private unless the user says it is. Use the about text as the artist's voice reference while keeping all factual claims grounded in the brief.",
            {"track": context, "voice_reference": payload.about,
             "matches": outputs["curators"]["matches"]}, 2200)
        outputs["schedule"], usage["Caption Scheduler"] = structured_call(
            client, "caption_scheduler", CaptionSchedule,
            "Write the supplied 14-post calendar exactly: six teasers, one launch day, and seven follow-ups. Preserve every supplied date and phase. Assign every post to Instagram or TikTok, varying platforms across the schedule. TikTok captions must be shorter and hook-first; Instagram captions may be a little fuller and more atmospheric. Vary wording and hooks across all 14 posts. Do not repeat the release date in every caption; the calendar already shows each post date. Use only the artist's supplied facts, and use the about text as a voice reference. Include relevant hashtags.",
            {"track": context, "voice_reference": payload.about, "calendar": dates}, 2200)
    except Exception as exc:
        session_runs[payload.session_id] -= 1
        raise HTTPException(502, f"Release kit generation failed: {exc}")
    timestamp = datetime.now(timezone.utc).isoformat()
    total = {key: sum((entry.get(key) or 0) for entry in usage.values())
             for key in ("input_tokens", "cached_input_tokens", "cache_write_tokens", "output_tokens")}
    total["cost_usd"] = calculate_cost(total)
    result = {"timestamp": timestamp, "inputs": context, "outputs": outputs,
              "usage": usage, "total_usage": total}
    import json
    folder = OUTPUT_DIR
    folder.mkdir(exist_ok=True)
    (folder / f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}_{uuid.uuid4().hex[:6]}.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


@app.get("/{path:path}")
def frontend(path: str):
    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(404, "Frontend build not found. Run python start.py to build it.")
