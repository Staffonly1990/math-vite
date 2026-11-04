import { useSelector } from '@tanstack/react-store';
import { sessionStore, dispatch } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

interface Stack {
  title: string;
  icon: string;
  indexes: number[];
}

/** Инвентарь: тап по иконке — использовать предмет (мобильный уклон, без хоткеев) */
export function ItemBar() {
  const items = useSelector(sessionStore, (s) => s.game.items);

  // сгруппировать одинаковые предметы: иконка + счётчик
  const stacks: Stack[] = [];
  items.forEach((item, index) => {
    const existing = stacks.find((stack) => stack.title === item.title);
    if (existing) {
      existing.indexes.push(index);
    } else {
      stacks.push({ title: item.title, icon: item.icon, indexes: [index] });
    }
  });

  if (stacks.length === 0) return null;

  return (
    <div className={styles.root}>
      {stacks.map((stack) => (
        <button
          key={stack.title}
          type="button"
          className={styles.item}
          aria-label={texts.useItem(stack.title)}
          onClick={() => dispatch({ type: 'RUN/USE_ITEM', itemIndex: stack.indexes[0]!, at: Date.now() })}
        >
          <span className={styles.icon} aria-hidden="true">
            {stack.icon}
          </span>
          {stack.indexes.length > 1 && <span className={styles.count}>×{stack.indexes.length}</span>}
        </button>
      ))}
    </div>
  );
}
