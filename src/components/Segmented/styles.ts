export const styles = {
  root: 'flex gap-2',
  option: 'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all select-none',
  optionActive: 'border-accent/70 bg-accent/15 text-accent shadow-[0_0_18px_rgba(255,138,61,0.15)]',
  optionIdle: 'border-line bg-surface-2/60 text-muted hover:text-text',
} as const;
