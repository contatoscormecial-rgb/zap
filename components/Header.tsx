import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { Page } from '../types';
import { Theme } from '../App';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, onLogout, theme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-zap-green text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setCurrentPage('Relatórios')}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M5 8C5 6.34315 6.34315 5 8 5H16C17.6569 5 19 6.34315 19 8V16C19 17.6569 17.6569 19 16 19H8C6.34315 19 5 17.6569 5 16V8Z" fill="white"/>
                  <rect x="7" y="10" width="10" height="4" rx="2" fill="#0D1117"/>
                  <circle cx="9.5" cy="12" r="1.5" fill="#22D3EE"/>
                  <circle cx="14.5" cy="12" r="1.5" fill="#22D3EE"/>
                  <path d="M8 5L6 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 5L18 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h1 className="text-2xl font-bold">ZAP <span className="font-light">CONTROLE</span></h1>
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage(item as Page); }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <button onClick={onLogout} className="bg-zap-red text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors">
              Sair
            </button>
            <div className="flex items-center space-x-2 text-green-200">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-green-600">
                  {theme === 'dark' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                  )}
                </button>
                <button className="p-2 rounded-full hover:bg-green-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7.86 5.89a2 2 0 01-1.42 1.42l-2.72.63c-1.56.38-1.56 2.6 0 2.98l2.72.63a2 2 0 011.42 1.42l.63 2.72c.38 1.56 2.6 1.56 2.98 0l.63-2.72a2 2 0 011.42-1.42l2.72-.63c-1.56-.38-1.56-2.6 0-2.98l-2.72-.63a2 2 0 01-1.42-1.42l-.63-2.72zM6.49 14.33c-.38-1.56-2.6-1.56-2.98 0l-.21.87a2 2 0 01-1.42 1.42l-.87.21c-1.56.38-1.56 2.6 0 2.98l.87.21a2 2 0 011.42 1.42l.21.87c.38 1.56 2.6 1.56 2.98 0l.21-.87a2 2 0 011.42-1.42l.87-.21c-1.56-.38-1.56-2.6 0-2.98l-.87-.21a2 2 0 01-1.42-1.42l-.21-.87z" clipRule="evenodd" /></svg></button>
                <button className="p-2 rounded-full hover:bg-green-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.32.775a5.002 5.002 0 00-8.25-2.062l1.659.83a1 1 0 01-.73 1.834H4.5a1 1 0 01-1-1V4a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.32-.775a5.002 5.002 0 008.25 2.062l-1.659-.83a1 1 0 01.73-1.834h3.5a1 1 0 011 1v3.5a1 1 0 01-1 1z" clipRule="evenodd" /></svg></button>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-green-200 hover:text-white hover:bg-green-600 focus:outline-none"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage(item as Page); setIsMenuOpen(false); }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === item
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
              >
                {item}
              </a>
            ))}
             <a href="#" onClick={(e) => {e.preventDefault(); onLogout();}} className="block px-3 py-2 rounded-md text-base font-medium text-red-200 bg-red-800/50 hover:bg-red-600 hover:text-white">
              Sair
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;