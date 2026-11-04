/** seed нового забега — генерируется платформенным слоем, ядро остаётся чистым */
export function newSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
