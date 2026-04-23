import { createEffect, onMount } from 'solid-js'
import { navigate } from 'vike/client/router'
import {
  QuizPage,
  answers,
  retreatCount,
  setAnswers,
  setRetreatCount,
} from '../../src/App'
import { metaQuestionId, applyAnswerSelection } from '../../src/logic/answers'
import { encodeAnswersV3 } from '../../src/logic/codec'
import { getResultV3 } from '../../src/logic/v3/scoring'
import {
  buildQuestionPathV3,
  getRelationshipStatusV3,
  isPathCompleteV3,
} from '../../src/logic/v3/flow'
import type { Question } from '../../src/copy/questions'
import {
  beginQuizRun,
  trackPageView,
  trackQuizComplete,
  trackQuizProgress,
} from '../../src/telemetry/client'

export default function Page() {
  const metaAnswered = () => answers()[metaQuestionId] !== undefined
  const status = () => getRelationshipStatusV3(answers())
  const path = () => buildQuestionPathV3(answers(), status())
  const nonMetaPath = () => path().filter((q) => q.dimension !== 'META')
  const mainTotal = () => nonMetaPath().length
  const mainProgress = () => {
    const cur = answers()
    return nonMetaPath().filter((q) => cur[q.id] !== undefined).length
  }
  const canSubmit = () => isPathCompleteV3(answers(), status())

  function selectOption(qId: number, optionIdx: number) {
    const prev = answers()
    const isRetreat =
      qId !== metaQuestionId &&
      prev[qId] !== undefined &&
      prev[qId] !== optionIdx
    if (isRetreat) {
      setRetreatCount((n) => n + 1)
    }
    setAnswers((p) => applyAnswerSelection(p, qId, optionIdx))
    queueMicrotask(() => scrollToNextUnanswered(qId))
  }

  function scrollToNextUnanswered(fromId: number) {
    const cur = answers()
    const list = path()
    if (list.length === 0) return
    const fromIdx = list.findIndex((q) => q.id === fromId)
    const start = fromIdx === -1 ? 0 : fromIdx
    for (let step = 1; step <= list.length; step += 1) {
      const q = list[(start + step) % list.length]
      if (cur[q.id] === undefined) {
        const el = document.getElementById(`q-${q.id}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    const submit = document.getElementById('submit-bar')
    if (submit) submit.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  function submitQuiz() {
    const s = status()
    if (s === null) return // META 未答
    const result = getResultV3(answers(), retreatCount(), s)
    const encoded = encodeAnswersV3(answers(), s)
    trackQuizComplete({
      hash: encoded,
      status: s,
      // telemetry 的 Result 字段按 v2 形状定义，v3 结构同形（structural compat），强转以复用。
      result: result as unknown as Parameters<typeof trackQuizComplete>[0]['result'],
      retreatCount: retreatCount(),
      answeredCount: mainProgress(),
      mainTotal: mainTotal(),
      answers: path()
        .filter((q) => q.dimension !== 'META')
        .flatMap((q) => {
          const optionIndex = answers()[q.id]
          return optionIndex === undefined
            ? []
            : [{ questionId: q.id, optionIndex }]
        }),
    })
    void navigate(`/result/${encoded}`)
  }

  onMount(() => {
    trackPageView('quiz')
    beginQuizRun(status())
  })

  createEffect(() => {
    beginQuizRun(status())
    trackQuizProgress(
      mainTotal() === 0 ? 0 : Math.round((mainProgress() / mainTotal()) * 100),
      {
        relationshipStatus: status(),
        mainProgress: mainProgress(),
        mainTotal: mainTotal(),
      },
    )
  })

  return (
    <QuizPage
      // v3 Question 与 v2 Question 为 duck-compatible（同 dimension/text/options/variants 字段），
      // QuizPage 运行时仅读取 dimension !== 'META' + resolver，跨版本安全。
      path={path() as unknown as Question[]}
      mainTotal={mainTotal()}
      mainProgress={mainProgress()}
      metaAnswered={metaAnswered()}
      answers={answers()}
      onSelect={selectOption}
      onSubmit={submitQuiz}
      canSubmit={canSubmit()}
    />
  )
}
