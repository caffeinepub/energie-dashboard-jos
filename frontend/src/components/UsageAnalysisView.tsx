import { useEffect, useState } from 'react';
import { Flame, Zap, BarChart2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllEntries } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { Consumption } from '../backend';

const MONTH_NAMES = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

interface UsageAnalysisViewProps {
  year: number;
}

interface MonthlyUsage {
  month: number;
  label: string;
  gas: number | null;
  elecNormal: number | null;
  elecHigh: number | null;
  elecTotal: number | null;
}

export default function UsageAnalysisView({ year }: UsageAnalysisViewProps) {
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { actor } = useActor();
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [loadingConsumption, setLoadingConsumption] = useState(false);

  const yearEntries = entries?.filter((e) => e.year === year) ?? [];

  useEffect(() => {
    if (!actor || !entries) return;

    const monthsWithEntries = yearEntries.map((e) => e.month);

    if (monthsWithEntries.length === 0) {
      setMonthlyUsage([]);
      return;
    }

    setLoadingConsumption(true);

    Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const month = i + 1;
        const label = MONTH_NAMES[i];
        if (!monthsWithEntries.includes(month)) {
          return { month, label, gas: null, elecNormal: null, elecHigh: null, elecTotal: null };
        }
        try {
          const c: Consumption | null = await actor.calculateMonthlyConsumption(year, month);
          if (!c) return { month, label, gas: null, elecNormal: null, elecHigh: null, elecTotal: null };
          return {
            month,
            label,
            gas: c.gas,
            elecNormal: c.electricityNormal,
            elecHigh: c.electricityHigh,
            elecTotal: c.electricityNormal + c.electricityHigh,
          };
        } catch {
          return { month, label, gas: null, elecNormal: null, elecHigh: null, elecTotal: null };
        }
      })
    ).then((results) => {
      setMonthlyUsage(results);
      setLoadingConsumption(false);
    });
  }, [actor, entries, year]);

  const fmt1 = (n: number | null) =>
    n === null ? '—' : n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Totals (only months with data)
  const totalGas = monthlyUsage.reduce((sum, m) => sum + (m.gas ?? 0), 0);
  const totalElecNormal = monthlyUsage.reduce((sum, m) => sum + (m.elecNormal ?? 0), 0);
  const totalElecHigh = monthlyUsage.reduce((sum, m) => sum + (m.elecHigh ?? 0), 0);
  const totalElec = monthlyUsage.reduce((sum, m) => sum + (m.elecTotal ?? 0), 0);
  const hasAnyData = monthlyUsage.some((m) => m.gas !== null || m.elecTotal !== null);

  if (entriesLoading || loadingConsumption) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg bg-muted" />
        <Skeleton className="h-64 w-full rounded-xl bg-muted" />
      </div>
    );
  }

  if (yearEntries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm">
            Nog geen gegevens voor {year}. Voeg maandelijkse meterstanden toe om de analyse te zien.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-card hover:shadow-gas-glow transition-shadow">
          <CardContent className="p-5 bg-gradient-to-br from-gas/5 to-transparent rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gas totaal</span>
              <Flame className="w-5 h-5 text-gas" />
            </div>
            <div className="kpi-number text-gas">{fmt1(totalGas)}</div>
            <div className="text-xs text-muted-foreground mt-1">m³ in {year}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card hover:shadow-elec-glow transition-shadow">
          <CardContent className="p-5 bg-gradient-to-br from-elec/5 to-transparent rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elec. laag</span>
              <Zap className="w-5 h-5 text-elec" />
            </div>
            <div className="kpi-number text-elec">{fmt1(totalElecNormal)}</div>
            <div className="text-xs text-muted-foreground mt-1">kWh normaal/laag in {year}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card hover:shadow-elec-glow transition-shadow">
          <CardContent className="p-5 bg-gradient-to-br from-elec/5 to-transparent rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elec. hoog</span>
              <Zap className="w-5 h-5 text-elec" />
            </div>
            <div className="kpi-number text-elec">{fmt1(totalElecHigh)}</div>
            <div className="text-xs text-muted-foreground mt-1">kWh hoog in {year}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card hover:shadow-elec-glow transition-shadow">
          <CardContent className="p-5 bg-gradient-to-br from-elec/5 to-transparent rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elec. totaal</span>
              <Zap className="w-5 h-5 text-elec" />
            </div>
            <div className="kpi-number text-elec">{fmt1(totalElec)}</div>
            <div className="text-xs text-muted-foreground mt-1">kWh totaal in {year}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown table */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Maandelijks Verbruik — {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Maand
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gas">
                    <span className="flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3" />
                      Gas (m³)
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-elec">
                    <span className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      Elec. Laag (kWh)
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-elec">
                    <span className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      Elec. Hoog (kWh)
                    </span>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-elec">
                    <span className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      Elec. Totaal (kWh)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyUsage.map((row) => {
                  const hasData = row.gas !== null || row.elecTotal !== null;
                  return (
                    <tr
                      key={row.month}
                      className={`border-b border-border/50 transition-colors ${hasData ? 'hover:bg-muted/20' : 'opacity-40'}`}
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {row.label}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${row.gas !== null ? 'text-gas font-semibold' : 'text-muted-foreground'}`}>
                        {fmt1(row.gas)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${row.elecNormal !== null ? 'text-elec font-semibold' : 'text-muted-foreground'}`}>
                        {fmt1(row.elecNormal)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${row.elecHigh !== null ? 'text-elec font-semibold' : 'text-muted-foreground'}`}>
                        {fmt1(row.elecHigh)}
                      </td>
                      <td className={`px-5 py-3 text-right font-mono ${row.elecTotal !== null ? 'text-elec font-semibold' : 'text-muted-foreground'}`}>
                        {fmt1(row.elecTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {hasAnyData && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/20">
                    <td className="px-5 py-3 font-bold text-foreground text-xs uppercase tracking-wider">
                      Totaal
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gas">
                      {fmt1(totalGas)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-elec">
                      {fmt1(totalElecNormal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-elec">
                      {fmt1(totalElecHigh)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-elec">
                      {fmt1(totalElec)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
