export const styles = {
  root: 'flex h-dvh w-full flex-col items-center justify-center gap-6 bg-[#05070d] p-4',
  title:
    'bg-linear-to-r from-accent via-amber-300 to-accent bg-clip-text font-display text-5xl font-black tracking-tight text-transparent',
  subtitle: 'mt-1 text-muted',
  section: 'l2-panel w-full max-w-sm space-y-4 p-4',
  sectionTitle: 'text-xs font-semibold tracking-wider text-muted uppercase',
  hint: 'text-xs text-muted',
  startButton:
    'l2-button-lg font-display text-xl font-bold text-text transition-[filter] select-none touch-manipulation hover:brightness-125',
  rules: 'max-w-sm text-center text-xs leading-relaxed text-muted',
} as const;
