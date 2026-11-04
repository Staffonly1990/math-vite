import { motion } from 'motion/react';
import type { Problem } from '@/game/problem/Problem';
import { cn } from '@/lib/cn';
import { styles } from './styles';

interface AnswerOptionsProps {
  problem: Problem;
  /** после ответа кнопки блокируются */
  locked: boolean;
  /** выбранный пользователем вариант */
  picked: number | null;
  onAnswer: (value: number) => void;
}

export function AnswerOptions({ problem, locked, picked, onAnswer }: AnswerOptionsProps) {
  return (
    <div className={styles.grid}>
      {problem.options.map((option) => {
        const revealCorrect = locked && option === problem.answer;
        const revealWrong = locked && picked === option && option !== problem.answer;
        return (
          <motion.button
            key={option}
            type="button"
            disabled={locked}
            whileTap={!locked ? { scale: 0.96 } : undefined}
            onClick={() => onAnswer(option)}
            className={cn(
              styles.option,
              !locked && styles.optionIdle,
              revealCorrect && styles.optionCorrect,
              revealWrong && styles.optionWrong,
            )}
          >
            {option}
          </motion.button>
        );
      })}
    </div>
  );
}
