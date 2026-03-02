import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GitCompare, Flame, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetYearlyTax, useGetAllEntries, useGetYearlyPrices } from '../hooks/useQueries';
import { DEFAULT_GAS_ENERGIEBELASTING, DEFAULT_ELEC_ENERGIEBELASTING } from './YearlyTaxCard';
import { useActor } from '../hooks/useActor';
import type { Consumption } from '../backend';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// Literal colors for recharts
const GAS_A_COLOR = '#f59e0b';
const ELEC_A_COLOR = '#14b8a6';

export default function ComparisonView() {
  const [yearA, setYearA] = useState(CURRENT_YEAR - 1);
  const [yearB, setYearB] = useState(CURRENT_YEAR);

  const { data: taxA } = useGetYearlyTax(yearA);
  const { data: taxB } = useGetYearlyTax(yearB);
  const { data: pricesA } = useGetYearlyPrices(yearA);
  const { data: pricesB } = useGetYearlyPrices(yearB);
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { actor } = useActor();

  const [consumptionA, setConsumptionA] = useState<(Consumption | null)[]>(Array(12).fill(null));
  const [consumptionB, setConsumptionB] = useState<(Consumption | null)[]>(Array(12).fill(null));
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Fetch consumption for yearA
  useEffect(() => {
    if (!actor || !entries) return;
    const months = entries.filter((e) => e.year === yearA).map((e) => e.month);
    if (months.length === 0) { setConsumptionA(Array(12).fill(null)); return; }
    setLoadingA(true);
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        if (!months.includes(month)) return Promise.resolve(null);
        return actor.calculateMonthlyConsumption(yearA, month).catch(() => null);
      })
    ).then((results) => {
      setConsumptionA(results);
      setLoadingA(false);
    });
  }, [actor, entries, yearA]);

  // Fetch consumption for yearB
  useEffect(() => {
    if (!actor || !entries) return;
    const months = entries.filter((e) => e.year === yearB).map((e) => e.month);
    if (months.length === 0) { setConsumptionB(Array(12).fill(null)); return; }
    setLoadingB(true);
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        if (!months.includes(month)) return Promise.resolve(null);
        return actor.calculateMonthlyConsumption(yearB, month).catch(() => null);
      })
    ).then((results) => {
      setConsumptionB(results);
      setLoadingB(false);
    });
  }, [actor, entries, yearB]);

  const isLoading = entriesLoading || loadingA || loadingB;

  const fmt = (n: number) =>
    n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Use stored yearly tax rates or defaults
  const gasRateA = taxA?.energyTaxGas ?? DEFAULT_GAS_ENERGIEBELASTING;
  const elecRateA = taxA?.energyTaxElec ?? DEFAULT_ELEC_ENERGIEBELASTING;
  const gasRateB = taxB?.energyTaxGas ?? DEFAULT_GAS_ENERGIEBELASTING;
  const elecRateB = taxB?.energyTaxElec ?? DEFAULT_ELEC_ENERGIEBELASTING;

  // Use stored yearly unit prices
  const gasPriceA = pricesA?.gasPricePerM3 ?? 0;
  const elecPriceA = pricesA?.elecPricePerKwh ?? 0;
  const gasPriceB = pricesB?.gasPricePerM3 ?? 0;
  const elecPriceB = pricesB?.elecPricePerKwh ?? 0;

  // Compute total consumption from meter reading deltas
  const totalGasA = consumptionA.reduce((s, c) => s + (c?.gas ?? 0), 0);
  const totalElecA = consumptionA.reduce((s, c) => s + ((c?.electricityNormal ?? 0) + (c?.electricityHigh ?? 0)), 0);
  const totalGasB = consumptionB.reduce((s, c) => s + (c?.gas ?? 0), 0);
  const totalElecB = consumptionB.reduce((s, c) => s + ((c?.electricityNormal ?? 0) + (c?.electricityHigh ?? 0)), 0);

  const entriesA = entries?.filter((e) => e.year === yearA) ?? [];
  const entriesB = entries?.filter((e) => e.year === yearB) ?? [];
  const totalOtherCostsA = entriesA.reduce((s, e) => s + (e.otherCosts ?? 0), 0);
  const totalOtherCostsB = entriesB.reduce((s, e) => s + (e.otherCosts ?? 0), 0);

  // Compute energy costs frontend-side: consumption × yearly price
  const gasCostA = totalGasA * gasPriceA;
  const elecCostA = totalElecA * elecPriceA;
  const gasCostB = totalGasB * gasPriceB;
  const elecCostB = totalElecB * elecPriceB;

  const gasEnergiebelastingA = totalGasA * gasRateA;
  const elecEnergiebelastingA = totalElecA * elecRateA;
  const gasEnergiebelastingB = totalGasB * gasRateB;
  const elecEnergiebelastingB = totalElecB * elecRateB;

  const totalA = gasCostA + elecCostA + totalOtherCostsA;
  const totalB = gasCostB + elecCostB + totalOtherCostsB;
  const diff = totalB - totalA;

  const barData = [
    {
      category: 'Gaskosten',
      [yearA]: parseFloat(gasCostA.toFixed(2)),
      [yearB]: parseFloat(gasCostB.toFixed(2)),
    },
    {
      category: 'Elec Kosten',
      [yearA]: parseFloat(elecCostA.toFixed(2)),
      [yearB]: parseFloat(elecCostB.toFixed(2)),
    },
    {
      category: 'Gas Belasting',
      [yearA]: parseFloat(gasEnergiebelastingA.toFixed(2)),
      [yearB]: parseFloat(gasEnergiebelastingB.toFixed(2)),
    },
    {
      category: 'Elec Belasting',
      [yearA]: parseFloat(elecEnergiebelastingA.toFixed(2)),
      [yearB]: parseFloat(elecEnergiebelastingB.toFixed(2)),
    },
    {
      category: 'Totaal',
      [yearA]: parseFloat(totalA.toFixed(2)),
      [yearB]: parseFloat(totalB.toFixed(2)),
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-card text-sm">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2">
              <span style={{ color: p.fill }}>●</span>
              <span className="text-muted-foreground">{p.dataKey}:</span>
              <span className="font-mono font-medium" style={{ color: p.fill }}>€ {p.value?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const tableRows = [
    {
      label: 'Totale Energiekosten',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      colorClass: 'text-foreground',
      valA: totalA,
      valB: totalB,
    },
    {
      label: 'Gaskosten',
      icon: <Flame className="w-3.5 h-3.5 text-gas" />,
      colorClass: 'text-gas',
      valA: gasCostA,
      valB: gasCostB,
    },
    {
      label: 'Elektriciteitskosten',
      icon: <Zap className="w-3.5 h-3.5 text-elec" />,
      colorClass: 'text-elec',
      valA: elecCostA,
      valB: elecCostB,
    },
    {
      label: 'Overige Kosten',
      icon: <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />,
      colorClass: 'text-muted-foreground',
      valA: totalOtherCostsA,
      valB: totalOtherCostsB,
    },
    {
      label: 'Energiebelasting Gas',
      icon: <Flame className="w-3.5 h-3.5 text-gas" />,
      colorClass: 'text-gas',
      valA: gasEnergiebelastingA,
      valB: gasEnergiebelastingB,
    },
    {
      label: 'Energiebelasting Elektriciteit',
      icon: <Zap className="w-3.5 h-3.5 text-elec" />,
      colorClass: 'text-elec',
      valA: elecEnergiebelastingA,
      valB: elecEnergiebelastingB,
    },
    {
      label: 'Totale Energiebelasting',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      colorClass: 'text-foreground',
      valA: gasEnergiebelastingA + elecEnergiebelastingA,
      valB: gasEnergiebelastingB + elecEnergiebelastingB,
    },
    {
      label: 'Totaal Gasverbruik',
      icon: <Flame className="w-3.5 h-3.5 text-gas" />,
      colorClass: 'text-gas',
      valA: totalGasA,
      valB: totalGasB,
      unit: 'm³',
    },
    {
      label: 'Totaal Elektriciteitsverbruik',
      icon: <Zap className="w-3.5 h-3.5 text-elec" />,
      colorClass: 'text-elec',
      valA: totalElecA,
      valB: totalElecB,
      unit: 'kWh',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Year Selectors */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Jaarlijkse Vergelijking
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GAS_A_COLOR }} />
              <span className="text-sm text-muted-foreground">Jaar A:</span>
              <Select value={yearA.toString()} onValueChange={(v) => setYearA(parseInt(v))}>
                <SelectTrigger className="w-28 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEC_A_COLOR }} />
              <span className="text-sm text-muted-foreground">Jaar B:</span>
              <Select value={yearB.toString()} onValueChange={(v) => setYearB(parseInt(v))}>
                <SelectTrigger className="w-28 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isLoading && (totalA > 0 || totalB > 0) && (
              <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${diff > 0 ? 'bg-destructive/10 text-destructive' : diff < 0 ? 'bg-elec/10 text-elec' : 'bg-muted text-muted-foreground'}`}>
                <TrendingUp className="w-4 h-4" />
                {diff > 0 ? '+' : ''}{fmt(diff)} verschil ({yearB} vs {yearA})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl bg-muted" />
          <Skeleton className="h-80 rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Table */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Kostenoverzicht
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground pl-5">Categorie</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold" style={{ color: GAS_A_COLOR }}>{yearA}</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-bold" style={{ color: ELEC_A_COLOR }}>{yearB}</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground pr-5">Verschil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => {
                    const rowDiff = row.valB - row.valA;
                    const isConsumption = 'unit' in row;
                    return (
                      <TableRow key={row.label} className="border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="pl-5 py-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            {row.icon}
                            <span className="text-muted-foreground">{row.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm py-2" style={{ color: GAS_A_COLOR }}>
                          {isConsumption ? `${row.valA.toFixed(1)} ${row.unit}` : `€ ${fmt(row.valA)}`}
                        </TableCell>
                        <TableCell className="font-mono text-sm py-2" style={{ color: ELEC_A_COLOR }}>
                          {isConsumption ? `${row.valB.toFixed(1)} ${row.unit}` : `€ ${fmt(row.valB)}`}
                        </TableCell>
                        <TableCell className={`font-mono text-xs py-2 pr-5 ${rowDiff > 0 ? 'text-destructive' : rowDiff < 0 ? 'text-elec' : 'text-muted-foreground'}`}>
                          {isConsumption
                            ? `${rowDiff > 0 ? '+' : ''}${rowDiff.toFixed(1)} ${row.unit}`
                            : `${rowDiff > 0 ? '+' : ''}€ ${fmt(rowDiff)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Kostenvergelijking
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-5">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `€${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: value === yearA.toString() ? GAS_A_COLOR : ELEC_A_COLOR, fontSize: 12 }}>
                        {value}
                      </span>
                    )}
                  />
                  <Bar dataKey={yearA.toString()} fill={GAS_A_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey={yearB.toString()} fill={ELEC_A_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
