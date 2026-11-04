import { Outlet } from '@tanstack/react-router';
import { styles } from './styles';

export function RootLayout() {
  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
