import { useEffect, useRef, useState } from 'react';
import { texts } from './texts';
import { styles } from './styles';

interface AnswerInputProps {
  locked: boolean;
  onAnswer: (value: number) => void;
}

export function AnswerInput({ locked, onAnswer }: AnswerInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!locked) inputRef.current?.focus();
  }, [locked]);

  const submit = () => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    onAnswer(parsed);
    if (!locked) setValue('');
  };

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        disabled={locked}
        inputMode="numeric"
        autoComplete="off"
        placeholder={texts.placeholder}
        aria-label={texts.ariaLabel}
        className={styles.input}
      />
      <button
        type="button"
        onClick={submit}
        disabled={locked || value === ''}
        className={styles.submit}
      >
        {texts.submit}
      </button>
    </div>
  );
}
