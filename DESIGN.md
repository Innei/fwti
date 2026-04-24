# Design System of FWTI (v2 · Sweet Wrapper, Dark Meme)

> **FWTI（Fèiwù Type Indicator · 恋爱废物人格测试）** — A Chinese self-deprecating romance personality quiz. 16 archetypes + 8 hidden types, built with Solid.js + Vike SSG.

> v2 redesign: **甜皮黑心 / neo-brutalist 贴纸风**。奶油 pastel 底 + 粗黑描边 + 硬位移黑影 + 家族色贴纸块 + washi 胶带装饰。纯换皮（IA1），页 / 路由 / 组件树 / 逻辑不动，仅重写视觉语言。

---

## 0. What changed vs v1

| 维度 | v1（current code） | v2（target） |
|---|---|---|
| 气质 | 绿 accent + zinc 中性灰 · 干净 SaaS | 奶油 pastel + 粗黑边 + 位移影 · 贴纸手账 |
| 边 | `1px solid #e4e4e7` 细淡灰 | `2px solid #1a1a1a` 粗黑墨 |
| 影 | 只在 hover 出现；多层柔化 `rgba(0,0,0,0.08)` | 常态 hard offset `4px 4px 0 #1a1a1a`（无 blur）|
| 主色 | 单 emerald `#33a474` | 四家族 pastel（珊瑚 / 柠檬 / 薰紫 / 薄荷）+ CTA 珊瑚浓 `#FF4D6D` |
| display 字 | Red Hat Display 700 | Archivo Black 900 + Noto Sans SC Heavy |
| 深色模式 | 全盘翻转（bg / ink / surface 全变） | 墙反卡不反 — 只翻 bg / nav / 墙上之字；卡内部仍奶油 |
| 装饰 | 无 | washi 胶带斜条 + 虚线分隔 + highlight 底色 + 家族/隐藏圆章 badge |
| 范围 | — | 路由 / 页结构 / 组件树 / 业务逻辑不动；改 CSS + 组件模板 |

---

## 1. Visual Theme & Atmosphere

v2 的基调是**甜皮黑心**（sweet wrapper, dark meme）——奶油 pastel 外壳把"你是恋爱废物"的毒舌裹起来，像朋友手写的便签塞进你口袋，拆开才发现里面在骂你。

**Key characteristics:**

- **Primary surface**：奶油纸 `#FFF8F0`（light）/ 深炭 `#0F0E0D`（dark）。奶油不是纯白，是带一点暖黄的纸色，呼应手账 metaphor。
- **Ink 墨色**：`#1a1a1a`（light 常亮）/ `#F5EBD7`（dark 翻转）。用于边、主文字、位移影。整个 brutalist 语言都建立在这一笔"墨"上。
- **Family colors as pastel stickers**：GZ 珊瑚 `#FFB4B8`、GR 柠檬 `#FFE08A`、DZ 薰紫 `#D4B8E8`、DR 薄荷 `#A8E6C9`。每色都是低饱和、高明度的贴纸色，必配 `2px #1a1a1a` 黑边 + `4px 4px 0` 黑影，否则在奶油底上会化。
- **Single accent CTA**：珊瑚浓 `#FF4D6D`，只用于 primary 按钮（开始测试 / 下一题 / 生成分享图），全站唯一的"饱和色注意力"。
- **Shadow as stamp**：所有 card / button / badge 在 resting 状态就带 `4px 4px 0 var(--shadow-ink)` 硬位移影，无 blur。效果像贴纸压上去有一个黑色错位的印。**hover 不加影，改位移**（见 §6）。
- **Typography pairing**：`Archivo Black`（900，display）+ `Inter`（400-700，body / UI）+ `JetBrains Mono`（编号 / meta）。中文对应 `Noto Sans SC` Heavy（900）/ Medium-Semibold。
- **Radii vocabulary**：`999px` pill（chip / 进度 / family badge 圆章）/ `12-14px` card & button / `10px` quiz option / `6-8px` small inline（letter 方块、code chip）/ `0` 极罕用（仅虚线 divider 端点）。
- **Decoration as grammar**：washi 胶带斜条（rotated 半透矩形）、`2px dashed` 分隔、`<mark>` 式 highlight 底色 —— 用于强调但不过量（每屏 ≤ 3 处）。
- **Dark mode · 墙反卡不反**：只反 bg / nav / 墙上之字 / 影子色；卡片（portrait / 人格卡 / quiz 选项 / modal）内部继续走 light 配色。详见 §2.5。
- **Motion**：`0.15s ease` 默认；选中态用 `transform: translate(2px,2px)` + 阴影同步缩 2px，模拟"按下贴纸"。modal 入场保留 `cubic-bezier(0.16,1,0.3,1) 0.22s`。

