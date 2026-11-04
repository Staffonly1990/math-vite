import { motion } from 'motion/react';
import type { Problem } from '@/game/problem/Problem';
import { cn } from '@/lib/cn';
import { texts } from './texts';
import { styles } from './styles';

interface ProblemCardProps {
  problem: Problem;
  /** подсветка ошибки: трясётся и краснеет */
  wrong: boolean;
}

export function ProblemCard({ problem, wrong }: ProblemCardProps) {
  return (
    <motion.div
      animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(styles.card, wrong ? styles.cardWrong : styles.cardNormal)}
    >
      <div className={styles.prompt}>{problem.prompt}</div>
      <div className={styles.equals}>{texts.equals}</div>
    </motion.div>
  );
}
