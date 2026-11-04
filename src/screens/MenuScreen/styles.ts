export const styles = {
  root: 'flex flex-col items-center gap-10 py-10',
  title:
    'bg-linear-to-r from-accent via-amber-300 to-accent bg-clip-text font-display text-6xl font-black tracking-tight text-transparent',
  subtitle: 'mt-2 text-muted',
  section: 'w-full max-w-md space-y-5',
  sectionTitle: 'text-xs font-semibold tracking-wider text-muted uppercase',
  hint: 'text-xs text-muted',
  startButton:
    'rounded-2xl bg-linear-to-r from-accent-strong to-accent px-12 py-4 font-display text-xl font-bold text-on-accent shadow-[0_0_40px_rgba(249,93,29,0.3)] transition-shadow hover:shadow-[0_0_60px_rgba(249,93,29,0.45)]',
  rules: 'max-w-sm text-center text-xs leading-relaxed text-muted',
} as const;
