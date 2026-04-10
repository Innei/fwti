# FWTI × 16p Redesign Spec

**Date**: 2026-04-10
**Status**: Approved
**Scope**: Full visual redesign of Home, Quiz, Result pages

## Background

Current `fwti` (Fèiwù Type Indicator — 恋爱废物人格测试) is a SolidJS SPA themed with the Claude / Anthropic parchment-and-terracotta design system. The product mirrors MBTI in structure (31 questions, 4 dimensions, 16 personalities). Reference site `16personalities.com/free-personality-test` has a cleaner, more recognizable quiz aesthetic. Goal: port the visual language and question UX of 16p while keeping FWTI's content and humor.

Design direction was selected via visual companion brainstorming: **option A — 刻其形** (full 16p clone, replacing Claude palette).

## Goals

- Replace Claude warm-parchment palette with 16p's white + green accent system.
- Adopt 16p's seven-point bipolar agree/disagree scale in place of current A/B option buttons.
- Restructure Quiz into a **single scrolling page** (no pagination) with all 31 questions visible.
- Add four-family color theming on the Result page, keyed off the first two personality-code dimensions (G/D × Z/R).
- Leave room for future chibi character illustrations (one per personality) without forcing their existence today.

## Non-Goals

- No redesign of the question content or scoring logic.
- No restyling of the underlying `codec.ts` URL hash format.
- Chibi illustration production is out of scope — the spec defines placeholder behavior and the swap point only.
- No i18n beyond the existing zh-Hans + Latin code mix.

## Color System

Default brand:

| Token | Hex | Usage |
|-------|-----|-------|
| `--fwti-green` | `#33a474` | Primary brand, default quiz accent, progress filler |
| `--fwti-bg` | `#ffffff` | Page background |
| `--fwti-bg-soft` | `#f9f9f9` | Subtle section background |
| `--fwti-text-dark` | `#343c4b` | Headings, primary body |
| `--fwti-text-mid` | `#576071` | Secondary body |
| `--fwti-text-soft` | `#8a95a7` | Tertiary, captions |
| `--fwti-border` | `#eeeff1` | Standard borders |
| `--fwti-border-strong` | `#dddfe2` | Emphasized borders |

Four-family accent colors, keyed off the first two letters of the personality code:

| Family | Dimensions | Hex | Example codes |
|--------|-----------|-----|---------------|
| `gz` | G 冲动 + Z 暴躁 | `#F25E62` (红) | GZNY, GZNF, GZLY, GZLF |
| `gr` | G 冲动 + R 忍耐 | `#E4AE3A` (黄) | GRNY, GRNF, GRLY, GRLF |
| `dz` | D 犹豫 + Z 暴躁 | `#88619A` (紫) | DZNY, DZNF, DZLY, DZLF |
| `dr` | D 犹豫 + R 忍耐 | `#33a474` (绿) | DRNY, DRNF, DRLY, DRLF |

A utility `getFamily(code: string): 'gz' | 'gr' | 'dz' | 'dr'` reads `code[0] + code[1]` and maps to the family key. Each family exposes `--fwti-accent` via a `data-family` attribute on the Result root so per-family styling is CSS-only.

## Typography

```css
--fwti-font-title: 'Red Hat Display', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
--fwti-font-body:  'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
```

- Titles use `Red Hat Display` weight 700 for Latin, falling back to `Noto Sans SC` weight 700 for CJK.
- Body uses `Inter` weight 400/500.
- The existing `Source Serif 4` serif stack is removed entirely.
- The `.serif` class is removed or repurposed as a no-op (title font handled by tag-level styling).

Size ramp (approximate, finalized during implementation):

| Role | Size | Weight |
|------|------|--------|
| Display (Home hero) | 44–56px | 700 |
| Section title | 28–34px | 700 |
| Question text | 22–26px | 500 |
| Body | 16px | 400 |
| Caption | 13–14px | 400 |

## Home Page

Layout (top → bottom):

