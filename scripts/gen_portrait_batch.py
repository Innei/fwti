# /// script
# dependencies = ["google-genai", "Pillow", "python-dotenv"]
# ///
"""Generate remaining FWTI v3 portraits via Gemini image-to-image,
using CMD_anchor_v3.png as the style reference so all 16 stay on-model."""

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image


ENV_PATH = "/Users/innei/git/innei-repo/SKILL/.env"
MODEL = "gemini-3.1-flash-image-preview"
OUT_DIR = Path.home() / "Downloads" / "fwti"
ANCHOR = OUT_DIR / "CMD_anchor_v3.png"


# Family tint clauses (§6 + §8 of PROMPT.md)
TINT = {
    "C": "a soft blush pink tint #ff6b9d at ~12% saturation",
    "R": "a warm crimson tint #ff5252 at ~12% saturation",
    "A": "a soft coral tint #ff9aa2 at ~12% saturation",
    "S": "a muted teal tint #4a90a4 at ~12% saturation",
    "MAD": "a deep crimson tint #d42a5a at ~12% saturation",
    "RAT": "a soft mushroom gray tint #6b5b73 at ~12% saturation",
    "ALL": "a warm sand beige tint #c5a880 at ~12% saturation",
    "VOID": "a deep indigo-teal tint #2f4858 at ~12% saturation",
}

# (code, tint_key, subject)  — CMD omitted (already generated as anchor)
PERSONAS: list[tuple[str, str, str]] = [
    # C family
    ("CHS", "C", "A young adult with wide hopeful eyes and a flushed eager smile, leaning forward intensely, one hand clutching a glowing smartphone showing unread messages, heart icons floating around, tongue slightly out like a loyal dog, wearing a hoodie with a small dog-ear hood pattern, shoulders raised with restless energy."),
    ("CNV", "C", "A figure turning halfway away from viewer, phone face-down on a small table beside them with '99+' stacked notification dots fading into smoke above the screen, expression blank and unreadable, wearing an oversized gray sweatshirt, one hand in pocket, ghostly mist trailing off the edge of frame."),
    # R family
    ("RSO", "R", "A figure mid-outburst with hair slightly wild, arms up and palms open in a 'what the hell' gesture, eyes wide and mouth open with a comic steam cloud emerging from the head, wearing a fiery red tee with small explosion patches on sleeves, feet planted firmly, a chat bubble bursting behind them."),
    ("RBS", "R", "A poised adult holding a small notebook open in one hand and a clean pen in the other, sitting upright on a simple stool, eyes warm and focused, a subtle smile of acknowledgment, wearing a crisp sage-green cardigan over a plain tee, a single potted plant beside them in full bloom."),
    ("RSU", "R", "A tightly-buttoned figure with arms crossed, shoulders squeezed inward, face wearing a taut forced smile that doesn't reach the eyes, small steam quietly escaping from the back of the collar, wearing a dusty lavender turtleneck, one foot tapping the floor nervously."),
    # A family
    ("ACL", "A", "A figure hugging an oversized pink teddy bear with both arms, cheek pressed against it affectionately, eyes closed in blissful devotion, small floating heart-shaped confetti around the head, wearing a soft pastel-pink sweatshirt, a phone charging cable wrapped loosely around one wrist."),
    ("ANR", "A", "A figure walking calmly forward with a coffee cup in one hand and a book tucked under the opposite arm, looking straight ahead with a relaxed knowing smile, wearing a minimalist sage-and-cream outfit, pace comfortable but purposeful, a subtle halo of clear air around them."),
    ("ADS", "A", "A figure standing alone on a bare platform, hands deep in coat pockets, gazing sideways into middle distance with neutral composed expression, wearing a long dusty-indigo trench coat, a thin scarf loose around the neck, a lone backpack beside them, slight wind lifting the coat tail."),
    # S family
    ("SCA", "S", "A figure holding a magnifying glass up to one eye peering through it, the other eye narrowed with detective focus, surrounded by small floating thought bubbles containing chat screenshots and question marks, wearing a sleuth-style mustard trench, one hand cradling a phone showing timestamps, slight crouch of investigation."),
    ("SNT", "S", "A figure seated cross-legged on a soft mat, palms resting upward on knees in an open gesture, eyes closed with a serene small smile, a gentle rippling water texture behind them suggesting calm surface, wearing flowy teal linen, small pebbles balanced carefully stacked beside them."),
    ("SFL", "S", "A figure reclining on a cloud-like floor pillow, one arm behind head, eyes half-open in lazy contentment, a small paper airplane drifting by above them, wearing a soft sky-blue oversized tee and pajama pants, an empty half-finished beverage in one loose hand, surroundings hazy and dreamy."),
    # Hidden
    ("MAD", "MAD", "A figure with wild hair and a tear-streaked-but-smiling face, one hand gripping a phone lit up with a long chat thread, the other hand clutching a half-empty cup, standing in a dramatic slight tilt, wearing a crumpled red oversized tee, jagged static lines emanating from the edges, expression oscillating between rage and pleading."),
    ("RAT", "RAT", "A small-framed figure in a slightly oversized hoodie, hood pulled partially over the head, shoulders slumped inward, holding a single wilted flower towards the viewer with a hesitant apologetic smile, ears very slightly rat-like beneath the hood, wearing muted mushroom-gray tones, crouched low to appear smaller."),
    ("ALL", "ALL", "A figure standing in a neutral T-pose with a slight contented smile, wearing a perfectly symmetrical half-and-half outfit (one side warm, one side cool), hands holding two identical small objects, expression serene and non-committal, facing the viewer straight-on, slight glow of ambiguity surrounding them."),
    ("VOID", "VOID", "A solitary figure seated alone on a single chair in wide empty space, gazing out into the distance with a thoughtful but unbothered expression, a small book open on the lap, wearing a deep navy oversized sweater, no other figures or social props visible, composition emphasizes comfortable solitude rather than loneliness."),
]


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


