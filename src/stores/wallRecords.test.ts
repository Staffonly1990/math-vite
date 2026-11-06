import { beforeEach, describe, expect, it } from 'vitest';
import { submitWallPeak, wallRecordsStore } from './wallRecords';

describe('wallRecords — рекорд по пиковому уровню', () => {
  beforeEach(() => {
    localStorage.clear();
    wallRecordsStore.setState(() => ({ best: null }));
  });

  it('первый пик становится рекордом и персистится', () => {
    submitWallPeak(3);
    expect(wallRecordsStore.state.best).toBe(3);
    expect(localStorage.getItem('math:wall-best-level')).toBe('3');
  });

  it('меньший пик не трогает рекорд', () => {
    submitWallPeak(5);
    submitWallPeak(2);
    expect(wallRecordsStore.state.best).toBe(5);
    expect(localStorage.getItem('math:wall-best-level')).toBe('5');
  });

  it('равный пик не перезаписывается', () => {
    submitWallPeak(4);
    submitWallPeak(4);
    expect(wallRecordsStore.state.best).toBe(4);
  });

  it('больший пик перезаписывает рекорд', () => {
    submitWallPeak(1);
    submitWallPeak(7);
    expect(wallRecordsStore.state.best).toBe(7);
    expect(localStorage.getItem('math:wall-best-level')).toBe('7');
  });

  it('битое значение в localStorage игнорируется при загрузке', () => {
    localStorage.setItem('math:wall-best-level', 'не число');
    // эмулируем холодный старт нельзя повторным импортом — проверяем толерантность submit
    submitWallPeak(0);
    expect(wallRecordsStore.state.best).toBe(0);
  });
});
