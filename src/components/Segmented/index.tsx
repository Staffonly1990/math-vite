import { cn } from '@/lib/cn';
import { styles } from './styles';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

export function Segmented<T extends string>({ options, value, onChange, ...rest }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className={styles.root} {...rest}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(styles.option, active ? styles.optionActive : styles.optionIdle)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