---

## 2. Color Palette & Roles

### 2.1 Primary Brand

- **奶油 Cream** (`#FFF8F0`)：`--fwti-bg`。页底、卡底衬托。
- **蜜桃纸 Peach Paper** (`#FFE5D4`)：`--fwti-bg-card`。personality 卡、quiz 题干卡、history 列表项。
- **分区蜜桃 Soft Peach** (`#FFF0E5`)：`--fwti-bg-soft`。section 分区、quiz 外层容器。
- **墨 Ink** (`#1a1a1a`)：`--fwti-ink`。主文字、边、位移影、纯黑 badge。

### 2.2 Accent

- **珊瑚浓 Coral Pop** (`#FF4D6D`)：`--fwti-accent`。primary CTA 唯一饱和色。悬停 `#E8334F`，禁用 `opacity: 0.45`。
- **Accent ink on**：`#ffffff`。文字 on accent 永远是白，不用 ink。

### 2.3 Personality Family Colors (Pastel)

| 代码 | 名 | Hex | 用途 |
|---|---|---|---|
| GZ | 珊瑚 Coral | `#FFB4B8` | 冲动暴躁家族底色 · portrait 框 · 结果卡染色 |
| GR | 柠檬 Lemon | `#FFE08A` | 冲动忍耐家族 · washi 胶带常用色 · A 选项 letter |
| DZ | 薰紫 Lavender | `#D4B8E8` | 犹豫暴躁家族 · 维度 N 条 |
| DR | 薄荷 Mint | `#A8E6C9` | 犹豫忍耐家族 · 维度 Y 条 |

**Rule**：pastel 色块内文字**强制** `color: var(--on-pastel)` = `#1a1a1a`，永不跟 `--fwti-ink` 翻转。此规则在 dark mode 下尤为关键——否则深底上的 pastel 贴纸会继承反色文字而白字贴浅底，失去可读性。

### 2.4 Hidden Personality Accents

保留 v1 的 10 款隐藏家族色（ALL / RAT / PURE / MAD / E-DOG / CHAOS / CPU / BENCH / VOID / LIMBO），但在 v2 都套同一套 pastel 调色——低饱和 + 必配黑边 + 黑影。若与 family 4 色冲突（如 E-DOG 粉接近 GZ），走圆章 badge 的黑底荧光字版本（`bg: #1a1a1a, text: #FFE08A or #FFB4B8`）以区分。

### 2.5 Dark Mode — 墙反卡不反

- **bg**: `#0F0E0D`（深炭墙）
- **bg-soft**: `#1A1917`（分区更深）
- **ink**: `#F5EBD7`（奶油纸色，墙上用）
- **shadow-ink**: `#F5EBD7`（影子变"墙光"）
- **nav / footer / page-level 大标题 / subtitle** → 走 `--ink`
- **卡内部**（portrait 框、人格卡、quiz 选项、modal body、chip）**继续用 light token**：底仍是 pastel / 蜜桃，文字仍是 `#1a1a1a`，边仍是 `#1a1a1a`
- **CTA 珊瑚浓** 不变；on-dark 时边改为 `--ink`（`#F5EBD7`），影子改为 `--shadow-ink`

切换沿用 v1 机制：`localStorage['fwti-theme']` + `<html data-theme="dark">` + `+Head.tsx` 的 FOUC 预置脚本，代码不动。

---

## 3. Typography Rules

Google Fonts loaded: `Inter:wght@400;500;600;700`, `Archivo Black:wght@400`, `Noto Sans SC:wght@400;500;700;900`, `JetBrains Mono:wght@500;700`.

