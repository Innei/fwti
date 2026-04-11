import { For } from 'solid-js';
import { ArrowRight } from 'lucide-solid';
import { personalities } from '../copy/personalities';
import { homePageCopy } from '../copy/ui';
import {
  FAMILY_THEMES,
  getFamilyTheme,
  PREVIEW_HIDDEN_PERSONALITY_CODE,
  PREVIEW_LEGEND_HIDDEN_ORDER,
  PREVIEW_LEGEND_QUADRANT_ORDER,
} from '../logic/family';
import Portrait from './Portrait';
import { TopNav } from './Nav';
import { setPreviewDetail } from '../state';

/** 首页卡片网格中需要隐藏的隐藏人格代号（测试触发才显现）。 */
const HIDDEN_CODES_EXCLUDED_FROM_PREVIEW = new Set([
  'ALL',
  'RAT',
  'PURE',
  'MAD',
  'E-DOG',
  'CHAOS',
  'CPU',
  'BENCH',
  'JOKER',
  'VOID',
  'LIMBO',
]);

function Tip(props: { title: string; desc: string }) {
  return (
    <div class="tip-card">
      <div class="tip-title">{props.title}</div>
      <div class="tip-desc">{props.desc}</div>
    </div>
  );
}

export function HomePage(props: { onStart: () => void }) {
  return (
    <div class="page home-page">
      <TopNav meta={homePageCopy.topMeta} />

      <section class="home-hero">
        <div class="home-hero-inner">
          <div class="eyebrow eyebrow-on-green">{homePageCopy.heroEyebrow}</div>
          <h1 class="home-title">
            {homePageCopy.heroTitleLine1}
            <br />
            {homePageCopy.heroTitleLine2}
          </h1>
          <p class="home-subtitle">{homePageCopy.heroSubtitle}</p>
          <p class="home-lede">
            {homePageCopy.heroLedeLine1}
            <br />
            {homePageCopy.heroLedeLine2}
          </p>
          <div class="home-actions">
            <button class="btn btn-white" onClick={props.onStart}>
              <span>{homePageCopy.startButton}</span>
              <span class="btn-arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </button>
            <span class="home-time">{homePageCopy.duration}</span>
          </div>
        </div>
        <div class="home-hero-shape" aria-hidden="true" />
      </section>

      <section class="home-tips">
        <For each={homePageCopy.tips}>
          {(tip) => <Tip title={tip.title} desc={tip.desc} />}
        </For>
      </section>

      <section class="home-preview">
        <div class="preview-head">
          <div class="preview-eyebrow">{homePageCopy.preview.eyebrow}</div>
          <h2 class="preview-title">{homePageCopy.preview.title}</h2>
          <p class="preview-hint">{homePageCopy.preview.hint}</p>
        </div>
        <div class="preview-grid">
          <For
            each={Object.values(personalities).filter(
              (p) => !HIDDEN_CODES_EXCLUDED_FROM_PREVIEW.has(p.code),
            )}
          >
            {(p) => {
              const theme = getFamilyTheme(p.code);
              return (
                <button
                  type="button"
                  class="preview-tile"
                  style={{
                    '--tile-color': theme.color,
                    '--tile-tint': theme.tint,
                  }}
                  onClick={() => setPreviewDetail(p)}
                  aria-label={homePageCopy.preview.tileAria(p.name, p.code)}
                >
                  <Portrait
                    code={p.code}
                    size={200}
                    class="preview-tile-portrait"
                  />
                  <div class="preview-tile-meta">
                    <span class="preview-tile-code">{p.code}</span>
                    <span class="preview-tile-eng">{p.engName}</span>
                  </div>
                  <div class="preview-tile-name">{p.name}</div>
                  <div class="preview-tile-tagline">「{p.tagline}」</div>
                </button>
              );
            }}
          </For>
        </div>
        <div class="preview-legend">
          <div class="preview-legend-block">
            <div class="preview-legend-block-head">
              <span class="preview-legend-kicker">{homePageCopy.preview.quadrantsKicker}</span>
              <span class="preview-legend-note">{homePageCopy.preview.quadrantsNote}</span>
            </div>
            <div class="preview-legend-row preview-legend-row--quadrants">
              <For each={PREVIEW_LEGEND_QUADRANT_ORDER}>
                {(key) => {
                  const f = FAMILY_THEMES[key];
                  return (
                    <div class="legend-item">
                      <span class="legend-dot" style={{ background: f.color }} aria-hidden="true" />
                      <span class="legend-label">{f.name}</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
          <div class="preview-legend-block preview-legend-block--hidden">
            <div class="preview-legend-block-head">
              <span class="preview-legend-kicker">{homePageCopy.preview.hiddenKicker}</span>
              <span class="preview-legend-note">{homePageCopy.preview.hiddenNote}</span>
            </div>
            <div class="preview-legend-row preview-legend-row--chips">
              <For each={PREVIEW_LEGEND_HIDDEN_ORDER}>
                {(key) => {
                  const f = FAMILY_THEMES[key];
                  const code = PREVIEW_HIDDEN_PERSONALITY_CODE[key];
                  const p = personalities[code];
                  return (
                    <button
                      type="button"
                      class="legend-chip"
                      onClick={() => setPreviewDetail(p)}
                      aria-label={homePageCopy.preview.tileAria(p.name, p.code)}
                    >
                      <span class="legend-chip-emoji" aria-hidden="true">
                        {p.emoji}
                      </span>
                      <span class="legend-chip-label">{f.name}</span>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </section>

      <footer class="home-footer">
        <p class="home-disclaimer">
          {homePageCopy.footerDisclaimerLine1}
          <br class="mobile-only" />
          {homePageCopy.footerDisclaimerLine2}
        </p>
      </footer>
    </div>
  );
}
