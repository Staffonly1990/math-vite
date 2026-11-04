# MATH — тренажёр устного счёта

Устный счёт (`a ± b`) в обёртке раннера: верный ответ — +1 адена, ошибка — конец забега.
Концепт и стек — в [docs/game-plan.md](docs/game-plan.md).

## Запуск

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # vitest
pnpm build      # tsc -b + vite build
```

## Структура

- `src/game/` — чистое ядро без React/DOM: seeded RNG, конфиги сложности, генератор примеров,
  FSM забега (`reduce(state, action, cfg)`). Пригодится как есть для RN и серверного мультиплеера.
- `src/stores/` — TanStack Store: настройки и сессия (единственная точка мутации — `dispatch`).
- `src/screens/`, `src/components/` — веб-слой.
