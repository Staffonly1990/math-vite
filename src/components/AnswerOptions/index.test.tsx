import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerOptions } from '.';
import { ArithmeticProblem } from '@/game/problem/ArithmeticProblem';

const problem = new ArithmeticProblem(47, '+', 54, [98, 112, 99], [98, 101, 112, 99]);

describe('AnswerOptions', () => {
  it('рисует 4 варианта и сообщает выбранный', async () => {
    const onAnswer = vi.fn();
    render(<AnswerOptions problem={problem} locked={false} picked={null} onAnswer={onAnswer} />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: '101' }));
    expect(onAnswer).toHaveBeenCalledWith(101);
  });

  it('в locked блокирует кнопки, подсвечивает верный вариант и промах', () => {
    render(<AnswerOptions problem={problem} locked picked={99} onAnswer={vi.fn()} />);

    const correct = screen.getByRole('button', { name: '101' });
    const wrongPick = screen.getByRole('button', { name: '99' });
    expect(correct.className).toContain('text-success');
    expect(wrongPick.className).toContain('text-danger');
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });
});
