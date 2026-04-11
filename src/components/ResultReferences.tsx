import { For } from 'solid-js';
import { resultReferencesCopy } from '../copy/references';

/**
 * 学术依据 + 免责声明板块。从 ResultPage 中拆出以满足组件行数上限。
 * 纯静态 JSX，无 props，依赖也仅限 solid。
 */
export function ResultReferences() {
  return (
    <section class="result-refs">
      <div class="section-eyebrow">{resultReferencesCopy.eyebrow}</div>
      <h2 class="section-title">{resultReferencesCopy.title}</h2>
      <p class="refs-intro">{resultReferencesCopy.intro}</p>

      <For each={resultReferencesCopy.groups}>
        {(group) => (
          <div class="refs-group">
            <h3 class="refs-group-title">
              {group.title}
              {group.map ? <span class="refs-group-map">{group.map}</span> : null}
            </h3>
            <ul class="refs-list">
              <For each={group.items}>{(item) => <li>{item}</li>}</For>
            </ul>
          </div>
        )}
      </For>

      <div class="refs-disclaimer">
        <For each={resultReferencesCopy.disclaimer}>{(item) => <p>{item}</p>}</For>
      </div>
    </section>
  );
}
