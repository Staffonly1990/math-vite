import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { wallStore, startWallRun } from '@/stores/wallSession';
import { texts } from './texts';
import { styles } from './styles';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statRoot}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export function WallGameOverScreen() {
  const navigate = useNavigate();
  const aden = useSelector(wallStore, (s) => s.game.aden);
  const stats = useSelector(wallStore, (s) => s.game.stats);
  const speedMultiplier = useSelector(wallStore, (s) => s.game.speedMultiplier);
  const endReason = useSelector(wallStore, (s) => s.game.endReason);

  const title =
    endReason === 'surrender' ? texts.titleSurrender :
    endReason === 'lava' ? texts.titleLava :
    endReason === 'timeout' ? texts.titleTimeout :
    texts.titleWrong;

  const restart = () => {
    startWallRun();
    void navigate({ to: '/game' });
  };

  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>

      <div className="text-center">
        <div className={styles.adenValue}>{aden}</div>
        <div className={styles.adenLabel}>{texts.adenEarned}</div>
      </div>

      <div className={styles.statsGrid}>
        <Stat label={texts.solved} value={String(stats.correct)} />
        <Stat label={texts.bestStreak} value={String(stats.bestStreak)} />
        <Stat label={texts.maxSpeed} value={texts.speed(speedMultiplier)} />
        <Stat label="промахов" value={String(stats.wrong)} />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.restartBtn} onClick={restart}>
          {texts.restart}
        </button>
        <button type="button" className={styles.menuBtn} onClick={() => void navigate({ to: '/' })}>
          {texts.toMenu}
        </button>
      </div>
    </div>
  );
}
