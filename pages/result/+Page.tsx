import { createMemo, Show } from 'solid-js'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-solid/usePageContext'
import { ResultPage, retreatCount, setAnswers, setRetreatCount } from '../../src/App'
import { decodeAnswers } from '../../src/logic/codec'
import { getResult, type Result } from '../../src/logic/scoring'
import { getLegacyResultV1 } from '../../src/logic/legacy/scoring-v1'

interface RenderedResult {
  result: Result
  isLegacy: boolean
}

export default function Page() {
  const pageContext = usePageContext()

  const rendered = createMemo<RenderedResult | null>(() => {
    const hash = pageContext.routeParams?.hash
    if (!hash) return null
    const decoded = decodeAnswers(hash)
    if (!decoded) return null

    // 分享链接解码进来时 retreatCount 恒为 0（当前 session 未答题），故「退退退」标签
    // 不会在观众端触发；只有从 /quiz 亲自提交过来的 session 才会带上非零的回退计数。
    if (decoded.version === 1) {
      // v0.3 链 → frozen legacy scoring。不得用 v0.4 scorer 解释旧 answers，
      // 两者题 id 空间已分叉，跨版本跑会产生错误的维度归一化。
      const legacy = getLegacyResultV1(decoded.answers, retreatCount()) as Result
      return { result: legacy, isLegacy: true }
    }
    // v2 链 → 当前 scorer。status 从 codec 解码直接传入（未来 Task 6 的
    // ratio scoring 会消费此字段按路径过滤，当前 v0.3 scorer 暂时忽略）。
    const result = getResult(decoded.answers, retreatCount())
    return { result, isLegacy: false }
  })

  return (
    <Show when={rendered()} fallback={<RedirectHome />}>
      <ResultPage
        result={rendered()!.result}
        isLegacy={rendered()!.isLegacy}
        onRestart={() => {
          setAnswers({})
          setRetreatCount(0)
          void navigate('/quiz')
        }}
      />
    </Show>
  )
}

function RedirectHome() {
  void navigate('/')
  return null
}
