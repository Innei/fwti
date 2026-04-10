# FWTI 题目分支重构设计（v0.4）

- Status: Draft
- Author: brainstorming session, 2026-04-10
- Supersedes: v0.3 题目结构（33 题 + 彩蛋三题 + META wording-only variants）
- Related: `DRAFT.md`、`PROMPT.md`、`CLAUDE.md`

## 0 · 背景与动机

现版（v0.3）FWTI 痛点：

1. **META 前置题仅换措辞**。四状态（dating / ambiguous / crush / solo）下题目集合与评分完全一致，单身与恋爱中跑同一套题，切身感不足。
2. **主干线性，无题内分支**。某题选出极端答案后，后续题不会随之深化，刻画不锐利。
3. **全题 3 选项**。程度类题（聊天频率、出差反应、翻 TA 记录）靠 3 档难以表达强弱分明。

本设计在**不改 16 + 8 人格名、文案、portraits** 的前提下，重构题库结构、作答流与评分归一化，并引入：

- 共享主干精简 + 四状态专属扩展题
- 选项触发 follow-up 子题
- 3 / 5 档混合制
- Codec v2（携带 status）+ v1 旧链 legacy fallback
- 语义谓词层隔离隐藏 trigger 与具体题 id
- 新增 2 个隐藏人格：`GHOST · 电子断联户`（solo only）、`LIMBO · 意难平学家`（crush only）

关键决策已于 brainstorming 阶段逐一核准，核准记录见文末附录 A。

---

## 1 · 数据模型

### 1.1 · 目标

- 主干（trunk）精简至 ~20 共享维度题 + 1 共享彩蛋（Q31 撤回大师），去状态语境，问原则与倾向；META 前置题 1 条独立于 trunk 列表之外（见 §1.3）
- 四状态各 7–10 题专属扩展题（切身场景，不共用）
- 特定主题选项解锁 1–5 条 follow-up，计入对应维度
- 程度类题用 5 档 Likert（±2/±1/0），情境角色化题仍 3 档，评分自适应
- 实际作答总数 32–40 题，视状态与路径而动

### 1.2 · 类型定义（`src/data/questions.ts` 重构）

```ts
type Scale = 3 | 5
type StatusKey = 'dating' | 'ambiguous' | 'crush' | 'solo'

interface Option {
  label: string          // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string
  score: number          // ±2 / ±1 / 0；评分按 scale 归一（见 §4）
  hidden?: number        // 彩蛋纠结值
  meta?: StatusKey       // 仅 META 题使用
}

interface Question {
  id: number             // 全局唯一，append-only
  dimension: 'GD' | 'ZR' | 'NL' | 'YF' | 'META'
  scale: Scale           // 3 或 5
  tag?: '前置' | '彩蛋' | '补充题'
  text: string
  options: Option[]      // length === scale
  variants?: Partial<Record<StatusKey, {
    text?: string
    options?: (string | null)[]
  }>>
}

export const trunk: Question[]
export const extensions: Record<StatusKey, Question[]>
export const followups: Record<number, Record<number, Question[]>>
export const questionIndex: Record<number, Question>   // id → Q 快表（派生）
export const questionIds: readonly number[]             // 编码顺序（§3）
```

### 1.3 · 设计要点

- 每题有全局稳定 `id`；所有出现位置（trunk / extension / followup）统一进 `questionIndex`；scoring / codec 只认 id
- follow-up 子题亦有独立 id，可再嵌 follow-up，递归深度硬上限 2
- META 题（`id = 32`）特殊：不在 trunk 列表，独立呈现并决定 `extensions` 取哪一路
- 旧 `questions[]` 扁平数组仍以 getter 导出：
  `export const questions = [metaQ, ...trunk, ...allExtensions, ...allFollowups]`
  便于 scoring / codec 迭代与旧消费者不破
- `variants` 仍保留，用于主干题中"恋爱语义不同但题目共用"的细调（例如 crush 下把"对象"换成"心里那位"）

---

## 2 · Flow engine 与作答顺序

