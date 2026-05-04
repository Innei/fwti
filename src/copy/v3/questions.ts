/**
 * FWTI v3 · 题库（纯白话 + 2024-2025 网络梗）
 *
 * 结构：
 *   - metaQuestionV3（id=0）：前置题，决定 status。
 *   - questionsV3：32 道主干，每维 8 题，每维内 A 选项极性 4+/4-（第 A 位 4 次 +2，4 次 -2）。
 *   - questionIdsV3：codec 编码顺序（与 questionsV3.map(q=>q.id) 等价）。
 *
 * 分布：
 *   C 接触  · ids 1-8   · A=+2 次序 [1,3,5,7] / A=-2 次序 [2,4,6,8]
 *   R 调节  · ids 9-16  · A=+2 次序 [9,11,13,15] / A=-2 次序 [10,12,14,16]
 *   A 黏附  · ids 17-24 · A=+2 次序 [17,19,21,23] / A=-2 次序 [18,20,22,24]
 *   S 安全  · ids 25-32 · A=+2 次序 [25,27,29,31] / A=-2 次序 [26,28,30,32]
 *
 * 档次：
 *   - 3 档：A=±2 / B=0 / C=∓2（视 A 方向镜像C）
 *   - 5 档（Q5/Q13/Q21/Q29，每维一点彩蛋题）：A=+2 / B=+1 / C=0 / D=-1 / E=-2
 *
 * 选项 tag：
 *   - 'rat'  · RAT 鼠鼠恋人 自贬源（Q17 C / Q22 A / Q29 A / Q31 A）
 *   - 'void' · VOID 恋爱绝缘体 证据（Q19 C）
 *   - 'mad'  · 发疯辅助信号（Q10 C / Q13 A）
 */

