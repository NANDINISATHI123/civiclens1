import React from 'react';
// FIX: Added .ts extension to fix module resolution error.
import { User, Page } from '../types.ts';
import { Button } from './ui/Button';
// FIX: Added .tsx extension to fix module resolution error.
import { CameraIcon, SunIcon, MoonIcon, MenuIcon } from './Icons.tsx';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  navigate: (page: Page) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuClick: () => void;
}

const Header = ({ currentUser, onLogout, navigate, theme, toggleTheme, onMenuClick }: HeaderProps) => {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={onMenuClick} aria-label="Open menu">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Open Menu</span>
        </Button>
        <div className="flex items-center cursor-pointer" onClick={() => navigate(Page.Home)}>
            <CameraIcon className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold">CivicLens</span>
        </div>
        <div className="flex-1">
             {/* This space is for the mobile menu button if we add one later */}
        </div>
        <div className="flex items-center justify-end space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {theme === 'light' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          {currentUser ? (
            <>
              <span className="hidden sm:inline text-sm">Welcome, {currentUser.name}</span>
              <Button variant="outline" onClick={onLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate(Page.Login)}>User Login</Button>
              <Button variant="secondary" onClick={() => navigate(Page.AdminLogin)}>Admin Login</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;