### 2.1 · 职责

给定 `answers + status`，产出**下一题**或**全路径快照**；驱动 UI 作答流与进度条。

### 2.2 · 模块（`src/logic/flow.ts`，新建）

```ts
interface FlowStep {
  question: Question
  index: number       // 1-based 已显示题序
  total: number       // 当前路径下预估总题数（动态）
}

export function buildQuestionPath(
  answers: Record<number, number>,
  status: RelationshipStatus,
): Question[]

export function nextQuestion(
  answers: Record<number, number>,
): FlowStep | null    // null = 全答完
```

### 2.3 · `buildQuestionPath` 算法

1. META 未答 → `[metaQ]`
2. 读 META → `status`
3. 基序列：`[metaQ, ...trunk, ...extensions[status]]`
4. 遍历基序列，每题就位后查 `followups[q.id]?.[answers[q.id]]`；若命中，插入 follow-up 子题至该题之后
5. 递归深度 2 上限
6. 返回线性 `Question[]`

### 2.4 · 关键性质

- **可动态重算**：用户改答已答题，后续路径随之重建，UI 只需重读 index
- **进度条**：`total` 为"当前可见路径长度"，会随 follow-up 解锁增减；UI 显示"已答 Y / 当前路径约 Z"
- **路径重算不清答**：只有 META 变更才 wipe（与现 `applyAnswerSelection` 一致）
- **失效 follow-up**：若父题答案改变导致 follow-up 撤除，其子题答案保留在 `answers` 中但不在路径内；scoring 按路径迭代或显式过滤不可达 id

### 2.5 · UI 接入（`src/App.tsx` `QuizPage`）

- 现：`questions[currentIdx]` 线性取题
- 改：`path = buildQuestionPath(answers, status); q = path[currentIdx]`
- `mainQ` 概念不再固定，改为 `path.length - 1`（减 META）
- 每次作答后：`applyAnswerSelection` → 重算 path → `currentIdx = min(path.length - 1, currentIdx + 1)`

---

## 3 · Codec v2 与 legacy 兼容

### 3.1 · 问题

v1 定长 34 字符 base64url payload 假设"所有题必在同一顺序上被遍历"；新设计下作答题集随 status / 选项动态变，需版本化。

### 3.2 · v2 格式

```
v2.<status>.<base64url(payload)>
```

- `status ∈ {d, a, c, s}` 单字符映射 dating / ambiguous / crush / solo
- `payload`：按**全局 `questionIds` 升序**遍历，每题一字符：
  - `'-'` 未答或不在当前路径
  - `'0'..'9'` 已答选项索引（5 档 Likert 取 0..4）
- `btoa` → base64url（`+` → `-`，`/` → `_`，去 `=`）

### 3.3 · `questionIds` 规则

- Append-only 不变：trunk / extensions / followups 所有题 id 统一入列表，升序
- 新题必取未用过之 id，绝不插入中段
- META 题 id 固定 32
- 彩蛋题 id（31 / 33 / 34）保留占位，trigger 在 §5 重写

### 3.4 · API（`src/logic/codec.ts` 扩展）

```ts
export function encodeAnswersV2(
  answers: Record<number, number>,
  status: RelationshipStatus,
  ids: readonly number[],
): string

export function decodeAnswers(
  encoded: string,
  ids: readonly number[],
):
  | { version: 2; answers: Record<number, number>; status: RelationshipStatus }
  | { version: 1; answers: Record<number, number>; status: null }
  | null
```

- 新链以 `v2.` 前缀识别
- 无前缀 → 走 v1 legacy 解码器（34 位 base64url，每位 0..3）→ 返回 `version: 1`

### 3.5 · Legacy 处理（`ResultPage`）

- `version === 1`：
  - 用 v1 `answers` 直接喂 `src/logic/legacy/scoring-v1.ts::getResult`
  - 结果页顶部显示"此为旧版测试结果（v0.3）"徽章 + "点此重测新版"按钮
  - v1 scoring 与 v1 题库快照分别封存在 `src/logic/legacy/` 和 `src/data/legacy/`
  - legacy 模块**永不与新代码共享任何可变依赖**，冻结后不再维护
