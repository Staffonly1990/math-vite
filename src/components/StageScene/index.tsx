import { useSelector } from '@tanstack/react-store';
import { motion } from 'motion/react';
import type { Monster } from '@/game/entities/monsters/Monster';
import { sessionStore } from '@/stores/session';
import { DoorFigure, MonsterFigure, PlayerFigure } from './figures';
import { texts } from './texts';
import { styles } from './styles';

function Pips({ count, filled, monster }: { count: number; filled: number; monster: boolean }) {
  return (
    <div className={styles.pips} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={i < filled ? (monster ? styles.pipMonster : styles.pipPlayer) : styles.pipMonsterDead}
        />
      ))}
    </div>
  );
}

/**
 * Сцена этажа — игрок виден ВСЕГДА: один (двери, сокровищница) — по центру,
 * в бою — смещается влево и держит дистанцию от монстров. Все живые монстры
 * стоят справа (для сложных уровней их несколько), цель — первый, подсвечен.
 */
export function StageScene({ monsters }: { monsters: readonly Monster[] }) {
  const index = useSelector(sessionStore, (s) => s.game.index);
  const lastAnswer = useSelector(sessionStore, (s) => s.game.lastAnswer);
  const playerHp = useSelector(sessionStore, (s) => s.game.player.hp);
  const playerMaxHp = useSelector(sessionStore, (s) => s.game.player.maxHp);
  const levelNumber = useSelector(sessionStore, (s) => s.game.level.number);

  const inBattle = monsters.length > 0;
  const packCount = monsters.length;
  const target = monsters[0];

  const idle = { y: [0, -4, 0] };
  const idleTransition = { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const };
  const hit = { x: [0, -10, 10, -6, 6, 0], filter: ['brightness(2.2)', 'brightness(1)'] };
  const lunge = { x: [0, 26, 0] };
  const hitTransition = { duration: 0.45 };

  return (
    <div className={`${styles.root} ${inBattle ? '' : styles.rootSolo}`}>
      {/* дверь этажа на заднем плане: в цепях, пока идёт бой */}
      <div className={styles.doorWrap}>
        <DoorFigure locked={inBattle} />
      </div>

      <div className={styles.side}>
        <div className={styles.name}>{texts.playerLevel(levelNumber)}</div>
        <Pips count={playerMaxHp} filled={playerHp} monster={false} />
        <motion.div
          key={`player-${index}`}
          animate={lastAnswer === 'wrong' ? hit : inBattle ? lunge : idle}
          transition={lastAnswer === 'wrong' ? hitTransition : inBattle ? { duration: 0.35 } : idleTransition}
        >
          <motion.div animate={idle} transition={idleTransition}>
            <PlayerFigure />
          </motion.div>
        </motion.div>
      </div>

      {inBattle && target && (
        <>
          <div className={styles.vs} aria-hidden="true">
            ⚔
          </div>
          <div className={styles.pack}>
            {/* инфо только о текущей цели — НАД пачкой */}
            <div className={styles.targetInfo}>
              <span className={styles.target}>▼ {texts.active}</span>
              <div className={styles.name}>
                {target.name}
                {target.poisonous && <span className={styles.poisonous}> ☠</span>}
              </div>
              <Pips count={target.maxHp} filled={target.hp} monster />
            </div>
            {/* одна полноразмерная фигура + геройское число мобов над головой */}
            <div className={styles.monsterWrap}>
              <span className={styles.stackBadge} aria-label={texts.packSize(packCount)}>
                {packCount}
              </span>
              <motion.div
                key={`monster-${index}`}
                animate={lastAnswer === 'correct' ? hit : { scale: [1, 0.96, 1] }}
                transition={lastAnswer === 'correct' ? hitTransition : { duration: 0.3 }}
              >
                <motion.div animate={idle} transition={{ ...idleTransition, delay: 0.5 }}>
                  <MonsterFigure kind={target.kind} />
                </motion.div>
              </motion.div>
            </div>
            <span className={styles.meta}>{texts.monsterLevel(target.level)}</span>
          </div>
        </>
      )}
    </div>
  );
}
