import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { MenuScreen } from '@/screens/MenuScreen';
import { WallGameScreen } from '@/screens/WallGameScreen';
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

const routeTree = rootRoute.addChildren([indexRoute, gameRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