- `version === 2`：喂新版 `getResult`，走 §4 评分与 §5 隐藏层

### 3.6 · 向前兼容

- v2 hash 内隐式嵌 `status`
- 新增题目 → `questionIds` 追加 → 老 v2 hash `payload.length < ids.length`，解码器右补 `'-'`；老链结果不变
- 删改题目 id → 禁止；如必须，需 v3 迁移

### 3.7 · 风险

- URL 长度：每题一字符，~40 题 → base64 后 ~56 字节 + `v2.X.` 前缀，仍远低于 URL 限制
- legacy 模块维护负担随时间累积：策略上接受"v1 结果页永远呈现 v0.3 语义"，不回写新规则

---

## 4 · 评分归一化

### 4.1 · 问题

混合 3/5 档 + 可变题量导致原始求和不再跨状态可比；旧 `TOP_THRESHOLD` 绝对值失准。

### 4.2 · 策略

维度得分以**比率**（`−1..+1`）表示：

- 每题贡献 = `option.score / 2`（max=2 恒定）
  - `scale=3` → 贡献 ∈ {−1, 0, +1}
  - `scale=5` → 贡献 ∈ {−1, −0.5, 0, +0.5, +1}
- 维度比率 = Σ贡献 / 该维度参与题数；范围 `[−1, +1]`

### 4.3 · 新 `Scores` 结构

```ts
interface Scores {
  GD: number                       // ratio ∈ [-1, 1]
  ZR: number
  NL: number
  YF: number
  rawGD: number; nGD: number       // 原始累加 + 题数，审计用
  rawZR: number; nZR: number
  rawNL: number; nNL: number
  rawYF: number; nYF: number
  hidden: number                   // 彩蛋纠结值（独立通道，保留旧语义）
}
```

### 4.4 · 16 格判定（`getResult` 重写）

- 每维取符号：
  - `GD > 0 → G`，`< 0 → D`，`=== 0 → D`（延续现"默认废方向"不对称惯例）
  - `ZR`：`> 0 → Z`，`<= 0 → R`
  - `NL`：`> 0 → N`，`<= 0 → L`
  - `YF`：`> 0 → Y`，`<= 0 → F`
- ≥ 2 维严格为 0 → `ALL`
- 单维为 0 → 硬分默认废方向，`tiedDimensions` 仍记录（保留 `closestCode` / `displayCode` 兼容字段）

### 4.5 · 隐藏人格阈

统一比率阈：

- 至顶：`|ratio| ≥ 0.80`
- 强：`≥ 0.60`
- 倾向：`≥ 0.30`

各人格触发条件改写为比率布尔（示例）：

- `MAD: ratio.ZR >= 0.80 && ratio.YF >= 0.60`
- `RAT: ratio.GD <= -0.80 && ratio.YF >= 0.60`
- 完整矩阵见 §5.2

### 4.6 · 最小题数保底

- 每状态下每维至少 5 题（trunk + extension 合计）
- 新增 `assertCoverage()`：dev 模式遍历四状态 × 四维度检查 ≥ 5，失败 throw

### 4.7 · `dimensionLabels`

进度条改以 `ratio * 100%` 显示左右倾向，不再用 `DIM_MAX`。

### 4.8 · 风险

低题量维度下比率方差大，易误落 ALL。缓解：§6.2 维度均衡 + 上线后监测 ALL 解锁率，必要时收紧阈值。

Legacy v1 评分逻辑**不受本节影响**：走快照，独立存在。

---

## 5 · 隐藏层：trigger 重编与新人格槽

### 5.1 · 约束与目标

- 现 16 主人格 + 8 隐藏人格 + 10 叠加标签的**名字、文案、portraits 全冻结**，仅动 trigger
- 允许新增 1–2 个隐藏人格（须新 portrait，走 `PROMPT.md` `--sref` 流程）

### 5.2 · 语义谓词层

