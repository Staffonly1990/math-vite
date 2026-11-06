import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';
import { configForLevel } from '../difficulty';
import { ProblemFactory } from './ProblemFactory';
import { ArithmeticProblem } from './ArithmeticProblem';
import { termValue } from './ArithmeticProblem';

/** Термы примера по порядку */
const termsOf = (p: ArithmeticProblem) => [p.first, ...p.rest.map((s) => s.term)];

describe('лестница математики «знак × количество чисел»', () => {
  it('этапы: + → − → двузначные ± → × → ÷ → финальный микс', () => {
    expect(configForLevel(1)).toMatchObject({ numbers: 2, focus: '+', addMax: 9, factorMax: 9 });
    expect(configForLevel(2)).toMatchObject({ numbers: 3, focus: '+', addMax: 9 });
    expect(configForLevel(3)).toMatchObject({ numbers: 4, focus: '+', addMax: 9 });
    expect(configForLevel(4)).toMatchObject({ numbers: 2, focus: '-', addMax: 9 });
    expect(configForLevel(5)).toMatchObject({ numbers: 3, focus: '-', addMax: 9 });
    expect(configForLevel(6)).toMatchObject({ numbers: 4, focus: '-', addMax: 9 });
    expect(configForLevel(7)).toMatchObject({ numbers: 2, focus: 'big', addMax: 99 });
    expect(configForLevel(8)).toMatchObject({ numbers: 3, focus: 'big', addMax: 99 });
    expect(configForLevel(9)).toMatchObject({ numbers: 4, focus: 'big', addMax: 99 });
    expect(configForLevel(10)).toMatchObject({ numbers: 2, focus: '*', addMax: 9 });
    expect(configForLevel(11)).toMatchObject({ numbers: 3, focus: '*', addMax: 9 });
    expect(configForLevel(12)).toMatchObject({ numbers: 4, focus: '*', addMax: 9 });
    expect(configForLevel(13)).toMatchObject({ numbers: 2, focus: '/', addMax: 9 });
    expect(configForLevel(14)).toMatchObject({ numbers: 3, focus: '/', addMax: 9 });
    expect(configForLevel(15)).toMatchObject({ numbers: 4, focus: '/', addMax: 9 });
    expect(configForLevel(16)).toMatchObject({ numbers: 4, focus: 'all', addMax: 99 });
    expect(configForLevel(30)).toEqual(configForLevel(16)); // дальше не растёт
  });
});

describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])(
  'генератор арифметики: этап %i',
  (level: number) => {
    it('генерирует валидные задачи через фабрику', () => {
      const cfg = configForLevel(level);
      const big = cfg.focus === 'big' || cfg.focus === 'all';
      for (let index = 0; index < 500; index++) {
        const problem = ProblemFactory.create(new Rng(1234, index), { topic: 'arithmetic', level });
        expect(problem).toBeInstanceOf(ArithmeticProblem);
        const p = problem as ArithmeticProblem;

        // чисел всегда столько, сколько требует этап
        expect(p.numbers).toBe(cfg.numbers);

        const terms = termsOf(p);
        const ops = p.rest.map((s) => s.op);
        const mulCount = terms.filter((t) => t.kind === 'mul').length;
        const divCount = terms.filter((t) => t.kind === 'div').length;

        // ×/÷ — никогда не цепочкой: максимум один ×-терм и один ÷-терм
        expect(mulCount).toBeLessThanOrEqual(1);
        expect(divCount).toBeLessThanOrEqual(1);

        // правила этапа
        if (cfg.focus === '+') expect(ops.every((o) => o === '+')).toBe(true);
        if (cfg.focus === '-') expect(ops).toContain('-'); // минус гарантирован
        if (cfg.focus === '*') expect(mulCount).toBe(1);
        if (cfg.focus === '/') expect(divCount).toBe(1);

        for (const t of terms) {
          if (t.kind === 'num') {
            // слагаемые: 1..9, на двузначном ярусе и в миксе — 11..99
            if (big) {
              expect(t.value).toBeGreaterThanOrEqual(11);
              expect(t.value).toBeLessThanOrEqual(99);
            } else {
              expect(t.value).toBeGreaterThanOrEqual(1);
              expect(t.value).toBeLessThanOrEqual(9);
            }
          }
          if (t.kind === 'mul') {
            expect(t.a).toBeGreaterThanOrEqual(2);
            expect(t.a).toBeLessThanOrEqual(cfg.factorMax);
            expect(t.b).toBeGreaterThanOrEqual(2);
            expect(t.b).toBeLessThanOrEqual(cfg.factorMax);
            expect(t.a * t.b).toBeLessThanOrEqual(81); // не «баснословно большие»
          }
          if (t.kind === 'div') {
            expect(t.b).toBeGreaterThanOrEqual(2);
            expect(t.b).toBeLessThanOrEqual(cfg.factorMax);
            expect(t.a % t.b).toBe(0); // деление только нацело
            expect(t.a / t.b).toBeGreaterThanOrEqual(2);
            expect(t.a / t.b).toBeLessThanOrEqual(9);
            expect(t.a).toBeLessThanOrEqual(81);
          }
        }

        // ответ = вычисление слева-направо, все промежуточные суммы ≥ 0, ответ ≥ 1
        let sum = termValue(p.first);
        for (const s of p.rest) {
          sum += s.op === '+' ? termValue(s.term) : -termValue(s.term);
          expect(sum).toBeGreaterThanOrEqual(0);
        }
        expect(p.answer).toBe(sum);
        expect(p.answer).toBeGreaterThanOrEqual(1);

        // варианты: 4 шт, уникальны, содержат ответ, все неотрицательны
        expect(p.options).toHaveLength(4);
        expect(new Set(p.options).size).toBe(4);
        expect(p.options).toContain(p.answer);
        expect(p.options.every((o) => o >= 0)).toBe(true);
        expect(p.distractors).not.toContain(p.answer);
      }
    });

    it('детерминирован по (seed, index)', () => {
      const first = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', level });
      const second = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', level });
      expect(second).toEqual(first);
    });
  },
);

