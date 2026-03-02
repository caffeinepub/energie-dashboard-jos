import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllEntries, useGetYearlyPrices } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { Consumption } from '../backend';

const MONTH_LABELS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const GAS_COLOR = '#f59e0b';
const ELEC_COLOR = '#14b8a6';
const OTHER_COLOR = '#a78bfa';

interface CostChartProps {
  year: number;
}

export default function CostChart({ year }: CostChartProps) {
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { data: yearlyPrices } = useGetYearlyPrices(year);
  const { actor } = useActor();
  const [consumptionData, setConsumptionData] = useState<(Consumption | null)[]>(Array(12).fill(null));
  const [loadingConsumption, setLoadingConsumption] = useState(false);

  // Use stored yearly prices; default to 0 if not set (will show 0 cost)
  const yearGasPrice = yearlyPrices?.gasPricePerM3 ?? 0;
  const yearElecPrice = yearlyPrices?.elecPricePerKwh ?? 0;

  // Fetch consumption for all months that have entries
  useEffect(() => {
    if (!actor || !entries) return;

    const monthsWithEntries = entries
      .filter((e) => e.year === year)
      .map((e) => e.month);

    if (monthsWithEntries.length === 0) {
      setConsumptionData(Array(12).fill(null));
      return;
    }

    setLoadingConsumption(true);
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        if (!monthsWithEntries.includes(month)) return Promise.resolve(null);
        return actor.calculateMonthlyConsumption(year, month).catch(() => null);
      })
    ).then((results) => {
      setConsumptionData(results);
      setLoadingConsumption(false);
    });
  }, [actor, entries, year]);

  const chartData = MONTH_LABELS.map((label, idx) => {
    const month = idx + 1;
    const entry = entries?.find((e) => e.year === year && e.month === month);
    const consumption = consumptionData[idx];

    if (!entry || !consumption) {
      return {
        month: label,
        gasCost: null,
        electricityCost: null,
        overigeKosten: null,
        hasData: false,
      };
    }

    // Cost = consumption delta × yearly price per unit
    const gasCost = parseFloat((consumption.gas * yearGasPrice).toFixed(2));
    const elecCost = parseFloat(
      ((consumption.electricityNormal + consumption.electricityHigh) * yearElecPrice).toFixed(2)
    );
    const otherCost = entry.otherCosts ?? 0;

    return {
      month: label,
      gasCost,
      electricityCost: elecCost,
      overigeKosten: otherCost !== 0 ? parseFloat(otherCost.toFixed(2)) : null,
      hasData: true,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-card text-sm">
          <p className="font-semibold text-foreground mb-2">{label} {year}</p>
          {payload.map((p: any) => (
            p.value !== null && (
              <div key={p.dataKey} className="flex items-center gap-2">
                <span style={{ color: p.color }}>●</span>
                <span className="text-muted-foreground">
                  {p.dataKey === 'gasCost' ? 'Gas' : p.dataKey === 'electricityCost' ? 'Elektriciteit' : 'Overige'}:
                </span>
                <span className="font-mono font-medium" style={{ color: p.color }}>
                  € {p.value?.toFixed(2)}
                </span>
              </div>
            )
          ))}
          {payload[0]?.payload?.hasData === false && (
            <p className="text-xs text-muted-foreground mt-1 italic">Geen data voor deze maand</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (entriesLoading || loadingConsumption) {
    return <Skeleton className="h-72 w-full rounded-xl bg-muted" />;
  }

  if (!yearlyPrices) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Maandelijkse Kosten (€) — {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm text-muted-foreground">
            Stel eerst de jaarlijkse prijzen in bij "Gegevensinvoer" → "Jaarlijkse Prijzen" om de kosten te berekenen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasOtherCosts = chartData.some((d) => d.overigeKosten !== null);

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Maandelijkse Kosten (€) — {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Legend
              formatter={(value) => {
                if (value === 'gasCost') return <span style={{ color: GAS_COLOR, fontSize: 12 }}>Gas Kosten (€)</span>;
                if (value === 'electricityCost') return <span style={{ color: ELEC_COLOR, fontSize: 12 }}>Elektriciteit Kosten (€)</span>;
                return <span style={{ color: OTHER_COLOR, fontSize: 12 }}>Overige Kosten (€)</span>;
              }}
            />
            <Line
              type="monotone"
              dataKey="gasCost"
              stroke={GAS_COLOR}
              strokeWidth={2.5}
              dot={{ fill: GAS_COLOR, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: GAS_COLOR }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="electricityCost"
              stroke={ELEC_COLOR}
              strokeWidth={2.5}
              dot={{ fill: ELEC_COLOR, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: ELEC_COLOR }}
              connectNulls={false}
            />
            {hasOtherCosts && (
              <Line
                type="monotone"
                dataKey="overigeKosten"
                stroke={OTHER_COLOR}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ fill: OTHER_COLOR, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: OTHER_COLOR }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
