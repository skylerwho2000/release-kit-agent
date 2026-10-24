from pydantic import BaseModel, Field


class CuratorMatch(BaseModel):
    name: str
    type: str
    subgenres: list[str]
    vibe_tags: list[str]
    submission_notes: str
    contact_style: str
    reason: str


class CuratorMatches(BaseModel):
    matches: list[CuratorMatch] = Field(max_length=5)


class BioPack(BaseModel):
    short_bio: str
    long_bio: str
    track_description: str


class Pitch(BaseModel):
    curator_name: str
    subject: str = ""
    body: str


class PitchPack(BaseModel):
    pitches: list[Pitch] = Field(max_length=5)


class Caption(BaseModel):
    day: int = Field(ge=1, le=14)
    date: str
    platform: str
    phase: str
    caption: str
    hashtags: list[str]


class CaptionSchedule(BaseModel):
    schedule: list[Caption] = Field(min_length=14, max_length=14)
