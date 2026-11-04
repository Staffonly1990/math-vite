import { useSelector } from '@tanstack/react-store';
import { sessionStore } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

/**
 * Боевая строка над шкалами: цель, её HP и размер пачки — прямо у зоны внимания
 * (принцип «информация там, где действие»). Сцену смотреть необязательно.
 */
export function BattleLine() {
  const target = useSelector(sessionStore, (s) => s.game.activeMonster);
  const packCount = useSelector(
    sessionStore,
    (s) => s.game.floor?.monsters.filter((monster) => !monster.isDead).length ?? 0,
  );

  if (!target) return null;

  return (
    <div className={styles.root} aria-label="цель">
      <span className={styles.name}>
        ⚔ {target.name}
        {target.poisonous && <span className={styles.poisonous}> {texts.poisoned}</span>}
      </span>
      <span className={styles.pips}>{texts.pips(target.hp, target.maxHp)}</span>
      {packCount > 1 && <span className={styles.count}>{texts.count(packCount)}</span>}
    </div>
  );
}
