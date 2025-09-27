
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import { Page, User, Report, UserRole } from './types.ts';
// FIX: Added .ts extension to fix module resolution error.
import * as api from './services/api.ts';
// FIX: Added .ts extension to fix module resolution error.
import * as db from './services/db.ts';

// FIX: Added .tsx extension to fix module resolution error.
import Header from './components/Header.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import Sidebar from './components/Sidebar.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import HomePage from './pages/HomePage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import LoginPage from './pages/LoginPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import SignUpPage from './pages/SignUpPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import AdminLoginPage from './pages/AdminLoginPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import CitizenDashboard from './pages/CitizenDashboard.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import AdminDashboard from './pages/AdminDashboard.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import SubmitReportPage from './pages/SubmitReportPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import ReportDetailPage from './pages/ReportDetailPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import WorkersPage from './pages/WorkersPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import UsersPage from './pages/UsersPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import ContactPage from './pages/ContactPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import FeedbackPage from './pages/FeedbackPage.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import LiveMapPage from './pages/LiveMapPage.tsx';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setSelectedReport(null); // Clear selected report on navigation
    setIsSidebarOpen(false); // Close sidebar on navigation
    window.scrollTo(0, 0); // Scroll to top on page change
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate(Page.Dashboard);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate(Page.Home);
  };
  
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setCurrentPage(Page.ViewReport);
  };

  const syncPendingReports = async () => {
    if (navigator.onLine) {
      const pendingReports = await db.getPendingReports();
      if (pendingReports.length > 0) {
        console.log(`Syncing ${pendingReports.length} pending reports...`);
        for (const report of pendingReports) {
          try {
            await api.submitReport(report);
            await db.deletePendingReport(report.timestamp);
            console.log('Synced and deleted pending report:', report.title);
          } catch (error) {
            console.error('Failed to sync report:', report.title, error);
          }
        }
      }
    }
  };

  useEffect(() => {
    // Attempt to sync on load
    syncPendingReports();

    // Listen for online/offline status changes
    window.addEventListener('online', syncPendingReports);
    return () => {
      window.removeEventListener('online', syncPendingReports);
    };
  }, []);


  const renderPage = () => {
    if (selectedReport && currentPage === Page.ViewReport) {
      return <ReportDetailPage report={selectedReport} currentUser={currentUser} onBack={() => navigate(Page.Dashboard)} />;
    }

    switch (currentPage) {
      case Page.Home:
        return <HomePage navigate={() => navigate(currentUser ? Page.Dashboard : Page.Login)} />;
      case Page.Login:
        return <LoginPage onLogin={handleLogin} navigateToSignUp={() => navigate(Page.SignUp)} />;
      case Page.SignUp:
        return <SignUpPage onSignUpSuccess={() => navigate(Page.Login)} navigateToLogin={() => navigate(Page.Login)} />;
      case Page.AdminLogin:
        return <AdminLoginPage onLogin={handleLogin} />;
      case Page.Dashboard:
        if (currentUser?.role === UserRole.Admin) {
          return <AdminDashboard viewReport={handleViewReport} />;
        }
        if (currentUser?.role === UserRole.Citizen) {
          return <CitizenDashboard currentUser={currentUser} viewReport={handleViewReport} navigateToSubmitReport={() => navigate(Page.SubmitReport)} />;
        }
        navigate(Page.Login); // If no user, redirect to login
        return null;
      case Page.SubmitReport:
        return currentUser ? <SubmitReportPage currentUser={currentUser} onReportSubmitted={() => navigate(Page.Dashboard)} onBack={() => navigate(Page.Dashboard)} /> : null;
      case Page.ViewReport: // Fallback if no report is selected
        return <p>No report selected. Please go back to the dashboard.</p>;
      case Page.Workers:
        return <WorkersPage />;
      case Page.Users:
        return <UsersPage />;
      case Page.Contact:
        return <ContactPage onSubmit={() => navigate(Page.Home)} />;
      case Page.Feedback:
        return <FeedbackPage onSubmit={() => navigate(Page.Home)} currentUser={currentUser} />;
      case Page.LiveMap:
        return <LiveMapPage viewReport={handleViewReport} />;
      default:
        return <HomePage navigate={() => navigate(currentUser ? Page.Dashboard : Page.Login)} />;
    }
  };

  const isFullPageMap = currentPage === Page.LiveMap;

  return (
    <div className={`min-h-screen ${isFullPageMap ? 'flex flex-col' : ''}`}>
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        navigate={navigate} 
        theme={theme}
        toggleTheme={toggleTheme}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className={`flex flex-1 pt-16 ${isFullPageMap ? 'overflow-hidden' : ''}`}>
        <Sidebar 
          currentUser={currentUser} 
          navigate={navigate}
          currentPage={currentPage}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className={`flex-1 transition-all duration-300 ease-in-out ${isFullPageMap ? '' : 'p-4 sm:p-6 md:p-8'} lg:ml-64`}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;