旧 trigger 有两类硬编码：

- **维度绝对值**（`scores.ZR >= 12`）→ 换为比率（§4.5）
- **具体 id × 选项索引**（`answers[26] === 0 && answers[27] === 0`）→ 新题结构下 id 与 scale 皆变动

**新设施**：

```ts
// src/logic/predicates.ts（新建）
interface AnswerLens {
  ratio: Record<'GD' | 'ZR' | 'NL' | 'YF', number>
  optOf(id: number): number | undefined
  polarityOf(id: number): -1 | 0 | 1 | undefined
  status: RelationshipStatus
  retreatCount: number
  hiddenCount: number
}

export const hiddenPersonalityTriggers: Record<HiddenCode, (a: AnswerLens) => boolean>
export const hiddenTagTriggers: Record<HiddenTagCode, (a: AnswerLens) => boolean>
```

`polarityOf` 语义：3 档 A/B/C → 1/0/-1；5 档 0..4 → sign(贡献) → -1/0/1。Trigger 只读语义，不触 index。

```ts
// src/logic/semanticIds.ts（新建）
// 改题库时**仅此一处**同步；triggers 文件只读常量
export const SEMANTIC = {
  JEALOUSY_EX_STALK: /* id */,    // 翻 TA 朋友圈 / 聊天记录考古
  CLING_INTRUSION: /* id */,      // "带我一起玩"
  MONEY_ATM: /* id */,            // 经济型 ATM 彩蛋
  EMO_2AM_RESPONDER: /* id */,    // 情绪客服 ATM 彩蛋
  REVOKE_RETRY: /* id */,         // 撤回大师彩蛋
  IMAGINE_NOT_LOVED: /* id */,    // 脑补不爱我
  // ... 约 15–20 个锚，具体 id 在题目定稿后敲定
} as const
```

### 5.3 · 旧 trigger → 新 trigger 映射（示意）

| 隐藏人格 / 标签 | v1 trigger | v2 trigger |
|---|---|---|
| `MAD` | `scores.ZR >= 12 && scores.YF >= 10` | `ratio.ZR >= 0.80 && ratio.YF >= 0.60` |
| `RAT` | `scores.GD <= -12 && scores.YF >= 10` | `ratio.GD <= -0.80 && ratio.YF >= 0.60` |
| `PURE` | `scores.GD >= 10 && scores.YF <= -10` | `ratio.GD >= 0.60 && ratio.YF <= -0.60` |
| `CPU` | 多维 tied + 中立占比 ≥ 60% | 同义重写，以 ratio + neutral 占比 |
| `CHAOS` | 现规则 | 比率等价重写 |
| `E-DOG` | 现规则 | 同上 |
| `BENCH` | 现规则 | 同上 |
| `电子乙方`（叠加） | `q33 == A && q34 == A` | `polarityOf(SEMANTIC.MONEY_ATM) > 0 && polarityOf(SEMANTIC.EMO_2AM_RESPONDER) > 0` |
| `薛定谔的前任`（叠加） | `status === crush && q26 == A && q29 == A` | `status === 'crush' && polarityOf(SEMANTIC.JEALOUSY_EX_STALK) > 0 && polarityOf(SEMANTIC.IMAGINE_NOT_LOVED) > 0` |
| `空想家`（叠加） | `status === solo && ...` | 同模式重写 |
| `撤回大师`（叠加） | `hiddenCount >= N` | 不变（纠结值通道保持） |
| `退退退`（叠加） | `retreatCount >= N` | 不变（session-only 计数保持） |

完整矩阵 10 叠加标签 × 8 主隐藏 + 2 新隐藏在实施阶段敲 `src/logic/triggers.ts`，每条 trigger 在文件注释中引 DRAFT.md 对应段落。

### 5.4 · 新增隐藏人格

名字 / 文案最终稿在主干与扩展题敲定后回写 `DRAFT.md`，实施阶段不自行命名。提名槽位：

**`GHOST · 电子断联户`**（仅 `solo` 可解）

