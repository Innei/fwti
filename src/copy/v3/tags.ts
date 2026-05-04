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
      '时间线要核对、点赞记录要审查、异性好友名单要备案、朋友圈分组要逐一比对——你查岗的认真程度税务局看了都沉默。建议下次直接拉个 Excel。',
  },
  overDense: {
    id: 'overDense',
    name: '浓度超标',
    description:
      '活人感满到溢出屏幕——ta 一句话你能连回三十条不带喘气，情绪浓到对方还没消化完上一条你下一条已经来了。浓人文学指定代言人就是你。',
  },
  flipFlopper: {
    id: 'flipFlopper',
    name: '反复横跳选手',
    description:
      '答个题你都能改三次答案——A 换 C、C 又跳 B，连自我剖析都在左右横跳。别人走直线你走贪吃蛇，生活哲学叫"退退退"。',
  },
  tooDilute: {
    id: 'tooDilute',
    name: '淡到隐形',
    description:
      '你在关系里的存在感约等于微信步数——知道你在但感觉不到。ta 问"你在吗"你确实在，但不说话。2024 年度淡人金奖得主。',
  },
  humanATM: {
    id: 'humanATM',
    name: '赛博血包',
    description:
      '地点你定、道歉你认、消息你发、礼物你买——你把恋爱当全职工作，职位是"24 小时情绪+经济综合客服"。打工人都没你卷，关键还没工资。',
  },
  soBeIt: {
    id: 'soBeIt',
    name: '如何呢又能怎型',
    description:
      '你的人生格言就四个字——「如何呢又能怎」。异地？没事。前任合照？留着吧。出轨？哦。（然后继续吃饭。）心态好到让所有人怀疑你是不是根本没在爱。',
  },
  momentsPerformer: {
    id: 'momentsPerformer',
    name: '朋友圈精装大师',
    description:
      '朋友圈是精装修样板间，现实生活是毛胚房。每一条朋友圈都是你的微电影作品，但片场之外——冷场、沉默、已读不回。朋友圈 VVIP，现实生活游客。',
  },
  mouthStubborn: {
    id: 'mouthStubborn',
    name: '嘴硬王者',
    description:
      '"没事"说第八遍的时候连你自己都不信了。脸已经结冰，空气已经凝固，但嘴巴纹丝不动——问就是"没生气"。等一个深夜，所有旧账一次性清算。',
  },
  virginMonument: {
    id: 'virginMonument',
    name: '母单纪念碑',
    description:
      '单身不是状态，是修行——而你闭关多年修为高深。每年情人节给自己敬一杯，祭的不是爱情是自由。铜墙铁壁的独行侠，自给自足的模范选手。',
  },
  yearBurnout: {
    id: 'yearBurnout',
    name: '年度内耗冠军',
    description:
      'ta 发一个句号你要解读七层含义，层层都通向「他是不是不喜欢我了」。大脑 CPU 全年无休 24 小时运转，功耗拉满但生产率为零。年度精神内耗 MVP 非你莫属。',
  },
};

export type { HiddenTitle } from '../personalities';
