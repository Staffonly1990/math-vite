export const styles = {
  root: 'flex items-center gap-3',
  input:
    'w-full rounded-2xl border border-line bg-surface-2 px-5 py-5 text-center font-display text-3xl font-semibold tabular-nums text-text placeholder:text-muted/50 focus:border-accent/70 focus:outline-none disabled:opacity-60',
  submit:
    'rounded-2xl bg-accent px-7 py-5 font-display text-xl font-bold text-on-accent transition-all select-none touch-manipulation hover:bg-accent-strong disabled:opacity-50',
} as const;
