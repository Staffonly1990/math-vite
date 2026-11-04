/**
 * SVG-фигуры сцены: игрок и монстры (по kind). Процедурные, без ассетов —
 * когда соберём спрайты L2, подменим отрисовку, интерфейс останется.
 * Размер приходит классом — сцена масштабирует фигуры под их количество.
 */

export function PlayerFigure({ className = 'h-28 w-24 sm:h-36 sm:w-30' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 88" className={className} aria-hidden="true">
      {/* плащ */}
      <path d="M18 84 Q14 52 24 38 L48 38 Q58 52 54 84 Z" fill="#1c2432" />
      <path d="M18 84 Q14 52 24 38 L30 38 Q24 60 26 84 Z" fill="#263349" />
      {/* торс */}
      <path d="M26 40 Q36 34 46 40 L44 62 Q36 66 28 62 Z" fill="#2a3450" />
      <rect x="27" y="57" width="18" height="4" fill="#8c6d34" />
      {/* голова и шлем с гребнем */}
      <circle cx="36" cy="26" r="9" fill="#3a465f" />
      <path d="M27 25 Q36 13 45 25 L45 20 Q36 9 27 20 Z" fill="#2a3450" />
      <path d="M33 14 Q36 4 41 10 L40 17 L33 17 Z" fill="#ff8a3d" />
      {/* меч поднят */}
      <rect x="53" y="18" width="4" height="28" rx="1" fill="#cdd6ea" />
      <path d="M51 17 L59 17 L55 10 Z" fill="#e8ecf5" />
      <rect x="49" y="45" width="9" height="3" fill="#8c6d34" />
      {/* щит */}
      <path d="M13 44 h11 v14 q-5.5 7 -11 0 Z" fill="#22304a" stroke="#8c6d34" strokeWidth="1.5" />
    </svg>
  );
}

export function MonsterFigure({ kind, className = 'h-28 w-28 sm:h-36 sm:w-36' }: { kind: string; className?: string }) {
  if (kind === 'mordeo') return <MordeoFigure className={className} />;
  return <PortaFigure className={className} />;
}

/** Дверь этажа на заднем плане: пока идёт бой — в цепях, открыта для примера — светится */
export function DoorFigure({ locked, className = 'h-40 sm:h-52' }: { locked: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 96 128" className={className} aria-hidden="true">
      {/* каменная арка */}
      <path d="M8 128 L8 56 Q8 14 48 14 Q88 14 88 56 L88 128 Z" fill="#141a26" stroke="#2a3450" strokeWidth="3" />
      {/* створки */}
      <path d="M15 128 L15 58 Q15 24 44 21 L44 128 Z" fill={locked ? '#231e16' : '#3a2f1d'} stroke="#8c6d34" strokeWidth="2" />
      <path d="M81 128 L81 58 Q81 24 52 21 L52 128 Z" fill={locked ? '#231e16' : '#3a2f1d'} stroke="#8c6d34" strokeWidth="2" />
      {/* заклёпки */}
      <g fill="#c9a55a">
        <circle cx="22" cy="40" r="1.5" />
        <circle cx="37" cy="34" r="1.5" />
        <circle cx="22" cy="66" r="1.5" />
        <circle cx="37" cy="60" r="1.5" />
        <circle cx="22" cy="94" r="1.5" />
        <circle cx="37" cy="88" r="1.5" />
        <circle cx="74" cy="40" r="1.5" />
        <circle cx="59" cy="34" r="1.5" />
        <circle cx="74" cy="66" r="1.5" />
        <circle cx="59" cy="60" r="1.5" />
        <circle cx="74" cy="94" r="1.5" />
        <circle cx="59" cy="88" r="1.5" />
      </g>
      {/* ручки */}
      <circle cx="40" cy="82" r="2.5" fill="#c9a55a" />
      <circle cx="56" cy="82" r="2.5" fill="#c9a55a" />
      {/* заперта, пока идёт бой — цепи; открыта для примера — тёплое свечение контура */}
      {locked ? (
        <g stroke="#8c6d34" strokeWidth="3" fill="none" opacity="0.9">
          <path d="M18 68 Q48 86 78 68" />
          <path d="M18 82 Q48 100 78 82" />
          <rect x="42" y="76" width="12" height="12" rx="2" fill="#8c6d34" stroke="none" />
          <circle cx="48" cy="82" r="2" fill="#141a26" stroke="none" />
        </g>
      ) : (
        <path d="M8 128 L8 56 Q8 14 48 14 Q88 14 88 56 L88 128" fill="none" stroke="#ff8a3d" strokeWidth="3.5" opacity="0.85" />
      )}
    </svg>
  );
}

/** Porta — парящее магическое существо с одним глазом */
function PortaFigure({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <ellipse cx="36" cy="65" rx="15" ry="4" fill="rgba(0,0,0,0.45)" />
      <path d="M36 8 Q58 14 60 36 Q62 56 36 60 Q10 56 12 36 Q14 14 36 8 Z" fill="#2b3a5e" />
      <path d="M36 8 Q58 14 60 36 Q61 46 54 52 Q60 40 52 28 Q56 16 36 12 Z" fill="#39507e" />
      <path d="M12 30 L4 26 L13 24 Z" fill="#39507e" />
      <path d="M60 30 L68 26 L59 24 Z" fill="#39507e" />
      <circle cx="36" cy="34" r="11" fill="#0e1524" />
      <circle cx="36" cy="34" r="7" fill="#7fd4ff" />
      <circle cx="33.5" cy="31.5" r="2.2" fill="#ffffff" />
      <path d="M28 48 L32 52 L36 48 L40 52 L44 48" stroke="#0e1524" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Mordeo — ядовитый зверь: шипы, зелёное свечение, капли яда */
function MordeoFigure({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <ellipse cx="36" cy="65" rx="16" ry="4" fill="rgba(0,0,0,0.45)" />
      <path
        d="M12 52 Q10 30 24 22 L28 10 L34 20 L40 8 L46 20 L52 10 L56 24 Q66 32 62 52 Q48 62 26 60 Q14 58 12 52 Z"
        fill="#3f5a3a"
      />
      <path d="M12 52 Q10 30 24 22 L28 10 L34 20 L36 14 L36 60 Q24 60 12 52 Z" fill="#4e6f45" />
      <circle cx="46" cy="36" r="6" fill="#101608" />
      <circle cx="46" cy="36" r="3.5" fill="#7de07d" />
      <path d="M56 44 L59 50 L54 49 Z" fill="#e8ecf5" />
      <path d="M50 48 L53 54 L48 52 Z" fill="#e8ecf5" />
      <circle cx="30" cy="64" r="2" fill="#7de07d" />
      <circle cx="42" cy="66" r="1.6" fill="#7de07d" />
      <circle cx="36" cy="63" r="1.3" fill="#a7f0a7" />
    </svg>
  );
}
