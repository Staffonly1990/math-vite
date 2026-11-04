import { useSelector } from '@tanstack/react-store';
import { sessionStore } from '@/stores/session';
import { settingsStore } from '@/stores/settings';
import { getDifficulty } from '@/game/difficulty';
import { texts } from './texts';
import { styles } from './styles';

export function HUD() {
  const aden = useSelector(sessionStore, (s) => s.game.aden);
  const index = useSelector(sessionStore, (s) => s.game.index);
  const streak = useSelector(sessionStore, (s) => s.game.stats.streak);
  const difficulty = useSelector(settingsStore, (s) => s.difficulty);

  return (
    <div className={styles.root}>
      <span className={styles.adenBadge}>{texts.aden(aden)}</span>
      <span className={styles.difficulty}>{getDifficulty(difficulty).label.toLowerCase()}</span>
      <span className={styles.counters}>
        <span>{texts.streak(streak)}</span>
        <span>{texts.problemNumber(index + 1)}</span>
      </span>
    </div>
  );
}
