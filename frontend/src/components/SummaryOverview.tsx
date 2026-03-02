import { useEffect, useState } from 'react';
import { Flame, Zap, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllEntries, useGetYearlyPrices } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { Consumption } from '../backend';

interface SummaryOverviewProps {
  year: number;
}

function KpiCard({
  label,
  value,
  unit,
  icon,
  colorClass,
  glowClass,
  gradientClass,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
  gradientClass: string;
}) {
  return (
    <Card className={`bg-card border-border shadow-card ${glowClass} transition-shadow hover:shadow-card-hover`}>
      <CardContent className={`p-5 rounded-xl ${gradientClass}`}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className={colorClass}>{icon}</span>
        </div>
        <div className={`kpi-number ${colorClass}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{unit}</div>
      </CardContent>
    </Card>
  );
}

export default function SummaryOverview({ year }: SummaryOverviewProps) {
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { data: yearlyPrices, isLoading: pricesLoading } = useGetYearlyPrices(year);
  const { actor } = useActor();

  const [consumptionMap, setConsumptionMap] = useState<Map<number, Consumption>>(new Map());
  const [loadingConsumption, setLoadingConsumption] = useState(false);

  const yearEntries = entries?.filter((e) => e.year === year) ?? [];

  // Fetch consumption for all months with entries in this year
  useEffect(() => {
    if (!actor || !entries) return;

    const monthsWithEntries = yearEntries.map((e) => e.month);
    if (monthsWithEntries.length === 0) {
      setConsumptionMap(new Map());
      return;
    }

    setLoadingConsumption(true);
    Promise.all(
      monthsWithEntries.map(async (month) => {
        try {
          const c = await actor.calculateMonthlyConsumption(year, month);
          return { month, consumption: c };
        } catch {
          return { month, consumption: null };
        }
      })
    ).then((results) => {
      const map = new Map<number, Consumption>();
      results.forEach(({ month, consumption }) => {
        if (consumption) map.set(month, consumption);
      });
      setConsumptionMap(map);
      setLoadingConsumption(false);
    });
  }, [actor, entries, year]);

  const fmt = (n: number) =>
    n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (entriesLoading || pricesLoading || loadingConsumption) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (yearEntries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm">
            Nog geen gegevens voor {year}. Voeg maandelijkse meterstanden toe om het overzicht te zien.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compute costs frontend-side: consumption delta × yearly price
  const gasPrice = yearlyPrices?.gasPricePerM3 ?? 0;
  const elecPrice = yearlyPrices?.elecPricePerKwh ?? 0;

  let totalGasCost = 0;
  let totalElecCost = 0;
  let totalOtherCosts = 0;
  let monthsWithConsumption = 0;

  yearEntries.forEach((entry) => {
    const consumption = consumptionMap.get(entry.month);
    if (consumption) {
      totalGasCost += consumption.gas * gasPrice;
      totalElecCost += (consumption.electricityNormal + consumption.electricityHigh) * elecPrice;
      monthsWithConsumption++;
    }
    totalOtherCosts += entry.otherCosts ?? 0;
  });

  const totalEnergyCost = totalGasCost + totalElecCost + totalOtherCosts;

  // Prognosis: extrapolate from months with consumption data
  const prognosisMonths = monthsWithConsumption;
  const prognosisGas = prognosisMonths > 0 ? (totalGasCost / prognosisMonths) * 12 : 0;
  const prognosisElec = prognosisMonths > 0 ? (totalElecCost / prognosisMonths) * 12 : 0;
  const prognosisOther = prognosisMonths > 0 ? (totalOtherCosts / prognosisMonths) * 12 : 0;
  const prognosisTotal = prognosisGas + prognosisElec + prognosisOther;

  const noPrices = !yearlyPrices;

  return (
    <div className="space-y-4">
      {/* Warning if no prices set */}
      {noPrices && (
        <Card className="bg-card border-gas/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-gas shrink-0" />
            <p className="text-xs text-muted-foreground">
              Geen jaarlijkse prijzen ingesteld voor {year}. Stel prijzen in bij "Gegevensinvoer" → "Jaarlijkse Prijzen" om kosten te berekenen.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Gaskosten"
          value={`€ ${fmt(totalGasCost)}`}
          unit={`${year} tot nu toe`}
          icon={<Flame className="w-5 h-5" />}
          colorClass="text-gas"
          glowClass="hover:shadow-gas-glow"
          gradientClass="bg-gradient-to-br from-gas/5 to-transparent"
        />
        <KpiCard
          label="Elektriciteitskosten"
          value={`€ ${fmt(totalElecCost)}`}
          unit={`${year} tot nu toe`}
          icon={<Zap className="w-5 h-5" />}
          colorClass="text-elec"
          glowClass="hover:shadow-elec-glow"
          gradientClass="bg-gradient-to-br from-elec/5 to-transparent"
        />
        <KpiCard
          label="Overige Kosten"
          value={`€ ${fmt(totalOtherCosts)}`}
          unit="gas + elektriciteit"
          icon={<Receipt className="w-5 h-5" />}
          colorClass="text-primary"
          glowClass=""
          gradientClass="bg-gradient-to-br from-primary/5 to-transparent"
        />
        <KpiCard
          label="Totale Kosten"
          value={`€ ${fmt(totalEnergyCost)}`}
          unit={`${year} tot nu toe`}
          icon={<TrendingUp className="w-5 h-5" />}
          colorClass="text-foreground"
          glowClass=""
          gradientClass="bg-gradient-to-br from-muted/30 to-transparent"
        />
      </div>

      {/* Prognosis */}
      {prognosisMonths > 0 && (
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Jaarprognose ({prognosisMonths}/12 maanden)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Flame className="w-3 h-3 text-gas" />
                  Geschatte gaskosten
                </span>
                <span className="font-mono text-gas">€ {fmt(prognosisGas)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3 h-3 text-elec" />
                  Geschatte elektriciteitskosten
                </span>
                <span className="font-mono text-elec">€ {fmt(prognosisElec)}</span>
              </div>
              {prognosisOther !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Geschatte overige kosten</span>
                  <span className="font-mono">€ {fmt(prognosisOther)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border/50 font-semibold">
                <span className="text-foreground">Geschat jaartotaal</span>
                <span className="font-mono text-primary">€ {fmt(prognosisTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