废除 `Red Hat Display`——v2 的 display 字靠 `Archivo Black` 900 + `Noto Sans SC` 900 的硬实感，Red Hat Display 的人文几何太柔。

**Variables:**
- `--font-display`: `'Archivo Black', 'Noto Sans SC', system-ui, sans-serif`
- `--font-body`: `'Inter', 'Noto Sans SC', system-ui, sans-serif`
- `--font-mono`: `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`

| Role | Font | Size | Weight | LH | Tracking | Notes |
|---|---|---|---|---|---|---|
| Home Hero 超大字 | display | 56-72px 流动 | 900 | 0.98 | −1px | 2 行中文 + 1 行小副标 |
| Result Hero 名 | display | 36-48px | 900 | 1.05 | −0.5px | portrait 右侧 |
| Quiz 题干 | display | 22-26px | 800-900 | 1.35 | normal | 独立题干卡内 |
| Section Title | display | 28-36px | 900 | 1.10 | −0.5px | home grid 上、result section 间 |
| Preview Tile Name | display | 18-20px | 900 | 1.10 | 0 | 家族色网格卡名 |
| Catchphrase | display | 18-22px | 800 | 1.50 | 0 | 结果页 "君之废程" 金句框 |
| Body (description) | body | 15-17px | 500 | 1.75 | 0 | personality 描述长文 |
| Option Text | body | 13-15px | 600 | 1.45 | 0 | quiz 选项内文 |
| Nav / Small UI | body | 13-14px | 700 | normal | +0.2px | nav 链接、按钮内 |
| Small Label / Hint | body | 11-12px | 600 | 1.55 | +0.3px | 题目 meta、配对 label |
| Code / Meta | mono | 10-12px | 500-700 | normal | +0.5px | GZNY 类代码、进度 19/33、时间戳 |
| Badge / Chip | body | 10-11px | 700-900 | normal | +0.4px | family chip、+2 维度徽章 |

**Rules:**
1. Display 字只用 900 一档——v2 不要渐变 weight。要弱化就降字号，不降 weight。
2. 中文 display 用 `font-synthesis: none`；Noto Sans SC Heavy（900）单独加载，不要浏览器合成加粗。
3. `font-feature-settings: 'palt'` 保留（CJK 比例间距）。
4. Highlight 用 `<mark>`：`background: #FFE08A; padding: 1px 4px; border: 1.5px solid #1a1a1a; font-weight: 700`。每屏 ≤ 3 处。

---

## 4. Component Stylings

### 4.1 Buttons

**Primary Coral (`.btn.btn-primary`)**
- bg: `#FF4D6D` · color: `#fff` · border: `2px solid var(--fwti-ink)` · radius: `10px`
- padding: `10-12px 18-22px` · font: display 13-14px weight 900
- shadow: `4px 4px 0 var(--shadow-ink)`
- hover: `transform: translate(1px,1px); box-shadow: 3px 3px 0 var(--shadow-ink)`
- active: `transform: translate(4px,4px); box-shadow: 0 0 0 var(--shadow-ink)`（完全压下）
- disabled: `opacity: 0.45; pointer-events: none`

**Secondary White (`.btn.btn-secondary`)**
- bg: `#fff` · color: `var(--fwti-ink)` · 其余同 primary
- hover: bg `--fwti-bg-card`

**Family Badge Button (`.btn.btn-family`)**
- bg: 家族 pastel（通过 CSS var `--family`）· color: `#1a1a1a`（永远不随主题翻）

### 4.2 Personality Tile (`.preview-tile`)

- 外层 bg: `var(--family-color)`（GZ/GR/DZ/DR pastel）
- border: `2px solid var(--fwti-ink)` · radius: `12px` · shadow: `4px 4px 0 var(--shadow-ink)`
- padding: `12-14px`
- 内含：portrait 缩略（`#FFE5D4` 底 + 1.5px 黑边）+ 代码 mono + 名 display 18-20px
- hover: `translate(-2px,-2px); box-shadow: 6px 6px 0 var(--shadow-ink)`（"贴纸翘起来"）
- focus: `outline: 3px solid var(--fwti-accent); outline-offset: 2px`
- grid: 4 列 desktop → 2 列 @720