1. **Sticky top nav** — white background, bottom border `#eeeff1`, FWTI wordmark + version chip.
2. **Green hero block** — full-bleed background `#33a474`, white text:
   - Eyebrow: `Fèiwù Type Indicator`
   - Title: `恋爱废物人格测试`
   - Lede: `三十一道灵魂拷问，四维交叉分析，为君精准定位此生爱情之废料品类。`
   - CTA: white-background button with green text, `开始测试 →`
   - Meta: `约需 5 分钟`
3. **Tips row** — three cards on white, rounded 10px, light border. Mirrors 16p's "be honest / don't overthink / must pick" tips, adapted:
   - 据实以答
   - 勿钻牛角
   - 题必有选
4. **16 preview grid** — 4×4 grid of personality preview tiles. Each tile: family-colored border, code text, Chinese name. Tile background: soft family-color tint (~8% opacity). This is the chibi swap point.
5. **Footer** — disclaimer text, muted.

## Quiz Page

**Structural change**: the quiz becomes a single scrollable page rendering all 31 questions at once. The `?q=N` query param is removed. Routing becomes `/quiz` (no params). Page-to-page fade transitions are removed.

Layout:

1. **Sticky top nav** — white, bottom border, FWTI wordmark + live progress counter `进行中 · n / 31`.
2. **Quiz container** — max-width ~700px, centered, vertical rhythm of ~64px between question blocks.
3. **Question block** (×31):
   - Small label: `Q01` (monospace-ish, `--fwti-text-soft`)
   - Question text: centered, Red Hat Display weight 500, ~24px
   - Seven-point bipolar scale, centered, horizontal:
     - Left label `同意`
     - Circles sized 38 / 30 / 22 / 14 / 22 / 30 / 38 (px)
     - Left three: green (`--fwti-green`), filled when active
     - Center: neutral gray ring (`#d7dae1`)
     - Right three: neutral dark gray (`#576071`), filled when active
     - Right label `不同意`
   - Spacing between scale dots: 14px
   - Clicking a dot records the answer and smooth-scrolls the next unanswered question into view (center of viewport). If all questions are answered, scroll to the submit bar.
4. **Fixed bottom bar** — full-width white with top border, contains:
   - Thin progress bar (4px, rounded, `#eeeff1` track, `#33a474` fill, smooth transition)
   - Percentage text (`n%`)
   - Submit button `查看结果 →` — disabled until `progress === totalQ`, enabled state uses `#33a474` background.

Interaction rules:
- Scale interactions record via existing `setAnswers`. The scoring function needs mapping: a seven-point selection becomes a weight per option. Current `scoring.ts` takes `optIdx` (0 or 1) — the scale must collapse to this. **Decision**: indices 0–2 map to option A with weight 1, index 3 is disallowed (center dot is not selectable, just visual), indices 4–6 map to option B with weight 1. Simpler alternative: indices 0–2 → A, 3–6 → B. The implementation plan will choose once the scoring module is inspected — the scale's visual behavior is locked regardless.
- Auto-scroll uses native `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- No prev/next buttons. Users can scroll freely; any click updates the same answer.

## Result Page

Layout themed by `data-family={getFamily(code)}` on the Result root, which rebinds `--fwti-accent`.

1. **Sticky top nav** — white, with `重新测试` button on the right.
2. **Hero** — white background, centered:
   - Eyebrow `测试完成 · 你的废物类型是`
   - Chibi placeholder: 132px square with a radial family-color gradient background + the current `<PersonalityIcon>` SVG overlaid. When real art exists this becomes `<img src={`/personalities/${code}.png`} />`.
   - Code: monospace, large, family accent color
   - Name: Red Hat Display 700, ~40px
   - English name: body font, muted
   - Tagline in quotes: body, italic-ish, muted
   - Waste meter: five-dot row, filled dots in family accent
3. **Hidden title card** (conditional): family-tinted background, accent border, `隐藏成就` badge, hidden name + description.
4. **Dimension analysis section** — white, thin top border, section eyebrow + title. Each dim row:
   - Dim label
   - Bipolar bar: left label — track (`#eeeff1`) — right label; fill colored with family accent, width = `valueA` percentage
