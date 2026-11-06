import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { wallStore, wallDispatch, startWallRun } from '@/stores/wallSession';
import { SurrenderModal } from '@/components/SurrenderModal';
import {
  VIEW_W, VIEW_H, HORIZON_Y, PLAYER_Y,
  roadLeft, roadRight, wallGeometry, cellPolygon,
} from './road';
import { texts } from './texts';
import { styles } from './styles';

const LANES = [0, 1, 2, 3];

export function WallGameScreen() {
  const navigate = useNavigate();
  const status = useSelector(wallStore, (s) => s.game.status);
  const aden = useSelector(wallStore, (s) => s.game.aden);
  const level = useSelector(wallStore, (s) => s.game.level);
  const speedMultiplier = useSelector(wallStore, (s) => s.game.speedMultiplier);
  const lavaReserveMs = useSelector(wallStore, (s) => s.game.lavaReserveMs);
  const hp = useSelector(wallStore, (s) => s.game.player.hp);
  const shield = useSelector(wallStore, (s) => s.game.player.shield);
  const poison = useSelector(wallStore, (s) => s.game.player.poison);
  const wall = useSelector(wallStore, (s) => s.game.wall);
  const wallSpawnedAt = useSelector(wallStore, (s) => s.game.wallSpawnedAt);
  const lastResult = useSelector(wallStore, (s) => s.game.lastResult);
  const index = useSelector(wallStore, (s) => s.game.index);

  const [now, setNow] = useState(() => Date.now());
  const [surrenderOpen, setSurrenderOpen] = useState(false);

  // rAF цикл: рендер 60fps + тик игры 5Hz
  useEffect(() => {
    if (status !== 'running') return;
    let raf = 0;
    let lastTick = 0;
    const loop = () => {
      const t = Date.now();
      if (t - lastTick > 200) {
        wallDispatch({ type: 'WALL/TICK', at: t });
        lastTick = t;
      }
      setNow(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // автостарт
  useEffect(() => {
    if (wallStore.state.game.status === 'idle') startWallRun();
  }, []);

  // gameover → экран итогов
  useEffect(() => {
    if (status === 'gameover') {
      const timer = setTimeout(() => void navigate({ to: '/gameover' }), 1200);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  // вычислить дистанцию стены
  const approach = 4000 / speedMultiplier;
  const distance = wall ? Math.max(0, 1 - (now - wallSpawnedAt) / approach) : 1;
  const geo = wallGeometry(distance);

  const lavaSeconds = Math.ceil(lavaReserveMs / 1000);
  const lavaRatio = Math.max(0, Math.min(1, lavaReserveMs / 20000));
  const lowLava = lavaReserveMs < 3000;
  const flashKey = `${lastResult}-${index}`;

  const onCellTap = (cellIndex: number) => {
    if (wallStore.state.game.status !== 'running') return;
    wallDispatch({ type: 'WALL/TAP', cellIndex, at: Date.now() });
  };

  // показать дорогу (статичный фон)
  const skyGradient = (
    <>
      <defs>
        <linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0e1a" />
          <stop offset="100%" stopColor="#0e1626" />
        </linearGradient>
        <linearGradient id="wr-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f1c" />
          <stop offset="100%" stopColor="#101828" />
        </linearGradient>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#wr-sky)" />
      <polygon
        points={`${roadLeft(HORIZON_Y)},${HORIZON_Y} ${roadRight(HORIZON_Y)},${HORIZON_Y} ${roadRight(PLAYER_Y)},${PLAYER_Y} ${roadLeft(PLAYER_Y)},${PLAYER_Y}`}
        fill="url(#wr-road)"
      />
      {/* края дороги */}
      <line x1={roadLeft(HORIZON_Y)} y1={HORIZON_Y} x2={roadLeft(PLAYER_Y)} y2={PLAYER_Y} stroke="#26324a" strokeWidth="1.5" />
      <line x1={roadRight(HORIZON_Y)} y1={HORIZON_Y} x2={roadRight(PLAYER_Y)} y2={PLAYER_Y} stroke="#26324a" strokeWidth="1.5" />
      {/* полосы */}
      {LANES.slice(1).map((lane) => (
        <line
          key={lane}
          x1={roadLeft(HORIZON_Y) + (roadRight(HORIZON_Y) - roadLeft(HORIZON_Y)) / 4 * lane}
          y1={HORIZON_Y}
          x2={roadLeft(PLAYER_Y) + (roadRight(PLAYER_Y) - roadLeft(PLAYER_Y)) / 4 * lane}
          y2={PLAYER_Y}
          stroke="#1e2a42" strokeWidth="1" strokeDasharray="4 6"
        />
      ))}
      {/* линия игрока */}
      <line x1={roadLeft(PLAYER_Y)} y1={PLAYER_Y} x2={roadRight(PLAYER_Y)} y2={PLAYER_Y} stroke="#e0526b" strokeWidth="1" opacity=".3" />
    </>
  );

  return (
    <div className={styles.root}>
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.adenBadge}>{texts.aden(aden)}</span>
          <span className={styles.speedBadge}>{texts.speed(speedMultiplier)}</span>
          <span className={styles.levelBadge}>{texts.level(level)}</span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <span className={hp <= 1 ? styles.hpBadge : styles.hpFullBadge}>{texts.hp(hp)}</span>
          {shield > 0 && <span className={styles.shieldBadge}>{texts.shield(shield)}</span>}
          {poison && <span className={styles.poisonBadge}>{texts.poison(poison.stacks)}</span>}
          <div className={styles.lavaBar} role="meter" aria-label="лава">
            <div
              className={lowLava ? styles.lavaFillLow : styles.lavaFill}
              style={{ width: `${lavaRatio * 100}%` }}
            />
          </div>
          <span className={styles.lavaSeconds}>{texts.lavaSeconds(lavaSeconds)}</span>
        </div>
        <button type="button" className={styles.surrenderBtn} onClick={() => setSurrenderOpen(true)}>
          {texts.surrender}
        </button>
      </div>

      {/* Игровое поле */}
      <div className={styles.field}>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" role="img" aria-label="Дорога с стенами-ответами">
          {skyGradient}

          {/* Стена */}
          {wall && status === 'running' && (
            <g>
              {/* шапка: пример */}
              <rect
                x={geo.topLeft}
                y={geo.headerY}
                width={geo.topRight - geo.topLeft}
                height={geo.headerH}
                fill="rgba(11,15,26,.95)"
                stroke="#2c3a58"
                strokeWidth="1"
                rx="3"
              />
              <text
                x={(geo.topLeft + geo.topRight) / 2}
                y={geo.headerY + geo.headerH * 0.7}
                textAnchor="middle"
                fontSize={Math.max(8, 16 * geo.fontScale)}
                fill="#e8ecf5"
                fontWeight="700"
              >
                {wall.problem.prompt} = ?
              </text>

              {/* 4 ячейки-трапеции */}
              {LANES.map((lane) => {
                const isPoison = lane === wall.poisonCell;
                const isBonus = lane === wall.bonusCell;
                const points = cellPolygon(geo, lane);
                const cx = (geo.topLeft + geo.cellTopW * lane + geo.cellTopW / 2 + geo.bottomLeft + geo.cellBottomW * lane + geo.cellBottomW / 2) / 2;
                const cy = (geo.topY + geo.bottomY) / 2;
                const fontSize = Math.max(7, 18 * geo.fontScale);

                return (
                  <g key={lane} onClick={() => onCellTap(lane)} style={{ cursor: 'pointer' }}>
                    <polygon
                      points={points}
                      fill="rgba(16,24,42,.55)"
                      stroke={isBonus ? '#e8a24a' : '#2c3a58'}
                      strokeWidth={isBonus ? '2' : '1.5'}
                    />
                    {isPoison && (
                      <line
                        x1={geo.bottomLeft + geo.cellBottomW * lane + 2}
                        y1={geo.bottomY - 1}
                        x2={geo.bottomLeft + geo.cellBottomW * (lane + 1) - 2}
                        y2={geo.bottomY - 1}
                        stroke="#63b57c" strokeWidth="2.5"
                      />
                    )}
                    <text
                      x={cx} y={cy + fontSize * 0.35}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fill={isBonus ? '#e8a24a' : '#e8ecf5'}
                      fontWeight="700"
                    >
                      {wall.cells[lane]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* вспышка результата */}
      {status === 'running' && lastResult && (
        <div key={flashKey} className={styles.overlay}>
          <span className={`${styles.flashText} ${lastResult === 'correct' ? styles.flashCorrect : styles.flashWrong}`}>
            {lastResult === 'correct' ? texts.correct : lastResult === 'timeout' ? texts.timeout : texts.wrong}
          </span>
        </div>
      )}

      {/* виньетка урона */}
      {(lastResult === 'wrong' || lastResult === 'timeout') && status === 'running' && (
        <div key={`vig-${flashKey}`} className={styles.hitVignette} />
      )}

      <SurrenderModal
        open={surrenderOpen && status === 'running'}
        onStay={() => setSurrenderOpen(false)}
        onEscape={() => {
          setSurrenderOpen(false);
          wallDispatch({ type: 'WALL/SURRENDER', at: Date.now() });
        }}
      />
    </div>
  );
}
