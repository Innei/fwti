# FWTI v3 · 十二型 + 四隐藏人格画像 AI 生图 Prompt Kit

v3 题库与人格全量重写后的配套立绘提示词。老版本（16 主 + 8 hidden）画像存档于
`src/assets/portraits/*.webp`，v3 新画像另命名（仍沿用 code + `.webp`，置于同目录）。
若 v2 codes 无须重绘，旧 webp 可保留为 legacy 渲染兜底；v3 codes 新画像按下表生成。

## 1. 适用范围

- 12 主型：C 族 CHS / CMD / CNV · R 族 RSO / RBS / RSU · A 族 ACL / ANR / ADS · S 族 SCA / SNT / SFL
- 4 隐藏：MAD 发疯文学家 · RAT 鼠鼠恋人 · ALL 我全都要 · VOID 恋爱绝缘体

## 2. 共用 Base Prompt（一贯到底）

> 目标：严格对齐 16personalities.com 官方立绘风格——2D 扁平矢量、低多边面切阴影、
> 绝无描边、中等饱和的和谐色块、近白背景淡染族色、脚下椭圆软影。

```
A single full-body character illustration in the official 16personalities.com
portrait style: 2D flat-vector art with low-poly faceted polygon shading on
clothing and hair, crisp geometric color blocks with absolutely no visible
outlines, clean mid-saturation palette in harmonious tones (not desaturated,
not neon), stylized semi-realistic adult proportions with gentle caricature,
centered full-body composition on a 1:1 square canvas, solid off-white
background (#f5f3ef) subtly washed with a single family accent hue,
a soft elliptical floor shadow directly beneath the figure, grounded natural
standing or sitting pose, contemporary fashion with clearly faceted fabric
folds, personality expressed through one signature prop and one signature
posture, editorial portrait illustration
```

## 3. Negative Prompt

```
anime, manga, chibi, heavy black outlines, realistic photo, 3D render,
oil painting, watercolor texture, pixel art, messy linework, sketchy,
busy cluttered background, multiple characters, text, typography, logo,
watermark, distorted hands, extra fingers, low resolution
```

## 4. 参数建议

- Midjourney v6+：`--ar 1:1 --style raw --stylize 150`
- 保持跨批次一致性：固定一张首批出的 anchor 图作 `--sref`，`--sw 100–200`
- DALL·E 3：直接前缀 `A 1:1 editorial flat-vector illustration, ` 再接 subject + base prompt
- SDXL：采样 `DPM++ 2M Karras`，cfg 6-7，step 30；LoRA 优选 flat-vector / editorial-illustration

## 5. 跨批次一致性协议

两步 rollout，避免视觉风格漂移：

1. **首批锚点**：先只生 4 张——每族中档 1 张作 anchor（`CMD / RBS / ANR / SNT`），确认
   风格统一后固定其一作 `--sref`。
2. **二批展开**：其余 8 主型 + 4 hidden 皆以上步 `--sref` 跑。

## 6. 家族底色线索（Family color cue）

> 官方风格：背景以 off-white 为底，仅淡染约 10–15% 族色，切勿整幅重染。

| Family | 维度主导 | cue 字段（接 base prompt 尾） |
|---|---|---|
| **C · 接触族** | 追 / 避 | `, off-white background subtly washed with a soft blush pink tint #ff6b9d at ~12% saturation` |
| **R · 调节族** | 暴 / 闷 | `, off-white background subtly washed with a warm crimson tint #ff5252 at ~12% saturation` |
| **A · 黏附族** | 黏 / 离 | `, off-white background subtly washed with a soft coral tint #ff9aa2 at ~12% saturation` |
| **S · 安全族** | 疑 / 佛 | `, off-white background subtly washed with a muted teal tint #4a90a4 at ~12% saturation` |
| **Hidden** | — | 各自独立配色（见各 hidden 条目） |

## 7. 12 主型 Subject Prompts

> 格式：每型列出 subject 段，插入 base prompt 前端：
>
> ```
> <Subject>. <Base prompt> <Family color cue>.
> ```

---

### C 族 · 接触派

**CHS · 赛博舔狗**（C+ 追端 · 主动爆表）
```
A young adult with wide hopeful eyes and a flushed eager smile, leaning forward
intensely, one hand clutching a glowing smartphone showing three unread messages,
messenger-app heart icons floating around, tongue slightly out like a loyal dog,
wearing a hoodie with a small dog-ear hood pattern, shoulders raised with
restless energy
```

**CMD · 佛系选手**（C 中 · 慢回慢热）
```
A calm figure seated on a low cushion in half-lotus pose, eyes half-closed in
relaxed focus, holding a phone loosely in one hand without looking at it,
a wilting tea plume rising from a cup nearby, wearing loose linen neutrals,
posture slack but not slumped, peaceful but slightly absent gaze
```

**CNV · 已读不回之神**（C- 避端 · 消失大师）
```
A figure turning halfway away from viewer, phone face-down on a small table
beside them, showing "99+" stacked notification dots fading into smoke above
the screen, expression blank and unreadable, wearing an oversized gray
sweatshirt, one hand in pocket, ghostly mist trailing off the edge of frame
```

### R 族 · 调节派

**RSO · 炸毛选手**（R+ 暴端 · 情绪直出）
```
A figure mid-outburst with hair slightly wild, arms up and palms open in a
"what the hell" gesture, eyes wide and mouth open with a comic steam cloud
emerging from the head, wearing a fiery red tee with small explosion patches
on sleeves, feet planted firmly, a chat bubble bursting behind them
```