LOCK = (
    "Redraw in this exact flat-vector 16personalities portrait style: "
    "identical low-poly faceted polygon shading, identical off-white "
    "background (#f5f3ef) with a soft elliptical floor shadow, absolutely "
    "no visible outlines, same clean mid-saturation harmonious palette, "
    "same stylized semi-realistic adult proportions, same centered "
    "full-body 1:1 composition. Replace the character and scene with: "
)


def build_prompt(subject: str, tint: str) -> str:
    return (
        f"{LOCK}{subject} "
        f"Background: off-white subtly washed with {tint}, "
        "preserve the elliptical floor shadow beneath the figure."
    )


def gen_one(client: genai.Client, code: str, subject: str, tint_key: str, src: Image.Image) -> bool:
    prompt = build_prompt(subject, TINT[tint_key])
    out_path = OUT_DIR / f"{code}.png"
    cfg = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=_image_config(),
    )

    for attempt in range(6):
        try:
            resp = client.models.generate_content(
                model=MODEL, contents=[prompt, src], config=cfg
            )
        except Exception as e:
            msg = str(e)
            if (
                any(s in msg for s in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED"))
                and attempt < 5
            ):
                wait = 2**attempt * 5
                print(f"  [{code}] transient error, sleeping {wait}s: {msg[:100]}", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  [{code}] FAIL: {msg[:200]}", file=sys.stderr)
            return False

        parts = resp.parts or []
        for part in parts:
            if img := part.as_image():
                img.save(str(out_path))
                print(f"  [{code}] saved -> {out_path.name}")
                return True

        cands = getattr(resp, "candidates", None) or []
        finish = [getattr(c, "finish_reason", None) for c in cands]
        txt = (getattr(resp, "text", None) or "")[:120]
        print(
            f"  [{code}] no image attempt {attempt + 1}; finish={finish} text={txt}",
            file=sys.stderr,
        )
        time.sleep(3)

    return False


def main() -> int:
    if not ANCHOR.exists():
        print(f"anchor missing: {ANCHOR}", file=sys.stderr)
        return 1

    client = _make_client()
    src = Image.open(ANCHOR)

    ok: list[str] = []
    fail: list[str] = []
    for code, tint_key, subject in PERSONAS:
        print(f"-> {code} ({tint_key})")
        if gen_one(client, code, subject, tint_key, src):
            ok.append(code)
        else:
            fail.append(code)

    print(f"\ndone: {len(ok)}/{len(PERSONAS)} succeeded")
    if fail:
        print(f"failed: {', '.join(fail)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