### 4.3 Portrait Frame (PT1)

Portrait webp 本身不动。外套 frame：

- 外层 block: bg 家族 pastel · border `2.5px solid var(--fwti-ink)` · radius `14px` · shadow `5px 5px 0 var(--shadow-ink)` · padding `10-12px`
- 内衬：`aspect-ratio: 1; background: linear-gradient(135deg, ...); border: 1.5px solid var(--fwti-ink); border-radius: 8px`
- **Washi tape**: 1-2 条 `<div>` absolute-positioned 在框顶部，`width: 36-60px; height: 12-16px; background: rgba(家族其他色, 0.85); transform: rotate(±4-8deg)`。位置/角度/色**按 code 字符串 hash 推导**（`hash = sum(charCodeAt) % N`，分别取 left-offset / rotation / 对比色索引），保证同一代码在任何页面看起来一致、不随渲染闪动
- **Family badge**: 右上角 `-10px/-10px` 圆章，`32×32px; background: var(--fwti-ink); color: 家族色; border: 2px solid var(--fwti-ink); border-radius: 50%; font: mono 10px 900`
- **Hidden badge**: 同位置，bg 改为 `var(--fwti-accent)` 珊瑚浓，内容 `"隐"` 字。注：隐藏人格各自的 accent（MAD 红 / PURE 沙 / E-DOG 粉等）通过 `data-family` 注入 `--family-color`，用于结果页整体染色；badge 形状本身保持单一珊瑚版以免 24 种 badge 视觉冗余。

### 4.4 Quiz Option (`.quiz-opt`)

- bg: `#fff` · border: `2px solid var(--fwti-ink)` · radius: `10px` · padding: `10-12px 14px`
- shadow 默认: `3px 3px 0 var(--shadow-ink)`
- letter 方块 24×24：色按**选项序**固定轮转（A=GR 柠檬 / B=DZ 薰紫 / C=DR 薄荷；避珊瑚留给 CTA）+ `2px solid var(--fwti-ink)` + radius 6px
- option text: body 13-15px weight 600
- **hover（未选中）**: bg `var(--fwti-bg-card)`（蜜桃）· 影不变
- **selected**: bg = 该选项的 letter 同色 pastel · `transform: translate(2px,2px)` · `box-shadow: 1px 1px 0 var(--shadow-ink)` · 右侧挂 `+2 ZR` 式**维度**徽章（由题目 dimension 决定文字；`bg: var(--fwti-ink); color: 对应维度家族色; radius: 999px; mono 9px 900`）
- letter 方块在 selected 时: bg `var(--fwti-ink)`, color `#FFE08A`
- focus: `outline: 3px solid var(--fwti-accent); outline-offset: 2px`

### 4.5 Personality Card (home grid / result hero 通用)

- bg: `var(--fwti-bg-card)` 蜜桃纸 · border `2px solid var(--fwti-ink)` · radius 12px · shadow `4px 4px 0 var(--shadow-ink)`
- 顶部 washi tape 1 条（family 色或对比色）
- 左: portrait 缩略块 56×56 或 hero 140px（见 §4.3）
- 右: name display 15-26px 900 / 代码+废物指数 mono 10-11px / 金句框 `bg: #fff; border: 2px solid var(--fwti-ink); radius: 8px; shadow: 3px 3px 0; padding: 10px` / 四维 chip 行

### 4.6 Dimension Bar (四维条)

容器 card: `#fff` · border · radius 12px · shadow 4px。

每行：
- label 行 meta 10px weight 800：`G 主动` ← → `D 蹲等`
- 槽底 bar: `height: 12-14px; background: var(--fwti-bg-soft); border: 1.5px solid var(--fwti-ink); border-radius: 999px; overflow: hidden; position: relative`
- 中线: `::before { position:absolute; left:50%; top:0; bottom:0; width:1px; background: var(--fwti-ink); opacity: 0.4 }`
- fill: 从中心双向发散（保留 v1 逻辑），色 = 对应家族 pastel，右沿 `1.5px solid var(--fwti-ink)`

### 4.7 Modal (`.preview-modal`, `.share-image-dialog`)