describe('генератор арифметики: разнообразие форм', () => {
  it('таблица ×(2) и ÷(2) — чистые примеры из двух чисел', () => {
    for (let index = 0; index < 200; index++) {
      const mul = ProblemFactory.create(new Rng(7, index), { topic: 'arithmetic', level: 10 }) as ArithmeticProblem;
      expect(mul.numbers).toBe(2);
      expect(mul.prompt).toMatch(/^\d+ × \d+$/);
      const div = ProblemFactory.create(new Rng(7, index), { topic: 'arithmetic', level: 13 }) as ArithmeticProblem;
      expect(div.numbers).toBe(2);
      expect(div.prompt).toMatch(/^\d+ ÷ \d+$/);
    }
  });

  it('×(3)/×(4): ×-терм вплетён в пример с + и −, слагаемые снова 1..9', () => {
    for (let index = 0; index < 200; index++) {
      const p = ProblemFactory.create(new Rng(21, index), { topic: 'arithmetic', level: 12 }) as ArithmeticProblem;
      expect(p.prompt).toMatch(/×/);
      expect(p.numbers).toBe(4);
      expect(p.prompt).toMatch(/[+−]/); // × — часть аддитивного примера
      expect(p.prompt).not.toMatch(/×.*×/); // никогда два × в одном примере
    }
  });

  it('финальный микс (этап 16): встречаются все формы — без спец-термов, с одним, с × и ÷', () => {
    const shapes = new Set<string>();
    for (let index = 0; index < 1000; index++) {
      const p = ProblemFactory.create(new Rng(99, index), { topic: 'arithmetic', level: 16 }) as ArithmeticProblem;
      const terms = termsOf(p);
      const hasMul = terms.some((t) => t.kind === 'mul');
      const hasDiv = terms.some((t) => t.kind === 'div');
      shapes.add(`${hasMul ? '×' : ''}${hasDiv ? '÷' : ''}`);
    }
    expect(shapes.has('')).toBe(true); // чистые ± до 99
    expect(shapes.has('×')).toBe(true);
    expect(shapes.has('÷')).toBe(true);
    expect(shapes.has('×÷')).toBe(true); // оба спец-терма: 7 × 3 + 42 ÷ 6
  });

  it('на старте все числа меньше 10 (жалоба юзера закрыта)', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      for (let index = 0; index < 100; index++) {
        const p = ProblemFactory.create(new Rng(1, index), { topic: 'arithmetic', level }) as ArithmeticProblem;
        for (const numRaw of p.prompt.match(/\d+/g) ?? []) {
          expect(Number(numRaw)).toBeLessThanOrEqual(9);
        }
      }
    }
  });
});
