import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Cards from './components/Cards';
import Reminders from './components/Reminders';
import Investments from './components/Investments';
import Export from './components/Export';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { Page } from './types';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import WhatsApp from './components/WhatsApp';

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('Relatórios');
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('Relatórios'); // Reset to default page on logout
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Relatórios':
        return <Dashboard theme={theme} />;
      case 'Transações':
        return <Transactions />;
      case 'Cartões':
        return <Cards />;
      case 'Lembretes':
        return <Reminders />;
      case 'Investimentos':
        return <Investments theme={theme} />;
      case 'Exportar':
        return <Export />;
      case 'WhatsApp':
        return <WhatsApp />;
      default:
        return <Dashboard theme={theme} />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zap-dark-blue flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-zap-green-light"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-zap-dark-blue flex items-center justify-center p-4">
        {authPage === 'login' ? (
          <Login onSwitchToSignUp={() => setAuthPage('signup')} />
        ) : (
          <SignUp onSwitchToLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zap-dark-blue font-sans text-gray-800 dark:text-zap-text-primary">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
      <div className="fixed bottom-8 right-8 bg-zap-green-light text-white w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-green-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z" />
        </svg>
      </div>
    </div>
  );
};

export default App;