- bg: `var(--fwti-bg)`（奶油）· border `2.5px solid var(--fwti-ink)` · radius 14px · shadow `6px 6px 0 var(--shadow-ink)` · padding 20-24px
- max-width: 520px（preview）/ 420px（share）
- backdrop: `rgba(10, 10, 10, 0.55)`，不 blur
- close 按钮：absolute top-right 独立圆章 24×24 · bg `#fff` · border 2px · shadow 2px 位移
- 入场：`from { opacity:0; transform: translateY(8px) scale(0.98); } to { full; }` · `0.22s cubic-bezier(0.16,1,0.3,1)`

### 4.8 Top Navigation (`.top-nav`)

- position: sticky · top: 0 · z: 50
- bg: `var(--fwti-bg)` **实色**（非磨砂）· border-bottom: `2px dashed var(--fwti-ink)`
- inner: max-width 1120 · padding `12-14px 24-32px` · flex
- logo: 珊瑚浓 bg + white "FWTI" · border 2px · radius 8px · shadow 3px 位移
- 主题切换：圆章 24×24 · bg `#fff` · border · shadow 2px · 内容 `☀` / `☾`
- 废除 v1 的 `backdrop-filter` — 磨砂不匹配 brutalist 贴纸语言

### 4.9 Submit Bar (Quiz 底栏)

- 不再 fixed 磨砂；改为 page 底部 `2px dashed var(--fwti-ink)` 虚线分隔 + 按钮 + meta 一行
- 进度条：单独在顶部（§4.10）

### 4.10 Progress Bar

- 容器: `height: 10px; background: #fff; border: 2px solid var(--fwti-ink); border-radius: 5px; overflow: hidden`
- fill: `background: var(--fwti-accent); border-right: 2px solid var(--fwti-ink)` · `transition: width 0.4s cubic-bezier(0.22,0.61,0.36,1)`
- 右侧挂 `19 / 33` mono badge

### 4.11 Chips / Badges

三式：

- **白 chip**：`bg: #fff; border: 1.5px solid var(--fwti-ink); radius: 999px; padding: 2-3px 8-10px; font: body 9-10px 700`
- **家族 chip**：同上但 bg 换家族 pastel
- **黑底荧光 chip**：`bg: var(--fwti-ink); color: 家族色（GR/GZ/DR 任选）; border: 1.5px solid var(--fwti-ink); radius: 999px; mono 9-10px 900`。用于 隐藏 badge、维度 +2 标记、强调 meta

### 4.12 Logo Mark

- 22×22px · bg: `#FF4D6D` · border: `2px solid var(--fwti-ink)` · radius: 6px · shadow: `2px 2px 0 var(--shadow-ink)`
- `::after` 内方块：inset 6px · bg `#fff` · radius 2px
- 文字 "FWTI"：display 18px 900 + `.02em` tracking（所有场景都在盒内而非盒外）

---

## 5. Layout Principles

**Base unit**: `8px`。Spacing 尺度延用 v1 的 xs–10xl 区间。

**Max-Width Containers** — 延用 v1（纯换皮不改容器宽度）：

| Context | Max Width |
|---|---|
| Top nav inner | 1120px |
| Preview grid | 1280px |
| Quiz list | 720px |
| Quiz options | 620px |
| Result container | 760px |
| Hero inner | 820px |
| Modal (preview) | 520px |

**Whitespace Philosophy:**

- **Breathing room 不降**：v2 贴纸感不是靠拥挤取得，是靠粗边 + 硬影。section gap 仍走 `64-72px`（约 8-9 baseline），保留"慢读"节奏。
- **Card internal padding 降**：从 v1 的 `26-32px` 降到 `12-18px`——粗边 + 阴影已经给了视觉分量，内边不需再撑。
- **Washi tape 位置稳定**：每个 portrait 框的胶带位置 / 角度不是真随机，按 code (`GZNY` 等) 的 hash 生成，保证同一个代码在不同页面看起来一致。

---

## 6. Depth & Elevation

v2 **废除 v1 的"flat at rest, shadow on hover"**，改为**贴纸常驻影，交互变位移**。

