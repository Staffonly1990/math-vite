import { useSelector } from '@tanstack/react-store';
import { sessionStore, dispatch } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

/**
 * Этаж-сокровищница: ОДИН выбор — любой сундук (может оказаться ловушкой с ядом)
 * или «Пропустить». Любое нажатие немедленно уводит на следующий этаж.
 */
export function ChestsPanel() {
  const chestsOpened = useSelector(sessionStore, (s) => s.game.chestsOpened);
  const chestCount = chestsOpened.length;

  return (
    <div className={styles.root}>
      <div className={styles.title}>{texts.title}</div>
      <p className={styles.hint}>{texts.hint}</p>
      <div className={styles.chests}>
        {Array.from({ length: chestCount }, (_, i) => (
          <button
            key={i}
            type="button"
            className={styles.chest}
            onClick={() => dispatch({ type: 'RUN/OPEN_CHEST', chestIndex: i, at: Date.now() })}
          >
            🧰 {texts.chest(i + 1)}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.skip}
        onClick={() => dispatch({ type: 'RUN/SKIP_CHESTS', at: Date.now() })}
      >
        {texts.skip}
      </button>
    </div>
  );
}
