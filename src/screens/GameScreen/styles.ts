export const styles = {
  /** экран строго 100dvh × 100vw, без скролла */
  root: 'flex h-dvh w-full flex-col gap-2 overflow-hidden p-2 sm:p-3',
  topRow: 'flex items-center gap-2',
  hud: 'flex-1',
  surrenderButton:
    'l2-button px-2.5 py-1 text-[11px] font-medium text-muted transition-[filter] select-none touch-manipulation hover:brightness-110',
  itemsRow: 'flex min-h-0 shrink-0 justify-center',
  center: 'flex min-h-0 flex-1 items-end justify-center pb-1',
  treasureWrap: 'flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3',
  bottom: 'mx-auto flex w-full max-w-lg shrink-0 flex-col gap-2',
  freezeOverlay: 'pointer-events-none fixed inset-0 z-40 bg-[rgba(96,200,235,0.12)] backdrop-brightness-105',
  freezeLabel:
    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-2xl font-black text-cyan-200 [text-shadow:0_0_24px_rgba(96,200,235,0.8)]',
  wrongAnswer: 'text-center text-sm font-semibold text-danger',
  /** периферийная вспышка урона по игроку: замечается боковым зрением */
  hitFlash: 'pointer-events-none fixed inset-0 z-30 [box-shadow:inset_0_0_90px_rgba(244,67,107,0.55)]',
} as const;