| Level | Treatment | Use |
|---|---|---|
| 0 — Card resting | `2px solid var(--fwti-ink) + 4px 4px 0 var(--shadow-ink)` | 所有 card / button / chip 默认 |
| 1 — Portrait frame | `2.5px solid + 5px 5px 0` | portrait 框稍厚一档 |
| 2 — Modal | `2.5px solid + 6px 6px 0` + backdrop | 比普通 card 深 2px 位移，示层级 |
| H — Hover (card) | `translate(-2px,-2px); box-shadow: 6-7px 6-7px 0` | "贴纸翘起" |
| H — Hover (button) | `translate(1px,1px); box-shadow: 3px 3px 0` | 轻微按下预告 |
| A — Active (button/option) | `translate(4px,4px); box-shadow: 0 0 0` | 完全压下 |
| S — Selected (quiz option) | `translate(2px,2px); box-shadow: 1px 1px 0` + 家族色底 | 半压状态 + 换色 |
| Focus | `outline: 3px solid var(--fwti-accent); outline-offset: 2px` | 键盘 focus 全站一致 |

**Shadow philosophy**：影不是 decoration，是**贴纸印在纸上的位移痕迹**——硬边、无 blur、纯色，始终存在。hover/active 通过"把印挤回去"传达交互，不通过"加更大的模糊光晕"。这与 v1 完全相反。

---

## 7. Do's and Don'ts

### Do's

- **Do** 永远配套使用 `2px solid var(--fwti-ink)` + `4px 4px 0 var(--shadow-ink)` —— 二者是贴纸语法的基础对仗，丢一个另一个也失效。
- **Do** 在 pastel 色块里强制写 `color: #1a1a1a`（或 `var(--on-pastel)`）。pastel 是"纸"，字是墨，永不翻。
- **Do** 把 family 语义通过 `data-family` CSS var 注入单变量 `--family-color`，所有 family-aware 组件只读这个变量。
- **Do** washi 胶带按 code hash 取位置 / 角度 / 色，保证同代码稳定。
- **Do** 按钮交互走位移 3 态：rest `4px 4px` → hover `translate(1,1) + 3px 3px` → active `translate(4,4) + 0 0`。
- **Do** dark mode 只改 `--fwti-bg` / `--fwti-bg-soft` / `--fwti-ink` / `--shadow-ink` 四个墙变量；卡内部不改。
- **Do** display 字用 Archivo Black + NSS Heavy 双配，`font-synthesis: none`。

### Don'ts

- **Don't** 给 card 加任何 blur 阴影（`rgba blur`），破坏 brutalist 契约。
- **Don't** 在 hover 增加阴影，应位移或换偏移量。
- **Don't** 把 `backdrop-filter: blur` 用在 nav / submit bar —— 磨砂与贴纸语言冲突。只 modal backdrop 保留。
- **Don't** 引入第五个 family 饱和色。四色 + 珊瑚浓 CTA + 墨，已经是全调色板。hidden 家族继续复用这 6 色或走黑底荧光变体。
- **Don't** 用 `font-weight` 介于 700-900 之间的值。display 就 900，body 就 500-700，不要 750。
- **Don't** 在 pastel 贴纸内部写 `color: var(--fwti-ink)` —— 深色模式下会翻白，贴纸变空。
- **Don't** 让 pastel 底不配黑边。赤裸 pastel 块在奶油底上会化，必须 2px 描线。
- **Don't** 把 washi 胶带当真随机 —— 每次渲染位置变会闪。要按稳定 seed 算。

---

## 8. Responsive Behavior

| Breakpoint | Width | Key Changes |
|---|---|---|
| Desktop | > 1100px | 4 列 grid；nav `14px 32px`；home hero 72px |
| Tablet | ≤ 900px | home hero 50px；portrait frame 160px |
| Mobile | ≤ 720px | 2 列 grid；result hero 垂直堆叠（portrait 上文本下）；nav `12px 20px`；home hero 40px |
| Small | ≤ 460px | home hero 32px；result name 28px；quiz 题干 20px；shadow 降到 `3px 3px 0` 省空间 |

**Collapsing strategy**：