- 语义："已读不回是生活方式，上线即社死"
- 触发草案：`status === 'solo' && ratio.GD <= -0.80 && ratio.NL <= -0.60`
- portrait 须新画，走 `PROMPT.md` `--sref` 一致性流程

**`LIMBO · 意难平学家`**（仅 `crush` 可解）

- 语义："查岗已成考古学研究，博士后在读"
- 与"薛定谔的前任"叠加标签共存但不同格：前者为 tag，后者为主隐藏人格
- 触发草案：`status === 'crush' && ratio.YF >= 0.80 && ratio.NL >= 0.30 && polarityOf(SEMANTIC.JEALOUSY_EX_STALK) > 0`
- portrait 须新画

### 5.5 · 判定顺序

插入原序列尾部（ALL 兜底之前）：

```
MAD → RAT → PURE → CPU → CHAOS → E-DOG → BENCH → GHOST → LIMBO → ALL
```

GHOST / LIMBO 有 status 门禁，不会与老玩家现有结果冲突。

### 5.6 · 叠加标签

10 个叠加标签同法改写，原 status 门禁（薛定谔的前任仅 crush、空想家仅 solo 等）保留。实施阶段逐条列全矩阵。

### 5.7 · 彩蛋题存续与归属

- **Q31（撤回大师）**：留在 trunk 段内，四状态共享；题干重写适配新语境，`hidden` 纠结值通道不变
- **Q33（经济型 ATM）**：移入 `extensions.dating`（"基本都是我买单"在已确认关系里语义最锐利）；每题 id 全局唯一，不在其他 extension 中重复出现
- **Q34（情绪客服型 ATM）**：移入 `extensions.crush`（crush 态"情感单向输出"语义最吻合），同理不重复
- ambiguous / solo 路径下 ATM 语义由各自的扩展题以近似题目承载（非同 id）
- **新增 Q35（电子断联触发器）**：仅出现在 `extensions.solo`，作为 GHOST 的直接证据题；选项指向"多久没主动加异性 + 是否对已读不回感到轻松"

---

## 6 · 主干精简与题目迁移计划

本节定**方针与配额**，具体题文在实施阶段产出。

### 6.1 · 主干精简方针（trunk 20 维度题 + META 1 + 共用彩蛋 1）

**去语境化原则**：主干题必须四状态通用，不提"对象 / TA"时仍成立；若题干离"你此刻是否在恋爱"才能答，归入 `extensions`。

**每状态皆会遇到的共享段**总量（META + trunk + 共用彩蛋）：

| 段 | v0.3 | v0.4 | 差 | 去向 |
|---|---|---|---|---|
| META 前置（独立，不入 trunk） | 1 | 1 | 0 | — |
| GD 维度题（trunk） | 8 | 5 | −3 | 3 题移 extensions 或删 |
| ZR 维度题（trunk） | 7 | 5 | −2 | 2 题移 extensions 或删 |
| NL 维度题（trunk） | 8 | 5 | −3 | 3 题移 extensions 或删 |
| YF 维度题（trunk） | 7 | 5 | −2 | 2 题移 extensions 或删 |
| **trunk 维度小计** | **30** | **20** | **−10** | |
| 共用彩蛋 Q31（撤回大师，trunk 内） | 1 | 1 | 0 | 题干重写适配新语境 |
| ATM 彩蛋 Q33 / Q34 | 2 | 2 | 0 | 移入 extensions：Q33 → dating、Q34 → crush |
| 新彩蛋 Q35（GHOST 证据题） | 0 | 1 | +1 | 仅 solo extension |
| **v0.4 每次必遇题数（META + trunk + Q31）** | — | **22** | | |

**淘汰标准**（从现 30 题维度题中砍 ~10 题）：

- 已有 `variants` 大改写才能跨状态成立 → 移 extensions 或删
- 与同维度他题语义冗余 → 合并或删
- 角色化 3 选项段子弱 → 改 5 档 Likert 或删

**改档建议**（现 3 档 → 5 档候选）：

