export const styles = {
  /** сцена на фоне: бойцы прижаты к низу сцены — рядом с зоной внимания */
  root: 'relative flex min-h-0 w-full flex-1 items-end justify-between gap-2 px-2',
  rootSolo: 'justify-center',
  doorWrap: 'pointer-events-none absolute inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center',
  side: 'relative z-10 flex flex-col items-center gap-1',
  /** пачка по-геройски: одна полноразмерная фигура цели + число мобов над головой */
  pack: 'relative z-10 flex flex-col items-center gap-0.5',
  targetInfo: 'flex flex-col items-center gap-0.5',
  monsterWrap: 'relative',
  stackBadge:
    'absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded border border-amber-300/80 bg-[#1a1206] px-1.5 text-xs font-bold tabular-nums text-amber-200 shadow-[0_1px_4px_rgba(0,0,0,0.8)]',
  monster: 'flex flex-col items-center gap-1 opacity-50',
  monsterActive: 'flex flex-col items-center gap-1 opacity-100',
  name: 'font-display text-sm font-bold text-text [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]',
  poisonous: 'text-lime-400',
  target: 'text-[10px] font-semibold text-accent [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]',
  meta: 'text-[10px] text-muted tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]',
  pips: 'flex gap-1',
  pipPlayer: 'h-2 w-2 rounded-full border border-danger/70 bg-danger shadow-[0_0_6px_rgba(0,0,0,0.6)]',
  pipPlayerDead: 'h-2 w-2 rounded-full border border-line bg-surface-2',
  pipMonster: 'h-2 w-2 rounded-full border border-amber-400/70 bg-amber-400 shadow-[0_0_6px_rgba(0,0,0,0.6)]',
  pipMonsterDead: 'h-2 w-2 rounded-full border border-line bg-surface-2',
  vs: 'font-display text-xl font-black text-muted/80 select-none [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]',
} as const;
