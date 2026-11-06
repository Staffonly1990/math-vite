import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { motion } from 'motion/react';
import { wallRecordsStore } from '@/stores/wallRecords';
import { startWallRun } from '@/stores/wallSession';
import { texts } from './texts';
import { styles } from './styles';

export function MenuScreen() {
  const navigate = useNavigate();
  const best = useSelector(wallRecordsStore, (s) => s.best);

  const start = () => {
    startWallRun();
    void navigate({ to: '/game' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.root}>
      <div className={styles.panel}>
        <h1 className={styles.title}>MATH</h1>
        <p className={styles.subtitle}>{texts.subtitle}</p>
        <p className={styles.best}>{best !== null ? texts.best(best) : texts.noBest}</p>
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={start} className={styles.startButton}>
          {texts.startButton}
        </motion.button>
      </div>
    </motion.div>
  );
}
