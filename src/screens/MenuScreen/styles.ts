export const styles = {
  root: 'relative z-10 flex flex-col items-center gap-10 py-10',
  title:
    'bg-linear-to-r from-accent via-amber-300 to-accent bg-clip-text font-display text-6xl font-black tracking-tight text-transparent [text-shadow:0_2px_18px_rgba(0,0,0,0.8)]',
  subtitle: 'mt-2 text-muted [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]',
  section: 'l2-panel w-full max-w-md space-y-5 p-4',
  sectionTitle: 'text-xs font-semibold tracking-wider text-muted uppercase',
  hint: 'text-xs text-muted',
  startButton:
    'l2-button-lg font-display text-xl font-bold text-text transition-[filter] select-none touch-manipulation hover:brightness-125',
  rules: 'max-w-sm text-center text-xs leading-relaxed text-muted [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]',
} as const;
