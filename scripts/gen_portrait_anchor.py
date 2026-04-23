# /// script
# dependencies = ["google-genai", "Pillow", "python-dotenv"]
# ///
"""Generate one FWTI v3 anchor portrait via Gemini to verify 16personalities style."""

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types


ENV_PATH = "/Users/innei/git/innei-repo/SKILL/.env"
MODEL = "gemini-3.1-flash-image-preview"
OUT = Path.home() / "Downloads" / "fwti" / "CMD_anchor_v3.png"


def _make_client() -> genai.Client:
    load_dotenv(ENV_PATH)

    if vkey := os.environ.get("VERTEX_AI_KEY"):
        return genai.Client(vertexai=True, api_key=vkey)

    if os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("1", "true", "yes"):
        return genai.Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )

    key = (
        os.environ.get("GOOGLE_AI_STUDIO_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if not key:
        raise EnvironmentError("No API key found in env.")
    return genai.Client(api_key=key)


def _is_vertex() -> bool:
    return bool(os.environ.get("VERTEX_AI_KEY")) or os.environ.get(
        "GOOGLE_GENAI_USE_VERTEXAI", ""
    ).lower() in ("1", "true", "yes")


def _image_config() -> types.ImageConfig:
    if _is_vertex():
        return types.ImageConfig(aspect_ratio="1:1")
    return types.ImageConfig(aspect_ratio="1:1", image_size="1K")


SUBJECT = (
    "A calm young adult seated on a low cushion in half-lotus pose, eyes "
    "half-closed in relaxed focus, holding a phone loosely in one hand without "
    "looking at it, a wilting tea steam plume rising from a small cup nearby, "
    "wearing loose linen neutrals, posture slack but not slumped, peaceful "
    "but slightly absent gaze."
)

BASE = (
    "Render in the official 16personalities.com portrait style: 2D flat-vector "
    "art with low-poly faceted polygon shading on clothing and hair, crisp "
    "geometric color blocks with absolutely no visible outlines, clean "
    "mid-saturation harmonious palette (not desaturated, not neon), stylized "
    "semi-realistic adult proportions with gentle caricature, centered "
    "full-body composition on a 1:1 square canvas, solid off-white background "
    "(#f5f3ef) subtly washed with a soft blush pink tint #ff6b9d at ~12% "
    "saturation, a soft elliptical floor shadow directly beneath the figure, "
    "editorial portrait illustration."
)

PROMPT = f"{SUBJECT} {BASE}"


def main() -> int:
    client = _make_client()
    cfg = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=_image_config(),
    )

    for attempt in range(6):
        try:
            resp = client.models.generate_content(
                model=MODEL, contents=[PROMPT], config=cfg
            )
        except Exception as e:
            msg = str(e)
            if (
                any(s in msg for s in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED"))
                and attempt < 5
            ):
                wait = 2**attempt * 5
                print(f"transient error, sleeping {wait}s: {msg[:120]}", file=sys.stderr)
                time.sleep(wait)
                continue
            raise

        parts = resp.parts or []
        for part in parts:
            if img := part.as_image():
                OUT.parent.mkdir(parents=True, exist_ok=True)
                img.save(str(OUT))
                print(f"saved: {OUT}")
                return 0

        cands = getattr(resp, "candidates", None) or []
        finish = [getattr(c, "finish_reason", None) for c in cands]
        txt = (getattr(resp, "text", None) or "")[:160]
        print(
            f"no image on attempt {attempt + 1}; finish={finish} text={txt}",
            file=sys.stderr,
        )
        time.sleep(3)

    print("failed after retries", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
