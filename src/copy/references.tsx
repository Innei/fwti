import type { JSX } from 'solid-js';

export interface ReferenceGroupCopy {
  title: string;
  map?: string;
  items: JSX.Element[];
}

export const resultReferencesCopy: {
  eyebrow: string;
  title: string;
  intro: string;
  groups: ReferenceGroupCopy[];
  disclaimer: JSX.Element[];
} = {
  eyebrow: '学术依据 · References',
  title: '维度理论锚点',
  intro:
    'FWTI 的四个维度（G/D · Z/R · N/L · Y/F）并非完全瞎编，它们分别对应心理学里研究浪漫关系最常用的几个量表。下列文献是维度设计的理论锚点，也是题目灵感的来源。',
  groups: [
    {
      title: '成人依恋理论 · Adult Attachment Theory',
      map: '→ 对应 N/L 与 Y/F',
      items: [
        <>
          Brennan, K. A., Clark, C. L., &amp; Shaver, P. R. (1998).
          Self-report measurement of adult romantic attachment: An
          integrative overview. In J. A. Simpson &amp; W. S. Rholes (Eds.),{' '}
          <em>Attachment theory and close relationships</em> (pp. 46–76).
          Guilford Press.
        </>,
        <>
          Fraley, R. C., Waller, N. G., &amp; Brennan, K. A. (2000). An item
          response theory analysis of self-report measures of adult
          attachment.{' '}
          <em>Journal of Personality and Social Psychology, 78</em>(2),
          350–365.
        </>,
        <>
          Shaver, P. R., &amp; Mikulincer, M. (2006). Attachment theory,
          individual psychodynamics, and relationship functioning. In A. L.
          Vangelisti &amp; D. Perlman (Eds.),{' '}
          <em>The Cambridge handbook of personal relationships</em> (pp.
          251–271). Cambridge University Press.
          <span class="refs-note">
            （"焦虑 = hyperactivating · 警觉黏附反刍" × "回避 = deactivating ·
            压抑拉远否认"的分型框架，FWTI 隐藏人格 RAT / BENCH / CPU
            的极性判定即本于此。）
          </span>
        </>,
      ],
    },
    {
      title: '情绪调节 · Emotion Regulation',
      map: '→ 对应 Z/R',
      items: [
        <>
          Gross, J. J., &amp; John, O. P. (2003). Individual differences in
          two emotion regulation processes: Implications for affect,
          relationships, and well-being.{' '}
          <em>Journal of Personality and Social Psychology, 85</em>(2),
          348–362.
        </>,
      ],
    },
    {
      title: '接近–回避动机 · Approach–Avoidance Motivation',
      map: '→ 对应 G/D',
      items: [
        <>
          Carver, C. S., &amp; White, T. L. (1994). Behavioral inhibition,
          behavioral activation, and affective responses to impending reward
          and punishment: The BIS/BAS Scales.{' '}
          <em>Journal of Personality and Social Psychology, 67</em>(2),
          319–333.
        </>,
        <>
          Gable, S. L. (2006). Approach and avoidance social motives and
          goals. <em>Journal of Personality, 74</em>(1), 175–222.
        </>,
      ],
    },
    {
      title: '中文量表 · Chinese Adaptation',
      items: [
        <>
          李同归，加藤和生。(2006). 成人依恋的测量：亲密关系经历量表（ECR）
          中文版. <em>心理学报，38</em>(3), 399–406.
        </>,
      ],
    },
  ],
  disclaimer: [
    <>
      <strong>本测试仅供参考。</strong>
      FWTI 借用了上述理论的维度结构与部分题目灵感，但
      <strong>并未经过心理测量学的信效度验证</strong>
      ，不是诊断工具，不能替代 ECR-R，也不能用来给自己或别人贴标签。
    </>,
    <>
      请勿将本结果用于相亲、挽回、分手、发律师函或自我攻击。如果你真的对自己的依恋模式感到好奇，建议去做一份正规的
      ECR-R 中文版，或找靠谱的心理咨询师聊聊。被一个网络测试逗笑是好事，被它说服就不是了。
    </>,
  ],
};
