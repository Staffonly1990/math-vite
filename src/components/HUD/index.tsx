import { useSelector } from '@tanstack/react-store';
import { sessionStore } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

/** Верхняя строка статов: адена, этаж, уровень сложности, серия */
export function HUD() {
  const aden = useSelector(sessionStore, (s) => s.game.aden);
  const floorNumber = useSelector(sessionStore, (s) => s.game.floorNumber);
  const levelNumber = useSelector(sessionStore, (s) => s.game.level.number);
  const streak = useSelector(sessionStore, (s) => s.game.stats.streak);

  return (
    <div className={styles.root}>
      <span className={styles.adenBadge}>{texts.aden(aden)}</span>
      <span className={styles.floor}>{texts.floor(floorNumber)}</span>
      <span className={styles.level}>{texts.level(levelNumber)}</span>
      <span className={styles.counters}>{texts.streak(streak)}</span>
    </div>
  );
}
