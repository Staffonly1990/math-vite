import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { motion } from 'motion/react';
import { MenuBackground } from '@/components/MenuBackground';
import { Segmented } from '@/components/Segmented';
import type { SegmentOption } from '@/components/Segmented';
import { setInputMode, settingsStore } from '@/stores/settings';
import type { InputMode } from '@/stores/settings';
import { startRun } from '@/stores/session';
import { texts } from './texts';
import { styles } from './styles';

const inputModeOptions: SegmentOption<InputMode>[] = [
  { value: 'choice', label: texts.inputModeChoice },
  { value: 'input', label: texts.inputModeInput },
];

export function MenuScreen() {
  const navigate = useNavigate();
  const inputMode = useSelector(settingsStore, (s) => s.inputMode);

  const start = () => {
    startRun();
    void navigate({ to: '/game' });
  };

  return (
    <>
      <MenuBackground />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.root}>
        <header className="text-center">
          <h1 className={styles.title}>MATH</h1>
          <p className={styles.subtitle}>{texts.subtitle}</p>
        </header>

        <section className={styles.section}>
          <div className="space-y-2">
            <span className={styles.sectionTitle}>{texts.inputModeSection}</span>
            <Segmented aria-label={texts.inputModeSection} options={inputModeOptions} value={inputMode} onChange={setInputMode} />
            <p className={styles.hint}>
              {inputMode === 'choice' ? texts.inputModeChoiceHint : texts.inputModeInputHint}
            </p>
          </div>
        </section>

        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={start} className={styles.startButton}>
          {texts.startButton}
        </motion.button>

        <p className={styles.rules}>{texts.rules}</p>
      </motion.div>
    </>
  );
}