- 4 列硬切 2 列，不走流体 —— 保持 tile 比例与黑边厚度对齐。
- result hero 在 ≤ 720 切成"portrait（60%宽居中）→ 名称 → 金句 → 四维 → 配对"的纵向流，portrait 右上 badge 仍外突 `-10px`。
- share 图预览在 modal 内永远固定 300×420 canvas 比例，不随 viewport 变（要导出 PNG 稳定）。

**Touch targets**：所有 button / option / tile 最小高 44px（实际加上 `4px` 影子区 = 可视 48px）。

---

## 9. Decisions & Rejected Alternatives

v2 是一组 4 轴决策（D2 + P1 + PT1 + IA1），脑暴中排除了：

- **纯甜 D1**（饱和粉 + emoji 堆砌）：甜到底与"废物"自嘲违和，弃之。
- **复古 D3 手账**（衬线中文 + 旧报纸）：文艺但与 sticker 基因冲突，且中文衬线在 hero 字号下 rendering 不稳。
- **单色 P2**（奶油 + 黑 + 单珊瑚，family 用符号 ◇◈◆◊）：品牌更整但丢了 FWTI 四家族的颜色锚点，用户无法靠色记忆家族。
- **饱和 P3**（heavy coral / grape / jade）：brutalist 正典但 4 饱和色 + 粗黑堆砌，在移动端阅读负担大。
- **重绘 PT3**（24 张重跑 MJ/DALL·E）：整得但周期 + 生图一致性风险高。PT1 用框装完成"融合"。
- **IA 重构 IA2/IA3**（一题一屏 / 杂志隐喻）：互动更强但需改 Vike 路由 + state 层，脱离"换皮"范围。保留作未来 milestone。

---

## 10. Agent Prompt Guide

### Example Component Prompts

- **Home hero**："Create a home hero. Outer wrapper: bg `#FFF8F0`, border `2px solid #1a1a1a`, radius 12px, shadow `4px 4px 0 #1a1a1a`, padding `24px`. Top strip (nav): logo chip bg `#FF4D6D` text white `FWTI` border `2px solid #1a1a1a` radius 8px shadow `3px 3px 0 #1a1a1a` font Archivo Black 18px; right side `测试 / 历史 / ☀` Inter 13px 700. Divider `2px dashed #1a1a1a`. Hero body: title '恋爱废物人格测试' Archivo Black + Noto Sans SC Heavy 56-72px weight 900 line-height 0.98 letter-spacing -1px; subtitle Inter 500 14px color `#52525b`, containing `<mark>` highlight with bg `#FFE08A` border `1.5px solid #1a1a1a` padding `1px 4px`. A washi tape strip absolute positioned behind title: `width: 64px; height: 16px; background: rgba(255,220,140,0.8); transform: rotate(-4deg); top: 14px; left: 18%`. CTA button primary coral + outline button secondary white, both `2px 黑边 + 4px 4px 0` 影. Below: 4×n personality tile grid, each tile bg 家族 pastel, border `2px #1a1a1a`, radius 8px, shadow `3px 3px 0 #1a1a1a`, padding 8px."

- **Quiz option (selected)**: "Full width button. bg `#FFB4B8`, border `2px solid #1a1a1a`, radius 10px, padding `10px 14px`, box-shadow `1px 1px 0 #1a1a1a`, transform `translate(2px, 2px)`. Flex row gap 10px: 24×24 letter square bg `#1a1a1a` text `#FFE08A` border `2px solid #1a1a1a` radius 6px font Archivo Black 11px, content 'B'; then option text Inter 13px weight 600 color `#1a1a1a`; then margin-left auto, a pill badge bg `#1a1a1a` color `#A8E6C9` padding `2px 8px` radius 999px JetBrains Mono 9px 900 content '+2 ZR'."

