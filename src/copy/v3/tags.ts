/**
 * FWTI v3 · 可叠加 hidden tags（10 枚）
 *
 * 结构沿用 v2 `HiddenTitle`（id / name / description），仅内容重写为 2024-2025 热梗。
 * 触发条件实现见 `src/logic/v3/predicates.ts::hiddenTagTriggersV3`。
 *
 * 设计原则：
 *   - 每 tag 触发条件只绑定 v3 题（id 1-32），不耦合历史题。
 *   - tag 可叠加 · 互不互斥 · UI 按顺序渲染徽章。
 *   - 不改结果主 code；只作为"隐藏成就"展示。
 */

import type { HiddenTitle } from '../personalities';

export const hiddenTitlesV3: Record<string, HiddenTitle> = {
  cyberReconciler: {
    id: 'cyberReconciler',
    name: '赛博对账王',
    description:
      '对账精神附体——时间线、点赞记录、异性名单、朋友圈分组，你一项都不放过。2025 年度热词本人。',
  },
  overDense: {
    id: 'overDense',
    name: '浓度超标',
    description:
      '活人感过剩，情绪一点就着；ta 一句话能让你连续输出三十条，中间不带喘气。浓人文学代表作。',
  },
  flipFlopper: {
    id: 'flipFlopper',
    name: '反复横跳选手',
    description:
      '答题过程至少改了三次——A 换 C、C 又跳 B，连自我剖析都在左右逢源。生活哲学叫"退退退"。',
  },
  tooDilute: {
    id: 'tooDilute',
    name: '淡到隐形',
    description:
      '恋爱浓度稀释到背景板，ta 问"你在吗"你真的在——但不说话。淡人代表作，2024-25 长红。',
  },
  humanATM: {
    id: 'humanATM',
    name: '电子 ATM',
    description:
      '地点你定、道歉你先说、消息你先发、礼物你买单——你承担了关系里几乎全部的"主动成本"。打工都没你这么卷。',
  },
  soBeIt: {
    id: 'soBeIt',
    name: '如何呢又能怎型',
    description:
      '任何事都能一句"如何呢又能怎"带过——异地 ok、前任合照 ok、出轨大概也 ok。2025 年度十大流行语榜上有名。',
  },
  momentsPerformer: {
    id: 'momentsPerformer',
    name: '朋友圈表演艺术家',
    description:
      '朋友圈精装修十级，现实生活比朋友圈平淡十倍。ta 一有动态你秒 DM，评论区永远你先动手。',
  },
  mouthStubborn: {
    id: 'mouthStubborn',
    name: '嘴硬王者',
    description:
      '"没事"说八遍，脸已经结冰。心里账本摞得比税务局还整齐，只等某个深夜总清算。',
  },
  virginMonument: {
    id: 'virginMonument',
    name: '母胎 solo 纪念碑',
    description:
      '单身不是一种状态，是一种修行——而你已闭关多年。每天给自己敬一杯（2025 热词"敬自己一杯"）。',
  },
  yearBurnout: {
    id: 'yearBurnout',
    name: '年度内耗选手',
    description:
      'ta 一条消息你能解读七层，每层都通向"ta 是不是不喜欢我了"。CPU 24 小时不下班，年度内耗之王。',
  },
};

export type { HiddenTitle } from '../personalities';
