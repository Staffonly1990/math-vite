import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useSelector } from '@tanstack/react-store';
import { HUD } from '@/components/HUD';
import { ProblemCard } from '@/components/ProblemCard';
import { AnswerOptions } from '@/components/AnswerOptions';
import { AnswerInput } from '@/components/AnswerInput';
import { SurrenderModal } from '@/components/SurrenderModal';
import { dispatch, sessionStore, startRun } from '@/stores/session';
import { settingsStore } from '@/stores/settings';
import { texts } from './texts';
import { styles } from './styles';

export function GameScreen() {
  const navigate = useNavigate();
  const status = useSelector(sessionStore, (s) => s.game.status);
  const problem = useSelector(sessionStore, (s) => s.game.problem);
  const index = useSelector(sessionStore, (s) => s.game.index);
  const lastAnswer = useSelector(sessionStore, (s) => s.game.lastAnswer);
  const inputMode = useSelector(settingsStore, (s) => s.inputMode);
  const [picked, setPicked] = useState<number | null>(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);

  // прямой заход на /game с пустой сессией (например, F5) — стартуем на месте
  useEffect(() => {
    if (sessionStore.state.game.status === 'idle') startRun();
  }, []);

  useEffect(() => {
    setPicked(null);
  }, [index]);

  // после ошибки показываем верный ответ и уводим на экран итогов
  useEffect(() => {
    if (status !== 'gameover') return;
    const timer = setTimeout(() => void navigate({ to: '/gameover' }), 1500);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  if (!problem) return null;

  const locked = status === 'gameover';
  // подсветка ошибки — только когда конец пришёл из-за неверного ответа, не из-за бегства
  const wrong = locked && lastAnswer === 'wrong';

  const onAnswer = (value: number) => {
    if (sessionStore.state.game.status !== 'running') return;
    setPicked(value);
    dispatch({ type: 'PROBLEM/ANSWER', value, at: Date.now() });
  };

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <div className={styles.hud}>
          <HUD />
        </div>
        <button type="button" className={styles.surrenderButton} onClick={() => setSurrenderOpen(true)}>
          {texts.surrenderButton}
        </button>
      </div>
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.18 }}
          >
            <ProblemCard problem={problem} wrong={wrong} />
          </motion.div>
        </AnimatePresence>

        {inputMode === 'choice' ? (
          <AnswerOptions problem={problem} locked={locked} picked={picked} onAnswer={onAnswer} />
        ) : (
          <AnswerInput locked={locked} onAnswer={onAnswer} />
        )}

        {wrong && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrongAnswer}>
            {texts.correctAnswerIs(problem.answer)}
          </motion.p>
        )}
      </div>

      <SurrenderModal
        open={surrenderOpen && !locked}
        onStay={() => setSurrenderOpen(false)}
        onEscape={() => {
          setSurrenderOpen(false);
          dispatch({ type: 'RUN/SURRENDER', at: Date.now() });
        }}
      />
    </div>
  );
}
