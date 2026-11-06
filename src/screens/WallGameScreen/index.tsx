import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { motion } from 'motion/react';
import { wallStore, wallDispatch, startWallRun } from '@/stores/wallSession';
import { submitWallPeak } from '@/stores/wallRecords';
import { SurrenderModal } from '@/components/SurrenderModal';
import { BASE_APPROACH_MS, WALL_SPAN_HALF, adenThreshold, zoneHit } from '@/game/wall/WallGame';
import {
  VIEW_W, VIEW_H, HIT_Y,
  roadLeft, roadRight, wallGeometry, cellRect, wallY,
} from './road';
import { levelColor, rgba, mix, GOLD, RISK_RED } from './levelColors';
import type { LevelColor } from './levelColors';
import { texts } from './texts';
import { styles } from './styles';

/** кулдаун вспышки левел-апа: на границе порога уровень может «дышать» туда-сюда */
const LEVEL_FLASH_COOLDOWN_MS = 2000;

export function WallGameScreen() {
  const navigate = useNavigate();
  const status = useSelector(wallStore, (s) => s.game.status);
  const aden = useSelector(wallStore, (s) => s.game.aden);
  const level = useSelector(wallStore, (s) => s.game.level);
  const peakLevel = useSelector(wallStore, (s) => s.game.peakLevel);
  const speedMultiplier = useSelector(wallStore, (s) => s.game.speedMultiplier);
  const lanes = useSelector(wallStore, (s) => s.game.lanes);
  const wall = useSelector(wallStore, (s) => s.game.wall);
  const wallSpawnedAt = useSelector(wallStore, (s) => s.game.wallSpawnedAt);
  const lastResult = useSelector(wallStore, (s) => s.game.lastResult);
  const index = useSelector(wallStore, (s) => s.game.index);

  const [now, setNow] = useState(() => Date.now());
  const [surrenderOpen, setSurrenderOpen] = useState(false);

  // rAF цикл: рендер 60fps + тик 10Hz (сгорание без задержки)
  useEffect(() => {
    if (status !== 'running') return;
    let raf = 0;
    let lastTick = 0;
    const loop = () => {
      const t = Date.now();
      if (t - lastTick > 100) {
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

  // пик уровня — в рекорды немедленно (переживает закрытие браузера)
  useEffect(() => {
    if (peakLevel > 0) submitWallPeak(peakLevel);
  }, [peakLevel]);

  // левел-ап = вспышка с кулдауном; падение уровня — тихое (трасса сузилась)
  const prevLevelRef = useRef(0);
  const lastFlashAtRef = useRef(0);
  const [levelFlash, setLevelFlash] = useState<{ id: number; color: LevelColor; level: number } | null>(null);
  useEffect(() => {
    const t = Date.now();
    if (level > prevLevelRef.current && t - lastFlashAtRef.current > LEVEL_FLASH_COOLDOWN_MS) {
      setLevelFlash({ id: t, color: levelColor(level), level });
      lastFlashAtRef.current = t;
    }
    prevLevelRef.current = level;
  }, [level]);

  // дистанция стены: 1 = спавн над экраном, 0 = линия удара
  const approach = BASE_APPROACH_MS / speedMultiplier;
  const distance = wall ? Math.max(0, 1 - (now - wallSpawnedAt) / approach) : 1;
  const geo = wallGeometry(distance, lanes);
  // стена золотеет, пока её плита задевает отрезок ×2
  const inZone = wall !== null && zoneHit(distance, wall.zoneCenter, wall.zoneHalf);

  // очередь «далее» — призрак следующей стены ВСЕГДА на заднем плане у шапки
  const nextWall = status === 'running' ? wallStore.state.game.peekNext() : null;
  const ghostGeo = wallGeometry(1, lanes);

  // звёзды: рандом по сиду рана, стабильны весь забег, приглушены под числами
  const seed = useSelector(wallStore, (s) => s.game.seed);
  const stars = useMemo(() => {
    let s = (seed >>> 0) || 1;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    return Array.from({ length: 46 }, () => ({
      x: 4 + rand() * (VIEW_W - 8),
      y: 4 + rand() * (VIEW_H - 8),
      r: 0.4 + rand() * 0.9,
      o: 0.06 + rand() * 0.22,
    }));
  }, [seed]);

  // цвет уровня → CSS-переменные для HUD
  const lc = levelColor(level);
  const rootVars = {
    '--lc': lc.hex,
    '--lc-dim': rgba(lc, 0.4),
    '--lc-faint': rgba(lc, 0.14),
  } as CSSProperties;

  // порог следующего уровня и заполнение диапазона — полоской над счётом
  const bandStart = level === 0 ? 0 : adenThreshold(level);
  const bandEnd = adenThreshold(level + 1);
  const bandRatio = Math.max(0, Math.min(1, (aden - bandStart) / (bandEnd - bandStart)));

  // линия сгорания: разогревается к красному по мере подлёта (кривая — краснеет ближе к касанию)
  const burnT = wall
    ? Math.pow(Math.max(0, Math.min(1, (0.5 - distance) / (0.5 - WALL_SPAN_HALF))), 1.4)
    : 0;
  const burnColor = mix(lc, RISK_RED, burnT);

  const flashKey = `${lastResult}-${index}`;

  const onCellTap = (cellIndex: number) => {
    if (wallStore.state.game.status !== 'running') return;
    wallDispatch({ type: 'WALL/TAP', cellIndex, at: Date.now() });
  };

  // зона ×2 этой стены: случайный отрезок, размер сжимается с уровнем
  const zoneTop = wallY(Math.min(1, Math.max(0, (wall?.zoneCenter ?? 0.5) + (wall?.zoneHalf ?? 0.045))));
  const zoneBottom = wallY(Math.min(1, Math.max(0, (wall?.zoneCenter ?? 0.5) - (wall?.zoneHalf ?? 0.045))));
  const zoneH = Math.max(2, zoneBottom - zoneTop);
  const zoneFont = Math.max(11, Math.min(20, zoneH * 0.45));

  // подсветка стены: обычная = цвет уровня, в зоне ×2 = золото
  const glowColor = inZone ? GOLD.hex : lc.hex;
  const borderColor = inZone ? GOLD.hex : rgba(lc, 0.75);
  const textColor = inZone ? '#ffe98f' : '#eef3fb';

  const runwayL = roadLeft(lanes);
  const runwayR = roadRight(lanes);

  return (
    <div className={styles.root} style={rootVars}>
      {/* ШАПКА — одна строка: ур+пик слева, Меню справа */}
      <div className={styles.hud}>
        <div className={styles.hudStatRow}>
          <div className={styles.hudStatLeft}>
            <span className={styles.levelBadge}>{texts.level(level)}</span>
            <span className={styles.peakBadge}>{texts.peak(peakLevel)}</span>
          </div>
          <button type="button" className={styles.surrenderBtn} onClick={() => setSurrenderOpen(true)}>
            {texts.toMenuBtn}
          </button>
        </div>
      </div>

      {/* Трасса: стены летят сверху вниз */}
      <div className={styles.field}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          role="img"
          aria-label={texts.roadLabel}
        >
          <defs>
            <linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#04060c" />
              <stop offset="100%" stopColor="#0a1220" />
            </linearGradient>
            {/* неоновое свечение: flood-color наследует currentColor группы */}
            <filter id="wr-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="currentColor" flood-opacity="0.8" />
            </filter>
            <linearGradient id="wr-progress" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={rgba(lc, 0.45)} />
              <stop offset="100%" stopColor={lc.hex} />
            </linearGradient>
            {/* сильное свечение нити сгорания: область фильтра растянута по вертикали,
                иначе glow тонкой горизонтальной линии обрезается */}
            <filter id="wr-burn" x="-5%" y="-800%" width="110%" height="1600%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="currentColor" flood-opacity="1" />
            </filter>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#wr-sky)" />
          {/* звёзды по всей трассе, приглушённые */}
          <g>
            {stars.map((st, i) => (
              <circle key={i} cx={st.x.toFixed(1)} cy={st.y.toFixed(1)} r={st.r.toFixed(2)} fill="#cfe6ff" opacity={st.o.toFixed(2)} />
            ))}
          </g>

          {/* края трассы — неон цвета уровня */}
          <g style={{ color: lc.hex }}>
            <line x1={runwayL} y1={0} x2={runwayL} y2={HIT_Y} stroke={rgba(lc, 0.9)} strokeWidth="1.5" filter="url(#wr-glow)" />
            <line x1={runwayR} y1={0} x2={runwayR} y2={HIT_Y} stroke={rgba(lc, 0.9)} strokeWidth="1.5" filter="url(#wr-glow)" />
          </g>
          {/* межполосные разделители */}
          {Array.from({ length: lanes - 1 }, (_, i) => i + 1).map((lane) => (
            <line
              key={lane}
              x1={runwayL + (runwayR - runwayL) / lanes * lane}
              y1={0}
              x2={runwayL + (runwayR - runwayL) / lanes * lane}
              y2={HIT_Y}
              stroke="rgba(255,255,255,.08)" strokeWidth="1" strokeDasharray="6 10"
            />
          ))}

          {/* зона ×2 этой стены — случайный отрезок, с уровнем меньше */}
          {wall && status === 'running' && (
            <g>
              <rect
                x={runwayL} y={zoneTop}
                width={runwayR - runwayL} height={zoneH}
                fill={inZone ? rgba(GOLD, 0.16) : rgba(GOLD, 0.08)}
              />
              <line x1={runwayL} y1={zoneTop} x2={runwayR} y2={zoneTop} stroke={GOLD.hex} strokeWidth="1.2" opacity={inZone ? '1' : '.5'} />
              <line x1={runwayL} y1={zoneBottom} x2={runwayR} y2={zoneBottom} stroke={GOLD.hex} strokeWidth="1.2" opacity={inZone ? '1' : '.5'} />
              <text
                x={VIEW_W / 2} y={(zoneTop + zoneBottom) / 2 + zoneFont * 0.36}
                textAnchor="middle" fill={GOLD.hex} fontSize={zoneFont} fontWeight="800"
                opacity={inZone ? '.6' : '.25'}
              >
                {texts.zone2}
              </text>
            </g>
          )}

          {/* ЛИНИЯ СГОРАНИЯ — лазерная нить: тонкое яркое ядро + плотный ореол + сильный glow */}
          <g style={{ color: burnColor.hex }}>
            <line
              x1={0} y1={HIT_Y} x2={VIEW_W} y2={HIT_Y}
              stroke={rgba(burnColor, 0.7)} strokeWidth="1.75"
            />
            <line
              x1={0} y1={HIT_Y} x2={VIEW_W} y2={HIT_Y}
              stroke={burnColor.hex} strokeWidth="0.8"
              filter="url(#wr-burn)"
            />
          </g>

          {/* ШКАЛА ЗАПОЛНЕНИЯ — на всю ширину, над счётом */}
          <rect x={0} y={762} width={VIEW_W} height={7} fill="rgba(255,255,255,.07)" />
          <rect x={0} y={762} width={VIEW_W * bandRatio} height={7} fill="url(#wr-progress)" />

          {/* СЧЁТ — своя линия внизу трассы: самое динамичное число, по центру */}
          <g key={`score-${flashKey}`} aria-label={texts.aden(aden, bandEnd)}>
            <g
              className={lastResult === 'correct' ? styles.scorePop
                : lastResult === 'wrong' || lastResult === 'miss' ? (aden === 0 ? styles.scoreDeny : styles.scoreShake)
                : undefined}
              style={{ color: '#ffd84a' }}
            >
              <text
                x={VIEW_W / 2} y={818} textAnchor="middle"
                fontSize="58" fontWeight="900" fill="#ffd84a"
                filter="url(#wr-glow)"
              >
                {aden}
              </text>
              <text x={VIEW_W / 2} y={838} textAnchor="middle" fontSize="13" fill="#8d97ac">
                / {bandEnd}
              </text>
            </g>
          </g>

          {/* дельта-стрелки у числа: зелёные вверх / красные вниз */}
          {lastResult && (
            <g key={`delta-${flashKey}`} className={lastResult === 'correct' ? styles.deltaUp : styles.deltaDown}>
              <text x={VIEW_W / 2 - 76} y={806} textAnchor="middle" fontSize="20" fontWeight="900"
                fill={lastResult === 'correct' ? '#2fd48a' : '#f4436b'}>
                {lastResult === 'correct' ? texts.arrowUp : texts.arrowDown}
              </text>
              <text x={VIEW_W / 2 + 76} y={806} textAnchor="middle" fontSize="20" fontWeight="900"
                fill={lastResult === 'correct' ? '#2fd48a' : '#f4436b'}>
                {lastResult === 'correct' ? texts.arrowUp : texts.arrowDown}
              </text>
            </g>
          )}

          {/* ГО — жёлтые вскрики с трибун: баланс пуст, выше линии сгорания по бокам */}
          {status === 'running' && aden === 0 && (
            <>
              <g className={styles.goCheerLeft} style={{ color: GOLD.hex }}>
                <g stroke={rgba(GOLD, 0.85)} strokeWidth="2.5" strokeLinecap="round">
                  <line x1={36} y1={700} x2={22} y2={681} />
                  <line x1={58} y1={690} x2={52} y2={668} />
                  <line x1={80} y1={696} x2={93} y2={676} />
                </g>
                <text
                  x={60} y={738} textAnchor="middle"
                  fontSize="44" fontWeight="900" fontStyle="italic"
                  fill={GOLD.hex} filter="url(#wr-glow)"
                >
                  {texts.go}
                </text>
              </g>
              <g className={styles.goCheerRight} style={{ color: GOLD.hex }}>
                <g stroke={rgba(GOLD, 0.85)} strokeWidth="2.5" strokeLinecap="round">
                  <line x1={VIEW_W - 36} y1={700} x2={VIEW_W - 22} y2={681} />
                  <line x1={VIEW_W - 58} y1={690} x2={VIEW_W - 52} y2={668} />
                  <line x1={VIEW_W - 80} y1={696} x2={VIEW_W - 93} y2={676} />
                </g>
                <text
                  x={VIEW_W - 60} y={738} textAnchor="middle"
                  fontSize="44" fontWeight="900" fontStyle="italic"
                  fill={GOLD.hex} filter="url(#wr-glow)"
                >
                  {texts.go}
                </text>
              </g>
            </>
          )}

          {/* ОЧЕРЕДЬ: призрак следующей стены — ВСЕГДА на заднем плане у шапки;
              текущая стена спавнится перед ним и закрывает, пока не опустится */}
          {nextWall && (
            <g opacity="0.4" aria-hidden="true">
              <rect
                x={ghostGeo.left} y={ghostGeo.headerY}
                width={ghostGeo.right - ghostGeo.left} height={ghostGeo.headerH - 4} rx="3"
                fill="rgba(5,9,18,.6)" stroke={rgba(lc, 0.3)} strokeWidth="1"
              />
              <text
                x={(ghostGeo.left + ghostGeo.right) / 2}
                y={ghostGeo.headerY + ghostGeo.headerH - 13}
                textAnchor="middle" fontSize="17" fill="#f2f6ff" fontWeight="700"
              >
                {nextWall.problem.prompt} = ?
              </text>
              {Array.from({ length: lanes }, (_, lane) => lane).map((lane) => {
                const r = cellRect(ghostGeo, lane);
                return (
                  <g key={lane}>
                    <rect
                      x={r.x} y={r.y} width={r.w} height={r.h} rx="6"
                      fill="rgba(255,255,255,.03)" stroke={rgba(lc, 0.3)} strokeWidth="1"
                    />
                    <text
                      x={r.x + r.w / 2} y={r.y + r.h / 2 + 10}
                      textAnchor="middle" fontSize="30" fill="#e9edf5" fontWeight="800"
                    >
                      {nextWall.cells[lane]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* СТЕНА: горизонтальный гейт; ниже кромки сгорания не рисуем — сгорела */}
          {wall && status === 'running' && distance > WALL_SPAN_HALF && (
            <g style={{ color: glowColor }}>
              <rect
                x={geo.left}
                y={geo.headerY}
                width={geo.right - geo.left}
                height={geo.headerH - 4}
                fill="rgba(5,9,18,.75)"
                stroke={rgba(lc, 0.5)}
                strokeWidth="1"
                rx="3"
              />
              <text
                x={(geo.left + geo.right) / 2}
                y={geo.headerY + geo.headerH - 13}
                textAnchor="middle"
                fontSize="17"
                fill="#f2f6ff"
                fontWeight="700"
              >
                {wall.problem.prompt} = ?
              </text>

              {Array.from({ length: lanes }, (_, lane) => lane).map((lane) => {
                const r = cellRect(geo, lane);

                return (
                  <g key={lane} onClick={() => onCellTap(lane)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={r.x} y={r.y} width={r.w} height={r.h} rx="6"
                      fill="rgba(255,255,255,.05)"
                      stroke={borderColor}
                      strokeWidth="1.5"
                      filter="url(#wr-glow)"
                      style={{ backdropFilter: 'blur(4px)' }}
                    />
                    <text
                      x={r.x + r.w / 2}
                      y={r.y + r.h / 2 + 10}
                      textAnchor="middle"
                      fontSize="30"
                      fill={textColor}
                      fontWeight="800"
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

      {/* вспышка левел-апа: цвет заливает экран и гаснет, игра не останавливается */}
      {levelFlash && (
        <motion.div
          key={levelFlash.id}
          className={styles.levelFlash}
          style={{ backgroundColor: rgba(levelFlash.color, 0.22) }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={() => setLevelFlash(null)}
        >
          <span
            className={styles.levelFlashText}
            style={{ color: levelFlash.color.hex, textShadow: `0 0 40px ${rgba(levelFlash.color, 0.9)}` }}
          >
            {texts.levelUp(levelFlash.level)}
          </span>
        </motion.div>
      )}

      <SurrenderModal
        open={surrenderOpen}
        onStay={() => setSurrenderOpen(false)}
        onEscape={() => {
          setSurrenderOpen(false);
          wallDispatch({ type: 'WALL/SURRENDER', at: Date.now() });
          void navigate({ to: '/' });
        }}
      />
    </div>
  );
}
