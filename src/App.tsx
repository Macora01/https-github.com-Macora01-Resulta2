import React from 'react';
import { Auth } from './components/Auth';
import { Layout, ViewType } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Planning } from './components/Planning';
import { Config } from './components/Config';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  // Bypass login: initialize with a default admin user
  const [user, setUser] = React.useState<any>({
    email: 'admin@facore.cl',
    role: 'admin'
  });
  const [view, setView] = React.useState<ViewType>('dashboard');

  // Check for existing session or set bypass token
  React.useEffect(() => {
    // Set a dummy token for the bypass if not present
    if (!localStorage.getItem('facore_token')) {
      localStorage.setItem('facore_token', 'bypass-token');
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('facore_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('facore_user');
    localStorage.removeItem('facore_token');
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'reports': return <Reports />;
      case 'planning': return <Planning />;
      case 'config': return <Config />;
      default: return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Layout 
          onLogout={handleLogout} 
          currentView={view} 
          onViewChange={setView}
        >
          {renderView()}
        </Layout>
      )}
    </ErrorBoundary>
  );
}
