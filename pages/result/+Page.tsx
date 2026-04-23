import { createMemo, onMount, Show } from 'solid-js'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-solid/usePageContext'
import { ResultPage, retreatCount, setAnswers, setRetreatCount } from '../../src/App'
import { decodeAnswers } from '../../src/logic/codec'
import { getResult, type Result } from '../../src/logic/scoring'
import { getResultV3 } from '../../src/logic/v3/scoring'
import { getLegacyResultV1 } from '../../src/logic/legacy/scoring-v1'
import { saveToHistory } from '../../src/logic/history'
import { resetTelemetryQuizRun, trackPageView, trackResultView } from '../../src/telemetry/client'

interface RenderedResult {
  result: Result
  isLegacy: boolean
  hash: string
}

export default function Page() {
  const pageContext = usePageContext()
  let saved = false

  const rendered = createMemo<RenderedResult | null>(() => {
    const hash = pageContext.routeParams?.hash
    if (!hash) return null
    const decoded = decodeAnswers(hash)
    if (!decoded) return null

    // 分享链接解码时 retreatCount 恒为 0（观者未答题）——「反复横跳」tag 不会在观众端触发。
    if (decoded.version === 1) {
      // v0.3 链 → frozen legacy scoring，禁止跨版本解释。
      const legacy = getLegacyResultV1(decoded.answers, retreatCount()) as Result
      return { result: legacy, isLegacy: true, hash }
    }
    if (decoded.version === 2) {
      // v0.4 链 → v2 scorer。statusChar 作为 override 与 answers[32] 反推同源；手改 URL 以链标为准。
      const result = getResult(decoded.answers, retreatCount(), decoded.status)
      return { result, isLegacy: true, hash }
    }
    // v3 链 → 当前 scorer。ResultV3 与 Result 结构同形（structural compat），强转消费。
    const v3 = getResultV3(decoded.answers, retreatCount(), decoded.status)
    return { result: v3 as unknown as Result, isLegacy: false, hash }
  })

  onMount(() => {
    const r = rendered()
    if (r && !saved) {
      saved = true
      saveToHistory(r.result, r.hash)
      trackPageView('result')
      trackResultView({
        hash: r.hash,
        result: r.result,
        isLegacy: r.isLegacy,
      })
    }
  })

  return (
    <Show when={rendered()} fallback={<RedirectHome />}>
      <ResultPage
        result={rendered()!.result}
        isLegacy={rendered()!.isLegacy}
        hash={rendered()!.hash}
        onRestart={() => {
          setAnswers({})
          setRetreatCount(0)
          resetTelemetryQuizRun()
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