import type {
  OptionV3,
  QuestionV3,
  StatusKey,
  QuestionVariantV3,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// §〇 · META 前置题（id=0，独立于 questionsV3）
// ═══════════════════════════════════════════════════════════════════

export const metaQuestionV3: QuestionV3 = {
  id: 0,
  dimension: 'META',
  scale: 3,
  text: '先问个关键的——你现在的感情状态是——',
  options: [
    { label: 'A', text: '有对象，正在谈（真·在谈，不是微信养鱼那种）', score: 0, meta: 'dating' },
    { label: 'B', text: '暧昧着呢，天天在猜对方到底什么意思', score: 0, meta: 'ambiguous' },
    { label: 'C', text: '单身，但心里住着一个人（暗恋 / 前任 / 念念不忘的那个谁）', score: 0, meta: 'crush' },
    { label: 'D', text: '纯单身，心动是什么感觉已经忘了，自由得像一阵风', score: 0, meta: 'solo' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// §一 · C 接触维（追 ↔ 避）· 8 题 · ids 1-8
// ═══════════════════════════════════════════════════════════════════

const C_QUESTIONS: QuestionV3[] = [
  {
    id: 1,
    dimension: 'C',
    scale: 3,
    text: '凌晨十二点脑子里突然开始循环播放那个人的脸——',
    options: [
      { label: 'A', text: '"睡了吗？我今天看到个东西突然想到你"（其实什么也没看到，就是想你了）', score: 2 },
      { label: 'B', text: '打开 ta 朋友圈→显示更多→翻到三年前→退出→假装没看过', score: 0 },
      { label: 'C', text: '手放在发送键上又收回来，主打一个"别打扰，我不配"', score: -2 },
    ],
    variants: {
      dating: { text: '半夜醒了，对象在旁边睡得跟死猪一样，你突然很想扒拉 ta 一下——' },
      ambiguous: { text: '凌晨十二点，暧昧对象的聊天框还停在上次你发的"哈哈哈"——' },
      crush: { text: '深夜是你最不争气的时间段，那个放不下的人又开始在你脑子里上班了——' },
      solo: {
        text: '凌晨十二点突然想联系一个人（任谁都行），脑子已经开始给 ta 写小作文了——',
        options: [
          '挑一个直接发消息，手比脑子快',
          '去翻某人的朋友圈考古',
          '忍住了，骚扰谁都不合适',
        ],
      },
    },
  },
  {
    id: 2,
    dimension: 'C',
    scale: 3,
    text: '你发了条消息——三小时过去了，没动静——',
    options: [
      { label: 'A', text: 'ta 可能在忙，成年人嘛，理解（然后默默把对话框置顶取消又置顶）', score: -2 },
      { label: 'B', text: '再等等呗，不差这一会儿（其实每五分钟看一次手机）', score: 0 },
      { label: 'C', text: '不行我得再追一条，万一信号不好呢？万一手滑删了呢？（给自己找一百个理由）', score: 2 },
    ],
    variants: {
      dating: { text: '发消息给对象，三小时没回——' },
      ambiguous: { text: '给暧昧对象发了条精心措辞的消息，石沉大海——' },
      crush: { text: '鼓起勇气给心动的人发了一条，然后盯着屏幕看了三小时——' },
      solo: { text: '发消息给一个关系模糊的人，三小时了对方像是被外星人绑架了一样——' },
    },
  },
  {
    id: 3,
    dimension: 'C',
    scale: 3,
    text: '周末了，ta 像空气一样安静，没人约——',
    options: [
      { label: 'A', text: '"周末有空吗？我正好在附近"（其实专门绕路过来的，已查好三套方案）', score: 2 },
      { label: 'B', text: '等着呗，看谁先憋不住先开口', score: 0 },
      { label: 'C', text: '正好，一个人的周末是最快乐的周末', score: -2 },
    ],
    variants: {
      dating: { text: '周末对象没主动约你，朋友圈也不发，仿佛人间蒸发——' },
      ambiguous: { text: '周末了，暧昧对象像忘了世界上有你这么个人——' },
      crush: { text: '周末了，心里那个人大概在和别人玩吧（已经开始脑补了）——' },
      solo: {
        text: '周末了，身边朋友都各忙各的，没人叫你——',
        options: ['我主动拉一个出来，组局', '在线等有人开团', '各玩各的正好'],
      },
    },
  },
  {
    id: 4,
    dimension: 'C',
    scale: 3,
    text: 'ta 发了条朋友圈——你的手指——',
    options: [
      { label: 'A', text: '随缘刷到再说，不特意去看（骗谁呢，明明已点进 ta 主页八百次了）', score: -2 },
      { label: 'B', text: '点个赞划走，主打一个"我看到了但我不在意"的人设', score: 0 },
      { label: 'C', text: '秒赞+秒评+已截图发给闺蜜群分析，一套三连行云流水', score: 2 },
    ],
    variants: {
      dating: { text: '对象发了条朋友圈，配图里好像有个你不认识的异性——' },
      ambiguous: { text: '暧昧对象发朋友圈了，文案看起来像在说别人又像是在说你——' },
      crush: { text: '心里那个人发朋友圈了，你开始逐字做阅读理解——' },
      solo: {
        text: '刷到一个认识但不熟的人发了条挺有意思的朋友圈——',
        options: ['不特意看，刷到再说', '点个赞划走', '秒赞+评论引话题'],
      },
    },
  },
  {
    id: 5,
    dimension: 'C',
    scale: 5,
    text: '跟 ta 聊得火热的关系，突然就三天没人发消息了——',
    options: [
      { label: 'A', text: '我主动救场，找个新话题续上，不能让话头掉地上', score: 2 },
      { label: 'B', text: '发个表情包戳一下，不戳显得太在意', score: 1 },
      { label: 'C', text: '看谁先憋不住——这是一场耐力竞赛', score: 0 },
      { label: 'D', text: '翻聊天记录反复背诵，但就是不主动发', score: -1 },
      { label: 'E', text: '淡了就淡了呗，缘分到了自然断（其实心里已经在叹气了）', score: -2 },
    ],
    variants: {
      dating: { text: '和对象最近聊天频率明显下降，已经三天没有新话题了——' },
      ambiguous: { text: '暧昧对象三天没主动找你，上次聊天结束还是你发的"好吧"——' },
      crush: { text: '那个人三天没动静了，你开始怀疑上次说错了什么——' },
      solo: { text: '一段聊得挺好的关系，三天没人起头——' },
    },
  },
  {
    id: 6,
    dimension: 'C',
    scale: 3,
    text: '遇上一个让你眼前一亮的人——',
    options: [
      { label: 'A', text: '算了，等缘分吧，主动加人这种事太羞耻了', score: -2 },
      { label: 'B', text: '有机会就聊，没机会就算了', score: 0 },
      { label: 'C', text: '"你好，能加个微信吗？"——说完心跳 180 但手已经在掏二维码了', score: 2 },
    ],
    variants: {
      dating: { text: '朋友局遇到一个新认识的异性（假设你单身），对方让你多看了一眼——' },
      ambiguous: { text: '朋友局遇到另一个让你心动的人，脑子已经开始比较了——' },
      crush: { text: '朋友局遇到一个不错的人，有那么一瞬间你觉得"也许可以试试"——' },
      solo: { text: '朋友局遇到一个挺对胃口的人——' },
    },
  },
  {
    id: 7,
    dimension: 'C',
    scale: 3,
    text: 'ta 发了一条伤感动态，明显心情不太好——',
    options: [
      { label: 'A', text: '立刻私信："怎么了？我在。"（三秒内发送，手根本没经过大脑审批）', score: 2 },
      { label: 'B', text: '点个赞表示"我看到了"，等 ta 主动说', score: 0 },
      { label: 'C', text: '不评论，成年人的情绪该自己消化（其实在等 ta 来私信你）', score: -2 },
    ],
    variants: {
      dating: { text: '对象发了一条emo动态，看起来受了委屈——' },
      ambiguous: { text: '暧昧对象发了条低落的文案，你猜是不是跟别人有关——' },
      crush: { text: '心里那个人发了一条很丧的动态，你心疼了——' },
      solo: {
        text: '好朋友发了条特别丧的动态——',
        options: [
          '立刻私信问怎么了',
          '点个赞表示看到了',
          '不评论，ta想说自然会说',
        ],
      },
    },
  },
  {
    id: 8,
    dimension: 'C',
    scale: 3,
    text: '谈恋爱 / 暧昧里"谁更主动"这件事，你的态度是——',
    options: [
      { label: 'A', text: '最好对方主动点，我被爱就行（前提是有人要来爱我啊）', score: -2 },
      { label: 'B', text: '双向奔赴最舒服，一个人追太累了', score: 0 },
      { label: 'C', text: '喜欢就要冲，主动不丢人，憋着才难受', score: 2 },
    ],
    variants: {
      dating: { text: '在现在这段关系里，主动联系这件事——' },
      ambiguous: { text: '暧昧期谁更主动这件事，你心里有杆秤——' },
      crush: { text: '对喜欢的人主动这件事，你的态度是——' },
      solo: { text: '如果未来谈恋爱，"主动"这件事你觉得——' },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §二 · R 调节维（暴 ↔ 闷）· 8 题 · ids 9-16
// ═══════════════════════════════════════════════════════════════════

const R_QUESTIONS: QuestionV3[] = [
  {
    id: 9,
    dimension: 'R',
    scale: 3,
    text: 'ta 一句话精准踩中你的雷区——',
    options: [
      { label: 'A', text: '当场怼回去，情绪来了压不住，有话必须现在说清楚', score: 2 },
      { label: 'B', text: '先忍一忍，等情绪过了再聊，这样杀伤力比较小', score: 0 },
      { label: 'C', text: '"没事啊"——然后默默把这笔账记进心里的小本本，页码+1', score: -2 },
    ],
    variants: {
      dating: { text: '对象说了句让你瞬间火冒三丈的话——' },
      ambiguous: { text: '暧昧对象一句轻飘飘的话让你心里咯噔——' },
      crush: { text: '心里那个人说了句让你从头凉到脚的话——' },
      solo: {
        text: '亲近的人（朋友/家人）说了句精准踩中你雷区的话——',
        options: [
          '当场怼回去，不憋着',
          '先忍，事后再谈',
          '"没事"——然后心里存档',
        ],
      },
    },
  },
  {
    id: 10,
    dimension: 'R',
    scale: 3,
    text: '吵架现场——你俩都上头了——',
    options: [
      { label: 'A', text: '我闭嘴，直接冷战。空气能冻出冰碴子', score: -2 },
      { label: 'B', text: '先各自冷静，一晚上就好了', score: 0 },
      { label: 'C', text: '憋什么憋？今天我不把这几年攒的旧账全翻出来我不姓X', score: 2, tag: 'mad' },
    ],
    variants: {
      dating: { text: '和对象吵到面红耳赤——' },
      ambiguous: { text: '和暧昧对象闹别扭，谁都不肯先低头——' },
      crush: { text: '和心里那个人起了冲突（或者脑补的冲突够真实）——' },
      solo: {
        text: '和最亲近的人吵起来了，火药味十足——',
        options: [
          '闭嘴，直接进入冷战模式',
          '冷静一晚就好',
          '当场爆炸，旧账新账全翻一遍',
        ],
      },
    },
  },
  {
    id: 11,
    dimension: 'R',
    scale: 3,
    text: '今天被生活暴打了一顿，一肚子火无处发泄——',
    options: [
      { label: 'A', text: '立刻找人吐槽，每条语音六十秒，连发二十条不停歇', score: 2 },
      { label: 'B', text: '跟亲近的人说一下，点到为止', score: 0 },
      { label: 'C', text: '不说，自己消化。说有什么用呢，日子还不是得自己过', score: -2 },
    ],
    variants: {
      dating: { text: '上班被气到想原地辞职，回到家对象问了一句"怎么了"——' },
      ambiguous: { text: '今天诸事不顺，一肚子火，暧昧对象刚好发来一条消息——' },
      crush: { text: '被生活狠狠揍了一拳，心里那个人浑然不知——' },
      solo: {
        text: '今天被各种糟心事围殴，你想——',
        options: [
          '立刻找个能说话的人疯狂输出',
          '跟人提一嘴，不展开',
          '不说，自己消化',
        ],
      },
    },
  },
  {
    id: 12,
    dimension: 'R',
    scale: 3,
    text: 'ta 忘了一个你特别在意的日子（生日/纪念日/你说过很重要的事）——',
    options: [
      { label: 'A', text: '装没事，但心里的小本本已经记满了，等攒够了再算', score: -2 },
      { label: 'B', text: '轻描淡写提一嘴"今天好像是什么日子来着"，不炸', score: 0 },
      { label: 'C', text: '"你根本不在意的对不对？上次也是！上上次也是！"——当场翻旧账', score: 2 },
    ],
    variants: {
      dating: { text: '对象忘了你们的重要纪念日，还在那刷抖音——' },
      ambiguous: { text: '暧昧对象忘了你生日，虽然本来也没指望ta记住——' },
      crush: { text: '心里那个人忘了你曾经很在意的一件事——' },
      solo: {
        text: '最亲近的朋友/家人忘了你生日——',
        options: [
          '装没事，心里默默记账',
          '当天轻描淡写提一嘴',
          '"你居然忘了？？"——当场发飙',
        ],
      },
    },
  },
  {
    id: 13,
    dimension: 'R',
    scale: 5,
    text: '看到 ta 跟别人聊得火热，你——',
    options: [
      { label: 'A', text: '"这谁啊？聊什么呢给我看看！"——当场质问，憋不了一点', score: 2, tag: 'mad' },
      { label: 'B', text: '当天找机会旁敲侧击问一句，装得漫不经心', score: 1 },
      { label: 'C', text: '隔天不经意提一提，看看 ta 什么反应', score: 0 },
      { label: 'D', text: '暗中观察，收集证据，不说破', score: -1 },
      { label: 'E', text: '当没看见。算了，看见了又能怎样呢', score: -2 },
    ],
    variants: {
      dating: { text: '对象跟一个异性聊得眉飞色舞，你瞥到了聊天框——' },
      ambiguous: { text: '暧昧对象跟别人也聊得火热，你的雷达响了——' },
      crush: { text: '心里那个人跟别人互动频繁，你酸得要命但没立场说话——' },
      solo: { text: '一个你曾经在意过的人跟别人打得火热——' },
    },
  },
  {
    id: 14,
    dimension: 'R',
    scale: 3,
    text: '最近压力大到快爆炸了，整个人都不太好——',
    options: [
      { label: 'A', text: '不跟 ta 说，不想把自己的烂摊子甩给别人', score: -2 },
      { label: 'B', text: '说一句"最近有点累"，不展开', score: 0 },
      { label: 'C', text: '抱着 ta 或者抱着手机，从下午三点吐到凌晨两点，中间不带停', score: 2 },
    ],
    variants: {
      dating: { text: '生活压力大到想原地消失，对象在旁边问"你怎么了"——' },
      ambiguous: { text: '压力大到崩溃边缘，暧昧对象好像察觉到了——' },
      crush: { text: '心情一团糟，但心里那个人远在天边什么都不知道——' },
      solo: {
        text: '压力大到整个人都快裂开了——',
        options: [
          '不想连累谁，自己扛着',
          '跟朋友说一句，不展开',
          '找个能说话的人聊到天亮',
        ],
      },
    },
  },
  {
    id: 15,
    dimension: 'R',
    scale: 3,
    text: 'ta 一句话精准扎到你的软肋，但你不想当场破防——',
    options: [
      { label: 'A', text: '不行，表情管理失败了，脸已经垮了，藏不住一点', score: 2 },
      { label: 'B', text: '硬撑着装镇定，等回头一个人再慢慢想', score: 0 },
      { label: 'C', text: '面无表情继续聊天，仿佛什么都没发生（其实那句话已经在脑子里重播三十遍了）', score: -2 },
    ],
    variants: {
      dating: { text: '对象不小心说了句让你特别难受的话——' },
      ambiguous: { text: '暧昧对象一句无心的话，精准戳中你最在意的点——' },
      crush: { text: '心里那个人说了句让你觉得自己一文不值的话——' },
      solo: {
        text: '好朋友不小心说了句扎到你心里最软的地方——',
        options: [
          '表情当场垮掉，藏不住',
          '硬撑，回头再想',
          '面无表情，装没听见',
        ],
      },
    },
  },
  {
    id: 16,
    dimension: 'R',
    scale: 3,
    text: '在亲密关系里"发火"这件事，你的态度是——',
    options: [
      { label: 'A', text: '能不发就不发，伤感情。气死自己总比气跑对方强', score: -2 },
      { label: 'B', text: '该表达就表达，憋久了对自己不好', score: 0 },
      { label: 'C', text: '有情绪必须当场给，不憋不藏，谁还不是个有脾气的人', score: 2 },
    ],
    variants: {
      dating: { text: '谈恋爱的时候，对对象发火这件事——' },
      ambiguous: { text: '暧昧期表达负面情绪这件事——' },
      crush: { text: '对喜欢的人发火这件事——' },
      solo: { text: '在一段亲密关系里，生气这件事你怎么看——' },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §三 · A 黏附维（黏 ↔ 离）· 8 题 · ids 17-24
// ═══════════════════════════════════════════════════════════════════

const A_QUESTIONS: QuestionV3[] = [
  {
    id: 17,
    dimension: 'A',
    scale: 3,
    text: '一整天了，ta 跟人间蒸发了一样——',
    options: [
      { label: 'A', text: '慌得一批，脑子里已经演完一整季"ta是不是出事了/不爱我了/我是不是被拉黑了"', score: 2 },
      { label: 'B', text: '正常，大家都忙，成年人谁还没个断联的时候', score: 0 },
      { label: 'C', text: '太棒了，清净。最好明天也别找我', score: -2, tag: 'rat' },
    ],
    variants: {
      dating: { text: '一整天都没联系上对象，电话不接消息不回——' },
      ambiguous: { text: '暧昧对象一整天没动静，上次消息还停在你发的那个表情包——' },
      crush: { text: '心里那个人一整天没有任何痕迹，你开始怀疑自己是不是单机玩家——' },
      solo: {
        text: '一整天没有任何人跟你聊天，对话框全灰——',
        options: [
          '慌，感觉自己被世界静音了',
          '正常，大家各忙各的',
          '清净，爽到飞起',
        ],
      },
    },
  },
  {
    id: 18,
    dimension: 'A',
    scale: 3,
    text: '周末最让你舒服的过法是——',
    options: [
      { label: 'A', text: '一个人待着，谁也别找我，社交是一种消耗', score: -2 },
      { label: 'B', text: '看情况，有约就出，没约就宅', score: 0 },
      { label: 'C', text: '跟 ta 腻一整天，从早到晚，做什么都行只要在一起', score: 2 },
    ],
    variants: {
      dating: { text: '周末到了，你最喜欢的安排是——' },
      ambiguous: { text: '周末了，暧昧对象还没约你——' },
      crush: { text: '周末了，心里那个人大概在别处快乐吧——' },
      solo: {
        text: '周末你最喜欢的过法是——',
        options: [
          '自己一个人待着最舒服',
          '看情况有约就出',
          '跟亲近的人泡一整天',
        ],
      },
    },
  },
  {
    id: 19,
    dimension: 'A',
    scale: 3,
    text: '每天睡前互道"晚安"这件事——',
    options: [
      { label: 'A', text: '必须的，不说晚安睡不着，这是仪式感不是矫情', score: 2 },
      { label: 'B', text: '看情况吧，有时候聊着聊着就睡了', score: 0 },
      { label: 'C', text: '没必要，睡了就是睡了，还发什么晚安，又不是打卡上班', score: -2, tag: 'void' },
    ],
    variants: {
      dating: { text: '你和对象每天互道晚安这件事——' },
      ambiguous: { text: '跟暧昧对象说晚安这件事——' },
      crush: { text: '想跟心里那个人说晚安但说不出口这件事——' },
      solo: {
        text: '你睡前有没有一个"必须说晚安"的人——',
        options: [
          '必须有，睡前要跟某个人说一句',
          '看情况，有时候会发',
          '没有也不需要，睡就完事',
        ],
      },
    },
  },
  {
    id: 20,
    dimension: 'A',
    scale: 3,
    text: 'ta 要去很远的地方待一周——',
    options: [
      { label: 'A', text: '自由了！一个人吃饭看剧打游戏，爽到不想让 ta 回来', score: -2 },
      { label: 'B', text: '偶尔联系一下就行，各自有各自的生活', score: 0 },
      { label: 'C', text: '不行，必须每天视频，少一天我就开始焦虑', score: 2 },
    ],
    variants: {
      dating: { text: '对象要出差一周，意味着你一个人守空房——' },
      ambiguous: { text: '暧昧对象要出差一周，联系肯定会变少——' },
      crush: { text: '心里那个人要离开一阵子，你忽然意识到连告知的资格都没有——' },
      solo: {
        text: '最亲近的朋友/家人要离开你一周——',
        options: [
          '正好我也清静清静',
          '偶尔联系就行',
          '必须每天保持联系',
        ],
      },
    },
  },
  {
    id: 21,
    dimension: 'A',
    scale: 5,
    text: '你跟 ta 在各自朋友圈的存在感——',
    options: [
      { label: 'A', text: '朋友圈就是我俩秀恩爱的主战场，合照当头像日常发糖', score: 2 },
      { label: 'B', text: '经常发合照，大家已经习惯了', score: 1 },
      { label: 'C', text: '偶尔出现一次，不刻意', score: 0 },
      { label: 'D', text: '基本不出现对方，觉得没必要', score: -1 },
      { label: 'E', text: '完全不来往，我的朋友圈是我的，ta 的 ta 的', score: -2 },
    ],
    variants: {
      dating: { text: '你和对象在彼此朋友圈的出镜率——' },
      ambiguous: { text: '你和暧昧对象在朋友圈里互相提及的频率——' },
      crush: { text: '你和心里那个人，在朋友圈里根本没什么交集——' },
      solo: { text: '如果未来谈恋爱，你希望两个人在朋友圈——' },
    },
  },
  {
    id: 22,
    dimension: 'A',
    scale: 3,
    text: '亲密关系里的"个人时间"——你的态度是——',
    options: [
      { label: 'A', text: '必须有，每天需要自己待一会儿，没有独处我会枯萎', score: -2 },
      { label: 'B', text: '重要但可以聊，需要时提出来', score: 0 },
      { label: 'C', text: '没有也行，跟 ta 在一起就是充电，分开才需要充电', score: 2, tag: 'rat' },
    ],
    variants: {
      dating: { text: '你和对象之间的个人空间——' },
      ambiguous: { text: '暧昧期你自己需要多少独处时间——' },
      crush: { text: '想到心里那个人时，你还需要自己的空间吗——' },
      solo: { text: '如果谈恋爱，个人空间这件事——' },
    },
  },
  {
    id: 23,
    dimension: 'A',
    scale: 3,
    text: '你面临一个重大决定（跳槽/搬家/换城市），ta——',
    options: [
      { label: 'A', text: '必须跟 ta 商量，ta 的意见比我自己的判断还重要', score: 2 },
      { label: 'B', text: '会告诉 ta，但最终自己拿主意', score: 0 },
      { label: 'C', text: '我自己的人生我自己定，不用任何人参与', score: -2 },
    ],
    variants: {
      dating: { text: '重大的职业/人生决定，对象在你的决策里占多少分量——' },
      ambiguous: { text: '一个大决定，你会问暧昧对象的意见吗——' },
      crush: { text: '重大决定，你会在心里想"ta 会怎么看我这个决定"吗——' },
      solo: {
        text: '重大人生决定，你会跟谁商量——',
        options: [
          '必须问最在意的那个人',
          '会告诉身边人，但自己判断',
          '自己的事自己定',
        ],
      },
    },
  },
  {
    id: 24,
    dimension: 'A',
    scale: 3,
    text: '两个人"各忙各的、互不打扰"的状态持续了一整天——',
    options: [
      { label: 'A', text: '很舒服，健康的距离感最美', score: -2 },
      { label: 'B', text: '可以接受，但别太久', score: 0 },
      { label: 'C', text: '受不了，这是一种冷暴力吧？？', score: 2 },
    ],
    variants: {
      dating: { text: '和对象各忙各的，一整天没怎么说话——' },
      ambiguous: { text: '暧昧中突然各忙各的，联系断了——' },
      crush: { text: '想到心里那个人也在忙自己的，跟你毫无关联——' },
      solo: { text: '如果恋爱中两个人各忙各的一整天——' },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §四 · S 安全维（疑 ↔ 佛）· 8 题 · ids 25-32
// ═══════════════════════════════════════════════════════════════════

const S_QUESTIONS: QuestionV3[] = [
  {
    id: 25,
    dimension: 'S',
    scale: 3,
    text: 'ta 最近突然不怎么回消息了——',
    options: [
      { label: 'A', text: '开始逐帧分析上次聊天，到底哪句话让 ta 冷淡了？是不是我太烦了？', score: 2 },
      { label: 'B', text: '给 ta 点空间，谁还没个不想说话的时候', score: 0 },
      { label: 'C', text: '大概在忙吧，没多想。真有事会说的', score: -2 },
    ],
    variants: {
      dating: { text: '对象最近回消息变慢了，以前秒回现在轮回——' },
      ambiguous: { text: '暧昧对象突然冷下来了，消息从三分钟一回变成三小时一回——' },
      crush: { text: '心里那个人突然不怎么互动了，你的安全感断崖式下跌——' },
      solo: { text: '一个平时还算在意的人突然不怎么回你消息了——' },
    },
  },
  {
    id: 26,
    dimension: 'S',
    scale: 3,
    text: 'ta 的那些异性朋友——',
    options: [
      { label: 'A', text: '谁还没几个异性朋友啊，无所谓，我有我的 ta 有 ta 的', score: -2 },
      { label: 'B', text: '了解一下就行，不多问', score: 0 },
      { label: 'C', text: '能不能给我拉个名单？每个什么关系、认识多久、上次聊天啥时候——', score: 2 },
    ],
    variants: {
      dating: { text: '对象的异性朋友圈——你心里有数吗——' },
      ambiguous: { text: '暧昧对象的异性朋友——ta 到底跟多少人暧昧——' },
      crush: { text: '心里那个人的异性朋友——有没有比我更特别的——' },
      solo: { text: '如果谈恋爱，对方的异性朋友——' },
    },
  },
  {
    id: 27,
    dimension: 'S',
    scale: 3,
    text: 'ta 手机响了，看了一眼屏幕，没说是谁——',
    options: [
      { label: 'A', text: '脑子里已经开始播放"ta是不是在跟别人聊天"的小剧场，但咬牙不问', score: 2 },
      { label: 'B', text: '有点好奇但忍住了，每个人都有自己的空间', score: 0 },
      { label: 'C', text: 'ta 的事我不管，手机响了跟我有什么关系', score: -2 },
    ],
    variants: {
      dating: { text: '对象手机响了，瞄了一眼然后没说是谁——' },
      ambiguous: { text: '暧昧对象在你面前回消息，屏幕背着你——' },
      crush: { text: '心里那个人在你面前看手机笑了一下——是给谁笑的——' },
      solo: { text: '如果恋爱中，对方手机响了不告诉你是谁——' },
    },
  },
  {
    id: 28,
    dimension: 'S',
    scale: 3,
    text: '"异地恋"这个设定，你——',
    options: [
      { label: 'A', text: '没问题啊，信任就行，异地算什么，见不到面我也稳得很', score: -2 },
      { label: 'B', text: '有挑战，但不是不能克服', score: 0 },
      { label: 'C', text: '不行，我肯定会天天脑补 ta 在那边干什么，见不到等于不存在', score: 2 },
    ],
    variants: {
      dating: { text: '如果你的对象突然说要去外地半年——' },
      ambiguous: { text: '暧昧对象要去别的城市了，还没确认关系就要异地——' },
      crush: { text: '心里那个人去了异地，你连"等我"都没资格说——' },
      solo: { text: '"异地恋"在你看来——' },
    },
  },
  {
    id: 29,
    dimension: 'S',
    scale: 5,
    text: 'ta 给你的爱/在意/信号——你接收到的——',
    options: [
      { label: 'A', text: '总觉得不够，还需要更多证据。爱是要证明的，不是用说的', score: 2, tag: 'rat' },
      { label: 'B', text: '偶尔会怀疑，怀疑完又觉得自己想多了', score: 1 },
      { label: 'C', text: '大部分时候能感受到，就算偶尔感觉不到也觉得正常', score: 0 },
      { label: 'D', text: '基本不怀疑，ta 是什么人我心里有数', score: -1 },
      { label: 'E', text: '完全相信，不需要任何证据，我对自己和 ta 都有信心', score: -2 },
    ],
    variants: {
      dating: { text: '对象给你的爱——你真实感受到的有多少——' },
      ambiguous: { text: '暧昧对象给你的信号——你读到的几分是真的几分是你脑补的——' },
      crush: { text: '心里那个人对你的在意——你觉得有几分——' },
      solo: { text: '回顾过去被人在意的经历——你真的感受到被爱过吗——' },
    },
  },
  {
    id: 30,
    dimension: 'S',
    scale: 3,
    text: 'ta 手机里还留着和前任的合照——',
    options: [
      { label: 'A', text: '过去就过去了呗，谁还没个过去，留着就留着', score: -2 },
      { label: 'B', text: '有点介意，但不会说，显得太小气了', score: 0 },
      { label: 'C', text: '删掉！立刻！现在！留着是什么意思？怀念吗？', score: 2 },
    ],
    variants: {
      dating: { text: '发现对象手机里还有前任的合照，保存得好好的——' },
      ambiguous: { text: '暧昧对象还在跟前任互动——你算什么——' },
      crush: { text: '心里那个人和前任的合照还挂在朋友圈里——' },
      solo: { text: '假如未来对象还留着前任合照——' },
    },
  },
  {
    id: 31,
    dimension: 'S',
    scale: 3,
    text: 'ta 对你说了"我爱你/我喜欢你"——',
    options: [
      { label: 'A', text: '"真的吗？你喜欢我什么？我有什么值得喜欢的？"——灵魂三连问，当场逼供', score: 2, tag: 'rat' },
      { label: 'B', text: '开心，接住这份爱，不追问太多', score: 0 },
      { label: 'C', text: '"嗯嗯我知道"——内心：该配合演出的我演视而不见', score: -2 },
    ],
    variants: {
      dating: { text: '对象跟你说"我爱你"——' },
      ambiguous: { text: '暧昧对象终于说了"我喜欢你"——但你没想好要不要信——' },
      crush: { text: '心里那个人对你说"我喜欢你"——这场景你已经在梦里排练过五百遍了——' },
      solo: { text: '假如有人对你认真说"我爱你"——' },
    },
  },
  {
    id: 32,
    dimension: 'S',
    scale: 3,
    text: '亲密关系里的"吃醋"——',
    options: [
      { label: 'A', text: '醋意是信任问题，我尽量不让自己被这种东西控制', score: -2 },
      { label: 'B', text: '适量吃醋是调味剂，别失控就行', score: 0 },
      { label: 'C', text: '我是醋王本王，连 ta 同事都能让我醋一整天', score: 2 },
    ],
    variants: {
      dating: { text: '你和对象之间，吃醋的频率——' },
      ambiguous: { text: '暧昧期你会吃醋吗——虽然好像也没立场吃——' },
      crush: { text: '对心里那个人，你每天都在醋海遨游——' },
      solo: {
        text: '重要的人和别人走得更近时，你的心态——',
        options: [
          '这点酸意自己能消化，不放大',
          '有一点点也正常',
          '很在意，连新认识的人都能触发',
        ],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §五 · solo-only 题（替换 5 道以"假设正在恋爱/暗恋/前任"为锚的variants）
//
// META Q0 D = "纯单身，没有任何心动对象" 的用户原本需答 Q13/Q21/Q26/Q27/Q30 的
// solo variant。此五题虽可改成未来假设，但测点仍更像关系事件；solo-native
// 补题可避免纯单身作答违和。
// 此五题在 solo 路径被替换为同维同极性的 solo-native 题（Q33-Q37），以保
// 每 status 四维 8/8/8/8 + 4+/4- A 极性。
//
// 极性映射：
//   Q13 (R, A=+2, 5-scale) → Q33 (R, A=+2, 5-scale)
//   Q21 (A, A=+2, 5-scale) → Q35 (A, A=+2, 5-scale)
//   Q26 (S, A=-2, 3-scale) → Q34 (S, A=-2, 3-scale)
//   Q27 (S, A=+2, 3-scale) → Q37 (S, A=+2, 3-scale)
//   Q30 (S, A=-2, 3-scale) → Q36 (S, A=-2, 3-scale)
//
// 非 solo 用户不答此 5 题；solo 用户不答被替题——两组于 codec 中相当于
// 互斥补位，位点皆为 `-`，不破坏既往 v3 链接（`decodeAnswersV3` 尾部
// 右 pad `-`）。
// ═══════════════════════════════════════════════════════════════════

export const SOLO_EXCLUDED_IDS_V3: ReadonlySet<number> = new Set([
  13, 21, 26, 27, 30,
]);

const SOLO_ONLY_QUESTIONS: QuestionV3[] = [
  {
    id: 33,
    dimension: 'R',
    scale: 5,
    text: '一个人待着的时候，突然想起一件多年前让你特别难受的往事——',
    options: [
      { label: 'A', text: '立刻找个人倾诉，朋友家人树洞都行，这事不能烂在肚子里', score: 2 },
      { label: 'B', text: '写个长长的备忘录 / 发一条仅自己可见的朋友圈，写出来就好了', score: 1 },
      { label: 'C', text: '叹口气，继续刷手机，反正想也没用', score: 0 },
      { label: 'D', text: '在心里翻一遍，一个字不说，反正说了也没人懂', score: -1 },
      { label: 'E', text: '早翻篇了，过去的事就跟过去的外卖订单一样，删了', score: -2 },
    ],
  },
  {
    id: 34,
    dimension: 'S',
    scale: 3,
    text: '身边重要的朋友突然有了新的"铁哥们/好闺蜜"，你好像被冷落了——',
    options: [
      { label: 'A', text: '挺好的啊，各有各的圈子，我为啥要在意这个', score: -2 },
      { label: 'B', text: '有点酸但不说，显得太小气了', score: 0 },
      { label: 'C', text: '忍不住去查对方最近跟谁走得近，朋友圈互动翻个遍', score: 2 },
    ],
  },
  {
    id: 35,
    dimension: 'A',
    scale: 5,
    text: '你主动联系亲密好友/家人的频率——',
    options: [
      { label: 'A', text: '几乎每天，至少有一两个人要讲讲话，不然感觉跟世界断联了', score: 2 },
      { label: 'B', text: '一周三四次，不算多也不算少', score: 1 },
      { label: 'C', text: '想到了才联系，主打一个随缘', score: 0 },
      { label: 'D', text: '两周一次都算频繁了，没事不找人', score: -1 },
      { label: 'E', text: '有事才找，没事各过各的，保持互不打扰的美好距离', score: -2 },
    ],
  },
  {
    id: 36,
    dimension: 'S',
    scale: 3,
    text: '想起自己曾经被辜负/心意落空的某段经历——',
    options: [
      { label: 'A', text: '早翻篇了，甚至想不起细节了。过去的事就让它烂在过去', score: -2 },
      { label: 'B', text: '偶尔想起，叹口气，然后继续过日子', score: 0 },
      { label: 'C', text: '反复想，越想越气，半夜还能突然坐起来骂一句', score: 2 },
    ],
  },
  {
    id: 37,
    dimension: 'S',
    scale: 3,
    text: '一个重要的朋友最近变得神秘了（朋友圈三天可见/问啥都说"还行吧""没事"）——',
    options: [
      { label: 'A', text: '第一反应：是不是我哪里惹到 ta 了？翻聊天记录找证据', score: 2 },
      { label: 'B', text: '可能人家自己有事呗，等等看', score: 0 },
      { label: 'C', text: '别人有自己的节奏，我又不是 ta 生活的中心', score: -2 },
    ],
  },
];

export const SOLO_ONLY_IDS_V3: ReadonlySet<number> = new Set(
  SOLO_ONLY_QUESTIONS.map((q) => q.id),
);

// ═══════════════════════════════════════════════════════════════════
// §六 · 合并 · questionsV3 / questionIdsV3 / questionByIdV3
// ═══════════════════════════════════════════════════════════════════

export const questionsV3: QuestionV3[] = [
  ...C_QUESTIONS,
  ...R_QUESTIONS,
  ...A_QUESTIONS,
  ...S_QUESTIONS,
  ...SOLO_ONLY_QUESTIONS,
];

/** codec 编码顺序 · append-only。未来若增题一律追加至尾部，勿插入中段。 */
export const questionIdsV3: readonly number[] = questionsV3.map((q) => q.id);

export const questionByIdV3: ReadonlyMap<number, QuestionV3> = new Map(
  questionsV3.map((q) => [q.id, q]),
);

// 平衡不变量（手工审计于题库初版，见头注分布表）：
//   - 每维 8 题 · A 选项极性 4+/4- · 已手工校验通过。
//   - 如题库扩增，应补入单元测试做自动校验；运行期不再做 dev flag 探测。

// Re-export helpers for convenience.
export { resolveQuestionText, resolveOptionText } from './types';
export type {
  OptionV3,
  QuestionV3,
  StatusKey,
  QuestionVariantV3,
  DimV3,
  ScoringDim,
  Scale,
  OptionTag,
} from './types';
