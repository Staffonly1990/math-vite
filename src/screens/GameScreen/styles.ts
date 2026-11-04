export const styles = {
  root: 'flex min-h-dvh flex-col gap-6 py-5',
  topRow: 'flex items-start gap-3',
  hud: 'flex-1',
  surrenderButton:
    'rounded-xl border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-danger/50 hover:text-danger select-none touch-manipulation',
  content: 'mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6',
  wrongAnswer: 'text-center font-semibold text-danger',
} as const;
