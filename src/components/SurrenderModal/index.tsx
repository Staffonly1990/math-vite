import { AnimatePresence, motion } from 'motion/react';
import { texts } from './texts';
import { styles } from './styles';

interface SurrenderModalProps {
  open: boolean;
  /** Сбежать — завершить забег (SOE из башни) */
  onEscape: () => void;
  /** Остаться и терпеть */
  onStay: () => void;
}

export function SurrenderModal({ open, onEscape, onStay }: SurrenderModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={styles.card}
            role="dialog"
            aria-label={texts.title}
          >
            <h2 className={styles.title}>{texts.title}</h2>
            <p className={styles.body}>{texts.body}</p>
            <div className={styles.actions}>
              <button type="button" onClick={onStay} className={styles.stay}>
                {texts.stay}
              </button>
              <button type="button" onClick={onEscape} className={styles.escape}>
                {texts.escape}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