- Q5「2 小时没回消息」（程度题）
- Q16「理想聊天频率」（程度题）
- Q20「出差一周」（程度题）
- Q23「恋爱状态偏好」（程度题）
- Q26「翻 TA 聊天记录」（程度题）
- Q29「脑补不爱我」（程度题）

**保留 3 档**：情境角色化题，三选皆为鲜明角色 / 段子不可压（如 Q3 冷战、Q10 吵架、Q12 受委屈、Q14 分手场景、Q28 "我有个事想跟你说"）。

### 6.2 · 状态扩展题（extensions）

每状态 7–10 题，四状态合计约 ~32 题新增。

**dating（已有对象）**，分布约 GD×2 · ZR×2 · NL×2 · YF×2：

- 切身题例：同居、过节、见家长、公开恋情、共同财务、吵架后谁先低头、删前任这件事
- 彩蛋可并入 Q33（ATM 经济型），仅 dating / ambiguous 路径出现

**ambiguous（暧昧中）**，分布约 GD×3 · ZR×2 · NL×2 · YF×2：

- 切身题例：称呼模糊期、谁先确定关系、朋友圈点赞试探、双方是否同时暧昧他人
- 专注"推拉""焦灼"语义，天然强 follow-up 源

**crush（心里藏着谁 / 念念不忘）**，分布约 GD×1 · ZR×2 · NL×2 · YF×3（YF 加权，匹配 LIMBO 触发）：

- 切身题例：社交媒体查岗频率、对方是否知情、与新对象比较、梦到 TA 的次数
- Q34（情绪客服 ATM）可作此路径彩蛋

**solo（纯单身）**，分布约 GD×3 · ZR×1 · NL×2 · YF×2（GD 加权，匹配 GHOST 触发）：

- 切身题例：多久没主动加异性、交友软件活跃度、朋友催婚反应、相亲心态、独处满足度、幻想恋爱频率
- 新彩蛋 Q35 置此路径用于 GHOST 证据

### 6.3 · Follow-up 块（~10–15 题总量，每路径触达 1–5）

**触发者候选**：

- 冷战态度题选"冷到地球毁灭" → follow-up「那若 TA 彻底不找你呢？」
- 聊天频率题选"从早安到晚安" → follow-up「若 TA 回得慢，你几分钟受不了？」
- 朋友圈查岗题选"翻过正在翻" → follow-up「翻到不认识的女生 / 男生怎么办？」
- ATM 经济型选 A → follow-up「一月花 TA 多少你觉得亏？」
- 脑补不爱我题选"经常" → follow-up「你会据此直接对质吗？」

**分布策略**：follow-up 不追求维度均衡，只为"深化该选项的锋利度"。每个 follow-up 计入其父题维度。

### 6.4 · 作答总量核算

| 段 | 题数 | 备注 |
|---|---|---|
| META 前置 | 1 | 固定，独立于 trunk |
| trunk 维度题 | 20 | 去语境，四状态共享 |
| 共用彩蛋 Q31（撤回大师） | 1 | 在 trunk 段内，计入路径 |
| extension[status] | 7–10 | 按状态取一份（含该状态专属彩蛋 0–1 题） |
| followup | 1–5 | 动态，按选项触发 |
| **实际作答（per path）** | **30–37** | 命中 "中" 档 |

### 6.5 · 迁移工程序

1. `DRAFT.md` 先改：新主干题表、四状态扩展题表、follow-up 表、新 GHOST / LIMBO 人格文案、隐藏 trigger 矩阵表
2. 冻结 v1：`src/data/legacy/questions-v1.ts`（现文件快照）+ `src/logic/legacy/scoring-v1.ts`（现 scoring 快照）
3. `src/data/questions.ts` 按 §1 重写；所有新题 id 从 35 起递增
4. 新建 `src/logic/semanticIds.ts` + `src/logic/predicates.ts`
5. `src/logic/scoring.ts` 按 §4 改 ratio；triggers 按 §5.3 映射重写
6. 新建 `src/logic/flow.ts`，`src/App.tsx` `QuizPage` 接入
7. `src/logic/codec.ts` 加 `encodeAnswersV2` + `decodeAnswers` 版本分流；`ResultPage` 按 version 走新或 legacy
8. portraits：新 GHOST / LIMBO 两张，走 `PROMPT.md` `--sref` 流程
9. DRAFT ↔ code 交叉复核

