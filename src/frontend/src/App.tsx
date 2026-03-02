import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Sidebar, { TopBar } from "./components/Sidebar";
import type { Page } from "./components/Sidebar";
import AnalysePage from "./components/pages/AnalysePage";
import DashboardPage from "./components/pages/DashboardPage";
import DataInvoerPage from "./components/pages/DataInvoerPage";
import GrafiekenPage from "./components/pages/GrafiekenPage";
import InstellingenPage from "./components/pages/InstellingenPage";
import VergelijkingPage from "./components/pages/VergelijkingPage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

const CURRENT_YEAR = new Date().getFullYear();

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/generated/energy-logo.dim_256x256.png"
          alt="Energie Dashboard"
          className="w-16 h-16 rounded-2xl opacity-80 animate-pulse"
        />
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Laden...</span>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardName, setDashboardName] = useState("Energie Dashboard Jos");

  const { data: profile } = useGetCallerUserProfile();

  useEffect(() => {
    if (profile?.dashboardName) {
      setDashboardName(profile.dashboardName);
    }
  }, [profile]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardPage
            year={selectedYear}
            onNavigate={setCurrentPage}
            dashboardName={dashboardName}
          />
        );
      case "data-invoer":
        return <DataInvoerPage year={selectedYear} />;
      case "grafieken":
        return <GrafiekenPage year={selectedYear} />;
      case "analyse":
        return <AnalysePage year={selectedYear} />;
      case "vergelijking":
        return <VergelijkingPage year={selectedYear} />;
      case "instellingen":
        return (
          <InstellingenPage
            year={selectedYear}
            onDashboardNameChange={setDashboardName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        dashboardName={dashboardName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuOpen={() => setSidebarOpen(true)}
          dashboardName={dashboardName}
          selectedYear={selectedYear}
          currentPage={currentPage}
        />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) return <LoadingScreen />;
  if (!identity) return <LoginScreen />;

  return (
    <>
      <AppContent />
      <Toaster richColors position="top-right" />
    </>
  );
}
