import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { CityMapView } from './features/CityMapView';
import { ReportForm } from './features/ReportForm';
import { CitizenReports } from './features/CitizenReports';
import { OfficerQueue } from './features/OfficerQueue';
import { AnalyticsDashboard } from './features/AnalyticsDashboard';
import { api, getStoredUser, clearAuth } from './api';
import { User, Zone, Category, Issue, Report, AnalyticsSummary } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('city_map');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Core Data
  const [zones, setZones] = useState<Zone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Fetch Core Data
  const fetchData = async () => {
    try {
      const [fetchedZones, fetchedCategories, fetchedIssues, fetchedAnalytics] = await Promise.all([
        api.getZones().catch(() => []),
        api.getCategories().catch(() => []),
        api.getIssues().catch(() => []),
        api.getAnalytics().catch(() => null)
      ]);
      setZones(fetchedZones);
      setCategories(fetchedCategories);
      setIssues(fetchedIssues);
      setAnalytics(fetchedAnalytics);

      if (currentUser) {
        const reports = await api.getMyReports().catch(() => []);
        setMyReports(reports);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setMyReports([]);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    fetchData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'city_map' && (
          <CityMapView
            issues={issues}
            zones={zones}
            categories={categories}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <ReportForm
            categories={categories}
            zones={zones}
            onReportSubmitted={() => {
              fetchData();
              setActiveTab('my_reports');
            }}
          />
        )}

        {activeTab === 'my_reports' && (
          <CitizenReports
            reports={myReports}
            issues={issues}
            categories={categories}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'officer_queue' && (
          <OfficerQueue
            issues={issues}
            zones={zones}
            categories={categories}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
