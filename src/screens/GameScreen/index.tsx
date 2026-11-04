import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useSelector } from '@tanstack/react-store';
import { HUD } from '@/components/HUD';
import { Scales } from '@/components/Scales';
import { ProblemCard } from '@/components/ProblemCard';
import { AnswerOptions } from '@/components/AnswerOptions';
import { AnswerInput } from '@/components/AnswerInput';
import { StageScene } from '@/components/StageScene';
import { BattleLine } from '@/components/BattleLine';
import { ItemBar } from '@/components/ItemBar';
import { ChestsPanel } from '@/components/ChestsPanel';
import { SurrenderModal } from '@/components/SurrenderModal';
import { dispatch, sessionStore, startRun } from '@/stores/session';
import { settingsStore } from '@/stores/settings';
import { texts } from './texts';
import { styles } from './styles';

/** Тик лавы — раз в секунду, wall-clock: пауз не бывает никогда (даже свёрнутая вкладка) */
function useLavaTicker(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => dispatch({ type: 'RUN/TICK', at: Date.now() }), 1000);
    return () => clearInterval(timer);
  }, [active]);
}

/**
 * Экран башни, сверху вниз: статы → предметы → воины (на фоне) →
 * шкалы → пример → варианты ответа, прижатые к низу. Без скролла.
 */
export function GameScreen() {
  const navigate = useNavigate();
  const status = useSelector(sessionStore, (s) => s.game.status);
  const problem = useSelector(sessionStore, (s) => s.game.problem);
  const index = useSelector(sessionStore, (s) => s.game.index);
  const lastAnswer = useSelector(sessionStore, (s) => s.game.lastAnswer);
  const floorKind = useSelector(sessionStore, (s) => s.game.floor?.kind ?? 'challenge');
  const aliveMonsters = useSelector(
    sessionStore,
    (s) => s.game.floor?.monsters.filter((monster) => !monster.isDead) ?? [],
  );
  const frozenUntilMs = useSelector(sessionStore, (s) => s.game.frozenUntilMs);
  const inputMode = useSelector(settingsStore, (s) => s.inputMode);
  const [picked, setPicked] = useState<number | null>(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);

  // часы для оверлея заморозки
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [status]);
  const frozenLeft = Math.max(0, frozenUntilMs - now);

  useLavaTicker(status === 'running');

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

  const locked = status === 'gameover';
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

      <div className={styles.itemsRow}>
        <ItemBar />
      </div>

      <div className={styles.center}>
        {floorKind === 'treasure' ? (
          <div className={styles.treasureWrap}>
            <StageScene monsters={[]} />
            <ChestsPanel />
          </div>
        ) : (
          <StageScene monsters={floorKind === 'combat' ? aliveMonsters : []} />
        )}
      </div>

      <div className={styles.bottom}>
        <BattleLine />
        <Scales />

        {floorKind !== 'treasure' && problem && (
          <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15 }}
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
            </>
          )}
      </div>

      {frozenLeft > 0 && (
        <div className={styles.freezeOverlay}>
          <div className={styles.freezeLabel}>{texts.frozen(Math.ceil(frozenLeft / 1000))}</div>
        </div>
      )}

      {/* удар по игроку в бою: периферийная красная вспышка — видно боковым зрением */}
      {status === 'running' && lastAnswer === 'wrong' && (
        <motion.div
          key={`hit-${index}`}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.hitFlash}
          aria-hidden="true"
        />
      )}

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