**分两批交付建议**：

- 第一批：主干精简 + dating / solo 扩展 + codec v2 + legacy fallback + ratio scoring
- 第二批：ambiguous / crush 扩展 + follow-up + GHOST / LIMBO + 对应 portrait

### 6.6 · 明确不做

- 不改现 16 + 8 主人格文案与名字
- 不改现 portraits 除新加 2 张外
- 不改 `vercel.json` rewrite 与 SSG 流程
- 不加多语言 / i18n
- 不做题目随机顺序（保持作者编排，可控节奏）
- 不做题目 A/B 分流、云端统计、telemetry、题目编辑后台

---

## 7 · 错误处理、验证、测试、回滚

### 7.1 · 运行时错误处理

**Codec 解码失败**：

- `decodeAnswers` 返回 `null` → `ResultPage` 回退 `navigate('/')`
- v2 前缀格式不合（`v2.X.` 的 X 非 `d/a/c/s`）→ 当作 null
- v2 payload 解出后 `answers[32]` 与 URL 内 `status` 不一致 → 以 URL 内 `status` 为准（payload 权威），记 dev console warn

**Flow engine 异常**：

- follow-up 引用的 `parentId` 不存在 → dev throw，prod 忽略该 follow-up 组
- follow-up 递归深度超 2 → dev throw，prod 截断
- `extensions[status]` 缺失（脏 status）→ 视作 solo 兜底

**Scoring 异常**：

- 某维度题数为 0（路径未经该维度） → `ratio = 0`，不抛；记 dev warn
- `assertCoverage()` 仅在 `import.meta.env.DEV` 下跑

**Legacy 降级**：

- v1 链解码成功但新题库无旧题 id → 正常，legacy scoring 只认快照
- legacy 快照文件被误删 → 构建期 throw，不让坏包上线

### 7.2 · 编辑期验证（dev 断言）

`questions.ts` export 末尾跑不变式检查：

```ts
function assertInvariants() {
  // 1. 所有 id 全局唯一，升序即 questionIds
  // 2. 每题 options.length === scale
  // 3. scale ∈ {3, 5}；score ∈ {-2, -1, 0, 1, 2}
  // 4. follow-up 的 parentId 在 trunk ∪ extensions ∪ followups 之内
  // 5. follow-up 递归深度 ≤ 2
  // 6. 四状态 × 四维度 覆盖率 ≥ 5 题
  // 7. semanticIds.ts 所有锚 id 均存在于题库
  // 8. META 题 id 必为 32，不计维度
}
if (import.meta.env.DEV) assertInvariants()
```

任一失败 → console error + throw，dev 页面立即显警告，不让坏题库编进 prod 包。

### 7.3 · 手工验证清单（验收步骤）

每次改题后至少跑一遍：

1. `pnpm dev`，四状态路径各走一遍到底：
   - 题目顺序合理、variants 文案匹配状态
   - follow-up 触发时序正确（在父题之后立即出现）
   - 进度条 `已答 / 当前路径总数` 无跳变
2. 每路径终局看结果页：
   - 16 格人格、隐藏人格、叠加标签判定与 DRAFT 对齐
   - GHOST 仅 solo 解、LIMBO 仅 crush 解，验门禁
3. 分享链接往返：
   - 当前结果 → 复制链接 → 新隐身窗打开 → 结果一致
   - 旧 v1 样链（存几条经典）→ 打开 → 走 legacy 路径 → 显"旧版"徽章 + 重测按钮
4. 改答回跳：
   - 作答到中段，回退 3 题改答，观察 follow-up 解锁 / 撤除是否平滑
   - 改 META 答案 → 确认全答案清除并回首题
5. `pnpm build` 通过（TS strict + Vite SSG）

