import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PersonaDrawer } from './components/PersonaDrawer';
import { CityMapView } from './features/CityMapView';
import { ReportForm } from './features/ReportForm';
import { CitizenReports } from './features/CitizenReports';
import { OfficerQueue } from './features/OfficerQueue';
import { AnalyticsDashboard } from './features/AnalyticsDashboard';
import { api, getStoredUser, clearAuth, setAuthToken } from './api';
import { User, Zone, Category, Issue, Report, AnalyticsSummary, DemoPersona, ZonePerformance } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('city_map');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPersonaDrawerOpen, setIsPersonaDrawerOpen] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string | undefined>(undefined);

  // Core Data
  const [zones, setZones] = useState<Zone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [performances, setPerformances] = useState<ZonePerformance[]>([]);

  // Fetch Core Data
  const fetchData = async () => {
    try {
      const [
        fetchedZones,
        fetchedCategories,
        fetchedIssues,
        fetchedAnalytics,
        fetchedPersonas,
        fetchedPerformances
      ] = await Promise.all([
        api.getZones().catch(() => []),
        api.getCategories().catch(() => []),
        api.getIssues().catch(() => []),
        api.getAnalytics().catch(() => null),
        api.getDemoPersonas().catch(() => []),
        api.getRelativePerformance().catch(() => [])
      ]);

      setZones(fetchedZones);
      setCategories(fetchedCategories);
      setIssues(fetchedIssues);
      setAnalytics(fetchedAnalytics);
      setPersonas(fetchedPersonas);
      setPerformances(fetchedPerformances);

      if (currentUser) {
        const reports = await api.getMyReports().catch(() => []);
        setMyReports(reports);
      } else {
        setMyReports([]);
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

  const handlePersonaSelected = (user: User, navigateTab: string, selectedZoneId?: string) => {
    setCurrentUser(user);
    setActiveTab(navigateTab);
    setSelectedZoneFilter(selectedZoneId);
    fetchData();
  };

  const handleSelectZoneHeadFromAnalytics = async (email: string, zoneId: string) => {
    try {
      const res = await api.login(email, 'head123');
      setAuthToken(res.access_token, res.user);
      setCurrentUser(res.user);
      setSelectedZoneFilter(zoneId);
      fetchData();
    } catch (e: any) {
      console.error('Zone head login error', e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onRoleSwitch={handleLoginSuccess}
        onOpenPersonaDrawer={() => setIsPersonaDrawerOpen(true)}
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
            selectedZoneId={selectedZoneFilter}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
            performances={performances}
            currentUser={currentUser}
            onSelectZoneHead={handleSelectZoneHeadFromAnalytics}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <PersonaDrawer
        isOpen={isPersonaDrawerOpen}
        onClose={() => setIsPersonaDrawerOpen(false)}
        personas={personas}
        performances={performances}
        onSelectPersona={handlePersonaSelected}
      />
    </div>
  );
};

