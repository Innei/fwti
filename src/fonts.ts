/**
 * v2 字体加载。走 fontsource npm 包，不走 Google Fonts CDN。
 *
 * - Archivo Black: display 字（仅 400 一档，字体本身即 "Black"）
 * - Inter variable: body / UI（variable font，支持 100-900 全段）
 * - JetBrains Mono variable: mono · 代码 · meta
 * - Noto Sans SC: CJK fallback。仅加载 chinese-simplified 子集 + 所需 weight，控体积
 */

import '@fontsource/archivo-black/400.css'

import '@fontsource-variable/inter'

import '@fontsource-variable/jetbrains-mono'

import '@fontsource/noto-sans-sc/chinese-simplified-400.css'
import '@fontsource/noto-sans-sc/chinese-simplified-500.css'
import '@fontsource/noto-sans-sc/chinese-simplified-700.css'
import '@fontsource/noto-sans-sc/chinese-simplified-900.css'
