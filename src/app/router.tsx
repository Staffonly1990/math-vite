import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { MenuScreen } from '@/screens/MenuScreen';
import { WallGameScreen } from '@/screens/WallGameScreen';
import { WallGameOverScreen } from '@/screens/WallGameOverScreen';
import { wallStore } from '@/stores/wallSession';
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
  component: WallGameScreen,
});

const gameoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gameover',
  beforeLoad: () => {
    if (wallStore.state.game.status !== 'gameover') {
      throw redirect({ to: '/' });
    }
  },
  component: WallGameOverScreen,
});

const routeTree = rootRoute.addChildren([indexRoute, gameRoute, gameoverRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