- **Result hero with portrait frame**: "Flex row gap 14px. Left: 140px portrait frame. bg `#FFB4B8`, border `2.5px solid #1a1a1a`, radius 14px, shadow `5px 5px 0 #1a1a1a`, padding 10px. Top washi tape `width 46px height 13px background rgba(255,220,140,0.9) transform rotate(-4deg)` absolute left 10px top -7px. Top-right family badge absolute -10px/-10px: 30×30 circle bg `#1a1a1a` color `#FFE08A` border `2px solid #1a1a1a` JetBrains Mono 10px 900 content 'GZ'. Inside portrait: aspect 1/1 background linear-gradient peach, border `1.5px solid #1a1a1a`, radius 8px, contains the portrait webp centered. Right column: meta line JetBrains Mono 10px color `#71717a` content 'GZNY · 废物指数 ★★★'; name Archivo Black + NSS 900 26px line-height 1.05 content '心动急先锋'; catchphrase block bg `#FFE5D4` border `2px solid #1a1a1a` radius 8px shadow `3px 3px 0 #1a1a1a` padding 10px font 12px line-height 1.5 content '君之废程，当属可救。'; chip row with 4 white chips + 1 black hidden chip (`bg #1a1a1a color #FFE08A`)."

### Iteration Guide

1. **Anchor every family-aware component to `--family-color`.** Set it via `data-family="gz|gr|dz|dr"` on the container; all downstream component styles should read `var(--family-color)` and `color-mix(in srgb, var(--family-color) 60%, white)` for softer tints.
2. **Always pair border + shadow.** `2px solid var(--fwti-ink)` never goes alone; always add `4px 4px 0 var(--shadow-ink)`. If a component feels "too light", increase shadow offset (5px, 6px), never add blur.
3. **Interaction via transform, not opacity.** Button press, option select, card hover — all move on X/Y by 1-4px and adjust shadow complementarily. Opacity changes only for disabled state.
4. **Three chip modes.** White / family-pastel / black-with-neon. Never introduce a 4th chip background.
5. **Pastel 色块内文字锁黑。** 任何 pastel 底上的字、chip、letter-square 都必须 `color: #1a1a1a`，且与主题无关。这是 dark mode 策略的基础。
6. **Decorations are grammar, not garnish.** 每屏 washi 胶带 ≤ 3 条；highlight `<mark>` ≤ 3 处；dashed divider ≤ 2 条。超过就显得杂乱。
7. **Motion**：`0.15s ease` 默认。位移 `translate(Xpx, Ypx)` + 阴影互补，永不脱钩。modal 入场保留 v1 的 spring。
8. **Typography weight 不过渡。** display = 900，body = 500-700，mono = 500-700。不要 800，不要 450。

---

## 11. Migration Checklist (from v1)

纯换皮（IA1），工程落地分以下原子改动：

- [ ] `src/global.css` 重写 `:root` tokens（color / font / shadow / radius 四组变量）
- [ ] 新增 `@font-face` / Google Fonts link：Archivo Black + JetBrains Mono + Noto Sans SC 900；可废除 Red Hat Display 引用
- [ ] 替换全局 `--fwti-border` 用法：`1px solid #e4e4e7` → `2px solid var(--fwti-ink)`
- [ ] 替换所有 resting card shadow：加 `4px 4px 0 var(--shadow-ink)`
- [ ] 引入 `--family-color` data-attr 体系（替换 v1 的 `--fwti-accent` / `--fwti-accent-tint` 双变量）
- [ ] `PersonalityIcon.tsx` / `Portrait.tsx` 包装外层 frame + washi tape + family badge
- [ ] `QuizPage.tsx` option 样式、进度条、submit bar 按 §4.4 / §4.10 / §4.9 重写
- [ ] `ResultPage.tsx` hero + 四维条 + 配对卡 + 行动按钮按 §4.3 / §4.5 / §4.6 重写
- [ ] `Nav.tsx` 去 `backdrop-filter`，改实色 + dashed border
- [ ] `PreviewModal.tsx` / `ShareImageModal.tsx` 按 §4.7 重写 shadow 层级
- [ ] `ShareImageModal.tsx` canvas 导出：重写 draw 逻辑对应新 palette + 黑边 + 位移影（`ctx.fillRect` 叠两次模拟硬影）
- [ ] dark mode `[data-theme="dark"]` block：只改 `--fwti-bg` / `--fwti-bg-soft` / `--fwti-ink` / `--shadow-ink`；卡内部 token 不翻
- [ ] 保留：路由、`logic/*`、`data/*`、portrait webp 文件、codec、scoring、answers state、telemetry

不在本次 scope：quiz 单题分屏、result 滑动叙事、portrait 重绘、zine 信息架构。这些作未来 v3 保留。
