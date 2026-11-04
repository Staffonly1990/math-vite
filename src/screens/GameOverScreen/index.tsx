import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { motion } from 'motion/react';
import { sessionStore, startRun } from '@/stores/session';
import { settingsStore } from '@/stores/settings';
import { getDifficulty } from '@/game/difficulty';
import { formatDuration } from '@/lib/format';
import { Stat } from '@/components/Stat';
import { texts } from './texts';
import { styles } from './styles';

export function GameOverScreen() {
  const navigate = useNavigate();
  const aden = useSelector(sessionStore, (s) => s.game.aden);
  const stats = useSelector(sessionStore, (s) => s.game.stats);
  const startedAt = useSelector(sessionStore, (s) => s.game.startedAt);
  const endedAt = useSelector(sessionStore, (s) => s.game.endedAt);
  const endReason = useSelector(sessionStore, (s) => s.game.endReason);
  const difficulty = useSelector(settingsStore, (s) => s.difficulty);

  const surrendered = endReason === 'surrender';
  const title = surrendered ? texts.titleSurrender : texts.titleWrong;
  const adenEarned = surrendered ? texts.adenEarnedSurrender : texts.adenEarnedWrong;

  const restart = () => {
    startRun();
    void navigate({ to: '/game' });
  };

  const duration = startedAt !== null && endedAt !== null ? formatDuration(endedAt - startedAt) : texts.noTime;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={styles.root}>
      <p className={styles.title}>{title}</p>

      <div className="text-center">
        <div className={styles.adenValue}>{aden}</div>
        <div className={styles.adenLabel}>{adenEarned}</div>
      </div>

      <div className={styles.statsGrid}>
        <Stat label={texts.solved} value={String(stats.correct)} />
        <Stat label={texts.bestStreak} value={texts.streakMark(stats.bestStreak)} />
        <Stat label={texts.time} value={duration} />
      </div>

      <p className={styles.difficultyNote}>{texts.difficulty(getDifficulty(difficulty).label.toLowerCase())}</p>

      <div className={styles.actions}>
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={restart} className={styles.restartButton}>
          {texts.restart}
        </motion.button>
        <button type="button" onClick={() => void navigate({ to: '/' })} className={styles.menuButton}>
          {texts.toMenu}
        </button>
      </div>
    </motion.div>
  );
}
