import React from 'react';
import { Auth } from './components/Auth';
import { Layout, ViewType } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Planning } from './components/Planning';
import { Config } from './components/Config';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [view, setView] = React.useState<ViewType>('dashboard');

  // Check for existing session
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('facore_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Error parsing saved user:', err);
      localStorage.removeItem('facore_user');
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
