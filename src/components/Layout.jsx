import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

function Layout() {
  return (
    <div>
      <Navigation />
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout; 