5. **Description section** — body text, relaxed line-height (1.7).
6. **Traits section** — numbered list, accent numerals.
7. **Catchphrases section** — blockquote cards, soft background `#f9f9f9`, rounded 10px.
8. **Matches section** — two cards side by side: best match (family accent border/tint) and worst match (muted red `#F25E62` border/tint).
9. **Advice section** — large pullquote, accent color quote marks.
10. **Footer** — CTA `再测一次 →` (filled family accent) + disclaimer.

The `dark-section` alternation pattern is removed. Sections sit on white, separated by generous vertical spacing and optional 1px top borders.

## Component & File Changes

| File | Change |
|------|--------|
| `src/App.tsx` | Remove `currentQ`, `fadeClass`, `QuizPage` prev/next. Convert `QuizPage` to a single-scroll layout mapping over `questions`. Remove `?q=N` search param handling. Rewrite `globalStyles` or move to a new CSS file. |
| `src/App.tsx` → `HomePage` | Replace hero structure, add tips row, add 16-preview grid. |
| `src/App.tsx` → `ResultPage` | Add `data-family` binding; restructure sections per spec; remove dark-section class. |
| `src/logic/family.ts` (new) | Export `getFamily(code: string): 'gz' \| 'gr' \| 'dz' \| 'dr'`. Pure mapping from first two code letters. |
| `src/components/PersonalityIcon.tsx` | Unchanged internals; kept as placeholder. Wrapper in Result swaps to `<img>` once assets land. |
| `src/components/QuestionScale.tsx` (new) | Seven-point bipolar scale component. Props: `value: number \| undefined`, `onSelect: (value: number) => void`, optional `accentColor`. |
| `src/styles/` (new) or inline | Rewrite the entire global stylesheet to the 16p system. Remove all Claude warm-palette tokens. |
| `index.html` | Add `<link>` tags for Red Hat Display (700) and Inter (400, 500) from Google Fonts — check against existing font loading. |

Routes after the change:

```
/          → HomeRoute
/quiz      → QuizRoute       (no ?q= param, single-page)
/result/:hash → ResultRoute
```

The `/quiz` route no longer reads `searchParams.q`, and the `needsReset` fallback logic is removed. If a user lands on `/quiz` with no answers that is now the normal starting state.

## Scoring Compatibility

`src/logic/scoring.ts` currently expects a binary `optIdx` per question. The spec locks the **visual** behavior of the seven-point scale; the implementation plan will decide the collapse rule after inspecting `scoring.ts`. Two viable options:

1. **Binary collapse** — indices `{0,1,2}` → option A, `{4,5,6}` → option B, index 3 is visually neutral but not selectable (click is ignored or treated as no-op). Simplest, preserves scoring as-is.
2. **Weighted collapse** — indices `{0,1,2}` → option A with weights `{1, 0.66, 0.33}`, mirror on B side. Requires touching `scoring.ts`.

Default is option 1 unless implementation finds it breaks the feel. Either way, `encodeAnswers`/`decodeAnswers` and the URL hash format stay untouched.

## Placeholder Strategy for Chibi Art

Until `/public/personalities/{code}.png` (or equivalent) exists:

- **Home preview grid**: each tile shows code + name on a family-tinted background, no image.
- **Result hero**: a 132px round container with a radial family-accent gradient background + the existing `<PersonalityIcon>` SVG centered on top.

When art lands, swap to `<img>` at two well-defined sites (Home tile, Result hero). No other code changes should be needed.

## Responsive Behavior

- **Desktop (≥992px)**: full layouts as specified, 16 preview grid is 4×4, tips row is 3 columns, quiz container ~700px.
- **Tablet (768–991px)**: preview grid 4×2 or 2×4, tips row stays 3-col or stacks, quiz container 90vw.
- **Mobile (<768px)**: preview grid 2×8, tips row stacks, quiz container full-width with 20px side padding. Scale circles shrink slightly (32/26/20/12/20/26/32). Bottom fixed bar stays full-width.

## Out-of-Scope Follow-ups

- Chibi illustration asset generation and integration (the prompt pack exists; production is separate work).
- Sharing image (OG) generation.
- Per-personality theme variations beyond the four-family mapping.
- Dark mode.