**RBS · 情绪稳定课代表**（R 中 · 健康调节）
```
A poised adult holding a small notebook open in one hand and a clean pen in
the other, sitting upright on a simple stool, eyes warm and focused, a subtle
smile of acknowledgment, wearing a crisp sage-green cardigan over a plain
tee, a single potted plant beside them in full bloom
```

**RSU · 嘴硬闷骚型**（R- 闷端 · 高压锅）
```
A tightly-buttoned figure with arms crossed, shoulders squeezed inward, face
wearing a taut forced smile that doesn't reach the eyes, steam quietly escaping
from the back of the collar, wearing a dusty lavender turtleneck, one foot
tapping the floor nervously, a small knot of twisted fabric visible on the
sleeve edge
```

### A 族 · 黏附派

**ACL · 恋爱脑**（A+ 黏端 · 全情投入）
```
A figure hugging an oversized pink teddy bear with both arms, cheek pressed
against it affectionately, eyes closed in blissful devotion, small floating
heart-shaped confetti around the head, wearing a soft pastel-pink sweatshirt
with one sleeve slightly rolled up, phone charging cable wrapped loosely
around one wrist
```

**ANR · 人间清醒型**（A 中 · 距离感）
```
A figure walking calmly forward with a coffee cup in one hand and a book
tucked under the opposite arm, looking straight ahead with a relaxed knowing
smile, wearing a minimalist sage-and-cream outfit, pace comfortable but
purposeful, a subtle halo of clear air around them
```

**ADS · 冷面独行侠**（A- 离端 · 自给自足）
```
A figure standing alone on a bare platform, hands deep in coat pockets, gazing
sideways into middle distance with neutral composed expression, wearing a
long dusty-indigo trench coat, a single thin scarf loose around the neck, a
lone backpack beside them, slight wind lifting the coat tail
```

### S 族 · 安全派

**SCA · 醋王查岗**（S+ 疑端 · 排查型）
```
A figure holding a magnifying glass up to one eye peering through it, the
other eye narrowed with detective focus, surrounded by small floating thought
bubbles containing chat screenshots, phone notifications, and question marks,
wearing a sleuth-style mustard trench, one hand cradling a phone showing
timestamps, slight crouch of investigation
```

**SNT · 稳心型**（S 中 · 信任在线）
```
A figure seated cross-legged on a soft mat, palms resting upward on knees in
an open gesture, eyes closed with a serene small smile, a gentle rippling
water texture behind them suggesting calm surface, wearing flowy teal linen,
small pebbles balanced carefully stacked beside them
```

**SFL · 心大派**（S- 佛端 · 云淡风轻）
```
A figure reclining on a cloud-like floor pillow, one arm behind head, eyes
half-open in lazy contentment, a small paper airplane drifting by above them,
wearing a soft sky-blue oversized tee and pajama pants, an empty half-finished
beverage in one loose hand, surroundings hazy and dreamy
```

## 8. 4 隐藏人格 Subject Prompts

### MAD · 发疯文学家（独立配色：crimson #d42a5a）
```
A figure with wild hair and a tear-streaked-but-smiling face, one hand gripping
a phone lit up with a 50-message chat thread, the other hand clutching a
half-empty cup, standing in a dramatic slight tilt, wearing a crumpled red
oversized tee, jagged static lines emanating from the edges, expression
oscillating between rage and pleading
```
cue: `, off-white background subtly washed with a deep crimson tint #d42a5a at ~12% saturation`

### RAT · 鼠鼠恋人（独立配色：mushroom #6b5b73）
```
A small-framed figure in a slightly oversized hoodie, hood pulled partially
over the head, shoulders slumped inward, holding a single wilted flower
towards the viewer with a hesitant apologetic smile, ears very slightly
rat-like beneath the hood, wearing muted mushroom-gray tones, crouched low
to appear smaller
```
cue: `, off-white background subtly washed with a soft mushroom gray tint #6b5b73 at ~12% saturation`

### ALL · 我全都要（独立配色：sand #c5a880）
```
A figure standing in a neutral T-pose with a slight contented smile, wearing
a perfectly symmetrical half-and-half outfit (one side warm, one side cool),
hands holding two identical small objects, expression serene and
non-committal, facing the viewer straight-on, slight glow of ambiguity
surrounding them
```
cue: `, off-white background subtly washed with a warm sand beige tint #c5a880 at ~12% saturation`

### VOID · 恋爱绝缘体（独立配色：deep indigo #2f4858）
```
A solitary figure seated alone on a single chair in wide empty space, gazing
out into the distance with a thoughtful but unbothered expression, a small
book open on the lap, wearing a deep navy oversized sweater, no other
figures or social props visible, the composition emphasizes comfortable
solitude rather than loneliness
```
cue: `, off-white background subtly washed with a deep indigo-teal tint #2f4858 at ~12% saturation`

## 9. 生成后处理（必做）

1. 以 `CODE_*.png` 格式命名（例：`CHS_1.png`），置于 `$PORTRAIT_SRC`（默认 `~/Downloads/fwti`）。
2. 执行 `pnpm portraits:build`，`sharp` 会生成 `src/assets/portraits/<CODE>.webp`（800×800）。
3. 在结果页开发预览打开 `/result/v3.d.<随意 hash>`，逐码校对画风一致。

## 10. 与 v2 画像共存策略

- v2 的 24 张 webp 不动，仍为 legacy（v1/v2）share-link 结果页的兜底画像。
- v3 新 16 张与 v2 不重叠（除 MAD/RAT/ALL/VOID 四个 code 同名——v3 覆盖写入该 4 张）。
- 若后续需纯净化，可将 v2 专属 code（GZNY 等）的 webp 迁移到 `src/assets/portraits/legacy/`；
  `Portrait.tsx` 先探 `legacy/` 再探主目录。此步本轮不做。
