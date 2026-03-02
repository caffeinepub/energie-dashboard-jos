import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, GitCompare, PlusCircle, List, LineChart } from 'lucide-react';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import SummaryOverview from './components/SummaryOverview';
import ConsumptionChart from './components/ConsumptionChart';
import CostChart from './components/CostChart';
import ComparisonView from './components/ComparisonView';
import UsageAnalysisView from './components/UsageAnalysisView';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import YearlyTaxCard from './components/YearlyTaxCard';
import YearlyPriceCard from './components/YearlyPriceCard';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import type { Entry } from './backend';

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const appId = encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'energie-dashboard');

  // Show nothing while checking stored identity to avoid flash
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/generated/energy-logo.dim_256x256.png"
            alt="Energie Dashboard Logo"
            className="w-14 h-14 rounded-xl animate-pulse"
          />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with dashboard name and logout */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Year Selector Bar */}
        <div className="mb-6 flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Jaar</span>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-muted-foreground">Selecteer jaar:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2 py-1 text-sm rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Overview */}
        <SummaryOverview year={selectedYear} />

        {/* Tabs for different sections */}
        <Tabs defaultValue="charts" className="mt-6">
          <TabsList className="bg-card border border-border mb-6 p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="charts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-muted">
              <BarChart3 className="w-4 h-4" />
              Grafieken
            </TabsTrigger>
            <TabsTrigger value="analyse" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-muted">
              <LineChart className="w-4 h-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-muted">
              <List className="w-4 h-4" />
              Gegevensinvoer
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-muted">
              <GitCompare className="w-4 h-4" />
              Vergelijking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <ConsumptionChart year={selectedYear} />
            <CostChart year={selectedYear} />
          </TabsContent>

          <TabsContent value="analyse">
            <UsageAnalysisView year={selectedYear} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {/* Yearly Settings: Prices + Tax side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YearlyPriceCard year={selectedYear} />
              <YearlyTaxCard year={selectedYear} />
            </div>

            {/* Monthly Entry Form + List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">{editEntry ? 'Invoer bewerken' : 'Maandelijkse invoer toevoegen'}</h2>
                </div>
                <EntryForm
                  editEntry={editEntry}
                  onCancelEdit={() => setEditEntry(null)}
                  defaultYear={selectedYear}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <List className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Maandelijkse Invoer</h2>
                </div>
                <EntryList onEdit={setEditEntry} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <ComparisonView />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Energie Dashboard — Dutch Energy Cost Calculator</span>
          <span className="flex items-center gap-1">
            Gebouwd met{' '}
            <span className="text-gas">♥</span>{' '}
            via{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
