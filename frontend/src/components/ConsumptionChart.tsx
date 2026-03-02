import { useEffect, useState } from 'react';
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
import { Flame, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllEntries } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { Consumption } from '../backend';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Colors as literal values for canvas/recharts
const GAS_COLOR = '#f59e0b';
const ELEC_COLOR = '#14b8a6';

interface ConsumptionChartProps {
  year: number;
}

export default function ConsumptionChart({ year }: ConsumptionChartProps) {
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { actor } = useActor();
  const [consumptionData, setConsumptionData] = useState<(Consumption | null)[]>(Array(12).fill(null));
  const [loadingConsumption, setLoadingConsumption] = useState(false);

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
    const consumption = consumptionData[idx];
    return {
      month: label,
      gas: consumption ? parseFloat(consumption.gas.toFixed(1)) : 0,
      electricity: consumption
        ? parseFloat((consumption.electricityNormal + consumption.electricityHigh).toFixed(1))
        : 0,
      hasData: consumption !== null,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-card text-sm">
          <p className="font-semibold text-foreground mb-2">{label} {year}</p>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2">
              <span style={{ color: p.color }}>●</span>
              <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
              <span className="font-mono font-medium" style={{ color: p.color }}>
                {p.value} {p.dataKey === 'gas' ? 'm³' : 'kWh'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (entriesLoading || loadingConsumption) {
    return <Skeleton className="h-72 w-full rounded-xl bg-muted" />;
  }

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-gas" />
            <Zap className="w-4 h-4 text-elec" />
          </span>
          Maandelijks Verbruik — {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="gas"
              orientation="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'm³', angle: -90, position: 'insideLeft', fill: GAS_COLOR, fontSize: 11, dx: -4 }}
            />
            <YAxis
              yAxisId="elec"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'kWh', angle: 90, position: 'insideRight', fill: ELEC_COLOR, fontSize: 11, dx: 4 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              formatter={(value) => (
                <span style={{ color: value === 'gas' ? GAS_COLOR : ELEC_COLOR, fontSize: 12 }}>
                  {value === 'gas' ? 'Gas (m³)' : 'Elektriciteit (kWh)'}
                </span>
              )}
            />
            <Bar yAxisId="gas" dataKey="gas" fill={GAS_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="elec" dataKey="electricity" fill={ELEC_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
