export const styles = {
  root: 'flex flex-col gap-1.5',
  row: 'flex items-center gap-3',
  hp: 'text-sm font-semibold text-danger',
  hpFull: 'text-sm font-semibold text-success',
  shield: 'text-sm font-semibold text-text',
  lavaWrap: 'flex flex-1 items-center gap-2',
  lavaBar: 'h-2 flex-1 overflow-hidden rounded-full bg-surface-2',
  lavaFill: 'h-full rounded-full bg-linear-to-r from-accent-strong to-accent transition-[width] duration-500',
  lavaFillLow: 'h-full rounded-full bg-danger transition-[width] duration-500',
  lavaSeconds: 'w-16 text-right text-xs tabular-nums text-muted',
  /** локальная шкала: зелёный яд вытесняет точку отсчёта слева, голубое — время на ответ */
  answerBar: 'relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2',
  poisonFill: 'absolute inset-y-0 left-0 bg-lime-500/80',
  answerFill: 'absolute inset-y-0 bg-linear-to-r from-cyan-300 to-cyan-100',
  answerFillLow: 'absolute inset-y-0 bg-danger',
  answerRow: 'flex items-center gap-2',
  answerSeconds: 'w-8 text-right text-xs tabular-nums text-muted',
} as const;
