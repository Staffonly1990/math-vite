/**
 * Портретная трасса: HUD в две строки сверху, под ним очередь «далее».
 * Цвет уровня приходит CSS-переменными (--lc, --lc-dim, --lc-faint) с корня экрана.
 * Адены — всегда золото (валюта), зона ×2 красится в levelColors.
 */
export const styles = {
  /** весь экран = игра, HUD поверх SVG */
  root: 'relative h-dvh w-full overflow-hidden bg-[#05070d]',
  field: 'absolute inset-0',
  /** шапка — одна строка: ур+пик слева, Меню справа */
  hud: 'absolute top-0 left-0 right-0 z-20 px-3 py-2 text-xs',
  hudStatRow: 'flex items-center justify-between',
  hudStatLeft: 'flex items-center gap-1',
  levelBadge: 'rounded-full border border-(--lc-dim) px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-(--lc)',
  peakBadge: 'rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted',
  surrenderBtn: 'rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-muted backdrop-blur-sm transition-[filter] select-none hover:brightness-150',
  /** СЧЁТ — центр игровой зоны, своя линия внизу трассы */
  scorePop: '[transform-box:fill-box] [transform-origin:center] [animation:wr-score-pop_.5s_ease-out,wr-score-green_.8s_ease-out]',
  scoreShake: '[transform-box:fill-box] [transform-origin:center] [animation:wr-score-shake_.5s_ease,wr-score-red_.9s_ease-out]',
  scoreDeny: '[transform-box:fill-box] [transform-origin:center] [animation:wr-score-deny_.4s_ease-out]',
  /** ГО — большие жёлтые вскрики с трибун по бокам счёта */
  goCheerLeft: '[transform-box:fill-box] [transform-origin:center] [animation:wr-go-cheer-left_1s_ease-in-out_infinite]',
  goCheerRight: '[transform-box:fill-box] [transform-origin:center] [animation:wr-go-cheer-right_1s_ease-in-out_infinite_.5s]',
  /** дельта-стрелки у числа */
  deltaUp: '[animation:wr-delta-up_1s_ease-out_forwards]',
  deltaDown: '[animation:wr-delta-down_1s_ease-out_forwards]',
  /** левел-ап: мир перекрасился, вспышка цвета нового уровня (без паузы, с кулдауном) */
  levelFlash: 'pointer-events-none absolute inset-0 z-35 flex items-center justify-center',
  levelFlashText: 'font-display text-5xl font-black tracking-widest',
} as const;