### 7.4 · 自动化测试（可选增强）

项目无 test runner。方针：**不引入新依赖**。

可选新增 `scripts/verify-triggers.ts`（纯 node + tsx），遍历"代表性答案组合"：

- 每隐藏人格构造至少 1 条命中序列、1 条擦边不命中序列
- 调 scoring 验输出；失败 exit 非 0
- `package.json` 加 `"verify": "tsx scripts/verify-triggers.ts"`

若不做，完全依赖 §7.3 手工清单。

### 7.5 · 回滚策略

- 新旧代码并存：legacy 快照在 `src/data/legacy/` 与 `src/logic/legacy/`，永不删
- 发布后严重 bug → `vercel.json` 无需改，git revert 上一 commit 即可；旧 v1 链本就走 legacy，无影响
- GHOST / LIMBO portrait 若来不及画 → 走开关 `ENABLE_NEW_HIDDEN`：trigger 函数在开关关闭时 `return false`，人格文案待 portrait 完工后解开

### 7.6 · 风险清单

- **作者工作量**：§6 约 ~32 道新扩展题 + ~15 道 follow-up + ~10 道主干改写 ≈ **50+ 条新题文案**，且需符合 FWTI "自嘲 > 攻击" 的 voice。最大时间成本项，建议分两批交付（见 §6.5）
- **比率评分稳定性**：低题量维度方差大，易落 ALL。缓解：§6.2 维度均衡 + 上线后监测 ALL 解锁率，必要时收紧 §4 阈值
- **Portrait 拖延**：§7.5 开关兜底
- **Legacy 代码腐烂**：v1 快照长期无人维护；策略是一次冻结、彻底隔离、不共享可变模块

---

## 附录 A · Brainstorming 核准记录

本设计七项关键决策由 brainstorming session 逐一核准（2026-04-10）：

1. **分享链接兼容**：v2 hash 前缀 + v1 legacy fallback（选项 B）
2. **META 分支粒度**：共享主干精简 + 四状态专属扩展题（选项 A）
3. **主干内分支机制**：follow-up 解锁题（选项 A）
4. **选项粒度**：3/5 档混合制，评分函数自适应（选项 B）
5. **测试长度**：实际作答 32–40 题（选项 B，"中"档）
6. **隐藏层策略**：trigger 重编 + 允许新增 1–2 个隐藏人格（须新 portrait）（选项 B-全）
7. **数据模型架构**：结构化块（trunk / extensions / followups，途二），由 AI 决定

核准后 §1–§7 各节亦逐节过目允可。

---

## 附录 B · 受影响文件清单

**新建**：

- `src/logic/flow.ts`
- `src/logic/predicates.ts`
- `src/logic/semanticIds.ts`
- `src/logic/triggers.ts`（可选拆分自 scoring.ts）
- `src/data/legacy/questions-v1.ts`（v0.3 题库快照）
- `src/logic/legacy/scoring-v1.ts`（v0.3 scoring 快照）
- `src/assets/portraits/GHOST.webp`（待画）
- `src/assets/portraits/LIMBO.webp`（待画）
- `scripts/verify-triggers.ts`（可选）
- `docs/superpowers/specs/2026-04-10-quiz-branching-redesign-design.md`（此文档）

**重写**：

- `src/data/questions.ts`（trunk / extensions / followups 三段导出）
- `src/logic/scoring.ts`（ratio + 新 triggers 接入）
- `src/logic/codec.ts`（v2 编解码 + version 分流）
- `src/App.tsx` `QuizPage`（接入 flow.ts）
- `DRAFT.md`（主干题表、扩展题表、follow-up 表、GHOST / LIMBO 文案、trigger 矩阵表）
- `PROMPT.md`（GHOST / LIMBO 的 subject prompt + 颜色）

**不动**：

- `src/data/personalities.ts`（除为 GHOST / LIMBO 追加新条目外）
- 16 + 现 8 隐藏人格文案与 portraits
- `vercel.json`、`pages/` 路由结构、SSG 配置
