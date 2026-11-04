import { useEffect, useRef, useState } from 'react';
import { useSelector } from '@tanstack/react-store';
import { LAVA_MAX_MS } from '@/game/entities/Game';
import { dispatch, sessionStore } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

/**
 * Шкалы (выше примера и вариантов): HP/щит + лава, в бою — локальное время.
 * Яд показан зелёной полосой В НАЧАЛЕ локальной шкалы (вытесняет точку отсчёта)
 * и не может занять больше шкалы, чем само локальное время (кап по лимиту).
 * Таймер живёт здесь: локальные часы 200 мс, таймаут отправляет в ядро.
 */
export function Scales() {
  const status = useSelector(sessionStore, (s) => s.game.status);
  const floorKind = useSelector(sessionStore, (s) => s.game.floor?.kind ?? 'challenge');
  const floorCleared = useSelector(sessionStore, (s) => s.game.floor?.isCleared ?? false);
  const hp = useSelector(sessionStore, (s) => s.game.player.hp);
  const shield = useSelector(sessionStore, (s) => s.game.player.shield);
  const poisonStacks = useSelector(sessionStore, (s) => s.game.player.poison?.stacks ?? 0);
  const lavaReserveMs = useSelector(sessionStore, (s) => s.game.lavaReserveMs);
  const answerLimitMs = useSelector(sessionStore, (s) => s.game.answerTimeLimitMs);
  const frozenUntilMs = useSelector(sessionStore, (s) => s.game.frozenUntilMs);
  const rawLimitMs = useSelector(
    sessionStore,
    (s) => (s.game.floor?.kind === 'combat' && !s.game.floor.isCleared ? s.game.floor.params.timeLimitMs ?? 0 : 0),
  );

  const combat = floorKind === 'combat' && !floorCleared;
  const [now, setNow] = useState(() => Date.now());
  const timeoutFired = useRef(false);
  useEffect(() => {
    if (status !== 'running' || !combat) return;
    timeoutFired.current = false;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [status, combat]);

  const frozenLeft = Math.max(0, frozenUntilMs - now);
  const answerLeftMs = combat
    ? Math.max(0, answerLimitMs - sessionStore.state.game.answerElapsedMs(now))
    : 0;

  useEffect(() => {
    if (status !== 'running' || !combat || frozenLeft > 0 || answerLimitMs === 0) return;
    if (answerLeftMs <= 0 && !timeoutFired.current) {
      timeoutFired.current = true;
      dispatch({ type: 'RUN/FLOOR_TIMEOUT', at: Date.now() });
    }
  }, [status, combat, frozenLeft, answerLimitMs, answerLeftMs]);

  const lavaRatio = Math.max(0, Math.min(1, lavaReserveMs / LAVA_MAX_MS));
  const low = lavaReserveMs < 3_000;

  // зелёный яд: не больше самой шкалы локального времени
  const poisonMs = combat ? Math.min(poisonStacks * 1000, rawLimitMs) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <span className={hp <= 1 ? styles.hp : styles.hpFull}>{texts.hp(hp)}</span>
        {shield > 0 && <span className={styles.shield}>{texts.shield(shield)}</span>}
        <div className={styles.lavaWrap}>
          <div className={styles.lavaBar} role="meter" aria-label={texts.lavaLabel}>
            <div
              className={low ? styles.lavaFillLow : styles.lavaFill}
              style={{ width: `${lavaRatio * 100}%` }}
            />
          </div>
          <span className={styles.lavaSeconds}>{texts.lava(Math.ceil(lavaReserveMs / 1000))}</span>
        </div>
      </div>

      {combat && rawLimitMs > 0 && (
        <div className={styles.answerRow}>
          <div className={styles.answerBar} role="meter" aria-label={texts.answerLabel}>
            {poisonMs > 0 && (
              <div
                className={styles.poisonFill}
                style={{ width: `${(poisonMs / rawLimitMs) * 100}%` }}
                aria-label={texts.poisonLabel}
              />
            )}
            <div
              className={answerLeftMs < 3_000 ? styles.answerFillLow : styles.answerFill}
              style={{ width: `${(answerLeftMs / rawLimitMs) * 100}%` }}
            />
          </div>
          <span className={styles.answerSeconds}>{texts.answer(Math.ceil(answerLeftMs / 1000))}</span>
        </div>
      )}
    </div>
  );
}
