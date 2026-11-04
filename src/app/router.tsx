import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { MenuScreen } from '@/screens/MenuScreen';
import { GameScreen } from '@/screens/GameScreen';
import { GameOverScreen } from '@/screens/GameOverScreen';
import { sessionStore } from '@/stores/session';
import { RootLayout } from '@/components/RootLayout';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MenuScreen,
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game',
  component: GameScreen,
});

const gameoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gameover',
  beforeLoad: () => {
    // без завершённого забега на этом экране делать нечего
    if (sessionStore.state.game.status !== 'gameover') {
      throw redirect({ to: '/' });
    }
  },
  component: GameOverScreen,
});

const routeTree = rootRoute.addChildren([indexRoute, gameRoute, gameoverRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
