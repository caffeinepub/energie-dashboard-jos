import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  MONTHS,
  calculateMonthlyCost,
  useConsumptionData,
} from "../../hooks/useConsumptionData";
import {
  useGetAllEntries,
  useGetYearlyPrices,
  useGetYearlyTax,
} from "../../hooks/useQueries";
import { useWeather } from "../../hooks/useWeather";

interface Props {
  year: number;
}

const COLORS = {
  gas: "#f59e0b",
  elecNormal: "#14b8a6",
  elecDal: "#6366f1",
  temperature: "#f97316",
  total: "#a78bfa",
  other: "#ec4899",
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}{" "}
            {p.unit}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function GrafiekenPage({ year }: Props) {
  const { data: entries = [] } = useGetAllEntries();
  const { data: prices } = useGetYearlyPrices(year);
  const { data: tax } = useGetYearlyTax(year);
  const { consumptionByMonth, yearEntries } = useConsumptionData(year, entries);
  const { getWeatherForMonth, getLocation } = useWeather();
  const location = getLocation();

  const gasPrice = prices?.gasPricePerM3 ?? 1.12;
  const elecNormal = prices?.electricityNormal ?? 0.32;
  const elecDal = prices?.electricityDal ?? 0.28;
  const taxGas = tax?.energyTaxGas ?? 0.447;
  const taxElec = tax?.energyTaxElec ?? 0.1228;

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const entry = yearEntries.find((e) => e.month === month);
      const consumption = consumptionByMonth.get(month);
      const weather = getWeatherForMonth(year, month);

      if (!entry || !consumption) {
        return {
          name: MONTHS[i].slice(0, 3),
          month,
          gas: null,
          elecNormal: null,
          elecDal: null,
          gasCost: null,
          elecNormalCost: null,
          elecDalCost: null,
          otherCosts: null,
          total: null,
          temperature: weather?.avgTempC ?? null,
          humidity: weather?.humidity ?? null,
        };
      }

      const cost = calculateMonthlyCost(
        consumption,
        gasPrice,
        elecNormal,
        elecDal,
        taxGas,
        taxElec,
        entry.otherCosts,
      );

      return {
        name: MONTHS[i].slice(0, 3),
        month,
        gas: Math.round(consumption.gas * 10) / 10,
        elecNormal: Math.round(consumption.electricityNormal),
        elecDal: Math.round(consumption.electricityHigh),
        gasCost: Math.round(cost.gasCost * 100) / 100,
        elecNormalCost: Math.round(cost.elecNormalCost * 100) / 100,
        elecDalCost: Math.round(cost.elecDalCost * 100) / 100,
        otherCosts: Math.round(cost.otherCosts * 100) / 100,
        total: Math.round(cost.total * 100) / 100,
        temperature: weather?.avgTempC ?? null,
        humidity: weather?.humidity ?? null,
      };
    });
  }, [
    yearEntries,
    consumptionByMonth,
    gasPrice,
    elecNormal,
    elecDal,
    taxGas,
    taxElec,
    getWeatherForMonth,
    year,
  ]);

  const hasData = monthlyData.some((d) => d.gas !== null);
  const hasWeather =
    location !== null && monthlyData.some((d) => d.temperature !== null);

  // Cumulative data
  const cumulativeData = useMemo(() => {
    let cumGas = 0;
    let cumElecNormal = 0;
    let cumElecDal = 0;
    let cumCost = 0;
    return monthlyData.map((d) => {
      if (d.gas !== null) {
        cumGas += d.gas;
        cumElecNormal += d.elecNormal ?? 0;
        cumElecDal += d.elecDal ?? 0;
        cumCost += d.total ?? 0;
      }
      return {
        name: d.name,
        cumGas: d.gas !== null ? Math.round(cumGas * 10) / 10 : null,
        cumElecNormal: d.gas !== null ? Math.round(cumElecNormal) : null,
        cumElecDal: d.gas !== null ? Math.round(cumElecDal) : null,
        cumCost: d.gas !== null ? Math.round(cumCost * 100) / 100 : null,
      };
    });
  }, [monthlyData]);

  // Pie data — pie slices can only be positive; negative otherCosts shown separately as a note
  const pieData = useMemo(() => {
    const gasTotal = monthlyData.reduce((s, d) => s + (d.gasCost ?? 0), 0);
    const normalTotal = monthlyData.reduce(
      (s, d) => s + (d.elecNormalCost ?? 0),
      0,
    );
    const dalTotal = monthlyData.reduce((s, d) => s + (d.elecDalCost ?? 0), 0);
    const otherTotal = monthlyData.reduce((s, d) => s + (d.otherCosts ?? 0), 0);

    const slices = [
      {
        name: "Gas",
        value: Math.round(gasTotal * 100) / 100,
        color: COLORS.gas,
      },
      {
        name: "Elektriciteit normaal",
        value: Math.round(normalTotal * 100) / 100,
        color: COLORS.elecNormal,
      },
      {
        name: "Elektriciteit dal",
        value: Math.round(dalTotal * 100) / 100,
        color: COLORS.elecDal,
      },
    ].filter((d) => d.value > 0);

    // Only include "Overige" as a pie slice when it's positive
    if (otherTotal > 0) {
      slices.push({
        name: "Overige",
        value: Math.round(otherTotal * 100) / 100,
        color: COLORS.other,
      });
    }

    return { slices, otherTotal: Math.round(otherTotal * 100) / 100 };
  }, [monthlyData]);

  // Scatter data: gas vs temperature
  const scatterData = useMemo(() => {
    return monthlyData
      .filter((d) => d.gas !== null && d.temperature !== null)
      .map((d) => ({
        temperature: d.temperature!,
        gas: d.gas!,
        elecNormal: d.elecNormal ?? 0,
        elecDal: d.elecDal ?? 0,
        name: d.name,
      }));
  }, [monthlyData]);

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div
          className="flex flex-col items-center gap-3 text-center max-w-xs"
          data-ocid="grafieken.empty_state"
        >
          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Geen data beschikbaar voor {year}. Voer eerst meterstanden in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Grafieken
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visueel overzicht van verbruik en kosten — {year}
          {hasWeather ? ` • Weerdata: ${location?.city}` : ""}
        </p>
      </motion.div>

      <Tabs defaultValue="verbruik" data-ocid="grafieken.tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="verbruik" data-ocid="grafieken.verbruik.tab">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Verbruik
          </TabsTrigger>
          <TabsTrigger value="kosten" data-ocid="grafieken.kosten.tab">
            <TrendingUp className="w-4 h-4 mr-1.5" /> Kosten
          </TabsTrigger>
          <TabsTrigger value="cumulatief" data-ocid="grafieken.cumulatief.tab">
            <Activity className="w-4 h-4 mr-1.5" /> Cumulatief
          </TabsTrigger>
          <TabsTrigger value="verdeling" data-ocid="grafieken.verdeling.tab">
            <PieIcon className="w-4 h-4 mr-1.5" /> Verdeling
          </TabsTrigger>
          {hasWeather && scatterData.length >= 2 && (
            <TabsTrigger value="weer" data-ocid="grafieken.weer.tab">
              <Activity className="w-4 h-4 mr-1.5" /> Weer
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Verbruik Tab ─── */}
        <TabsContent value="verbruik" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maandelijks verbruik — Gas & Elektriciteit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.3 0.03 250 / 0.3)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="gas"
                      orientation="left"
                      tick={{ fill: COLORS.gas, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "m³",
                        position: "insideTopLeft",
                        fill: COLORS.gas,
                        fontSize: 10,
                        dy: -5,
                      }}
                    />
                    <YAxis
                      yAxisId="elec"
                      orientation="right"
                      tick={{ fill: COLORS.elecNormal, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "kWh",
                        position: "insideTopRight",
                        fill: COLORS.elecNormal,
                        fontSize: 10,
                        dy: -5,
                      }}
                    />
                    {hasWeather && (
                      <YAxis yAxisId="temp" orientation="right" hide />
                    )}
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      yAxisId="gas"
                      dataKey="gas"
                      name="Gas"
                      fill={COLORS.gas}
                      unit="m³"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      yAxisId="elec"
                      dataKey="elecNormal"
                      name="Elec. Normaal"
                      fill={COLORS.elecNormal}
                      unit="kWh"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      yAxisId="elec"
                      dataKey="elecDal"
                      name="Elec. Dal"
                      fill={COLORS.elecDal}
                      unit="kWh"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={24}
                    />
                    {hasWeather && (
                      <Line
                        yAxisId={hasWeather ? "temp" : "elec"}
                        type="monotone"
                        dataKey="temperature"
                        name="Temp."
                        stroke={COLORS.temperature}
                        unit="°C"
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLORS.temperature }}
                        connectNulls
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Kosten Tab ─── */}
        <TabsContent value="kosten" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gestapelde maandelijkse kosten (€) — Overige kosten als lijn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.3 0.03 250 / 0.3)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="gasCost"
                      name="Gas"
                      stackId="a"
                      fill={COLORS.gas}
                      unit="€"
                    />
                    <Bar
                      dataKey="elecNormalCost"
                      name="Elec. Normaal"
                      stackId="a"
                      fill={COLORS.elecNormal}
                      unit="€"
                    />
                    <Bar
                      dataKey="elecDalCost"
                      name="Elec. Dal"
                      stackId="a"
                      fill={COLORS.elecDal}
                      unit="€"
                      radius={[3, 3, 0, 0]}
                    />
                    {/* otherCosts rendered as a line so negative values display correctly below zero */}
                    <Line
                      type="monotone"
                      dataKey="otherCosts"
                      name="Overige"
                      stroke={COLORS.other}
                      strokeWidth={2}
                      dot={{ r: 4, fill: COLORS.other, stroke: COLORS.other }}
                      unit="€"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maandelijkse kosten per categorie (lijnen)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.3 0.03 250 / 0.3)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="gasCost"
                      name="Gas"
                      stroke={COLORS.gas}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS.gas }}
                      unit="€"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="elecNormalCost"
                      name="Elec. Normaal"
                      stroke={COLORS.elecNormal}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS.elecNormal }}
                      unit="€"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="elecDalCost"
                      name="Elec. Dal"
                      stroke={COLORS.elecDal}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS.elecDal }}
                      unit="€"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Totaal"
                      stroke={COLORS.total}
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={{ r: 4, fill: COLORS.total }}
                      unit="€"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Cumulatief Tab ─── */}
        <TabsContent value="cumulatief" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cumulatief verbruik {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={cumulativeData}
                    margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.3 0.03 250 / 0.3)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="gas"
                      orientation="left"
                      tick={{ fill: COLORS.gas, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="elec"
                      orientation="right"
                      tick={{ fill: COLORS.elecNormal, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      yAxisId="gas"
                      type="monotone"
                      dataKey="cumGas"
                      name="Gas"
                      stroke={COLORS.gas}
                      fill={`${COLORS.gas}20`}
                      unit="m³"
                      connectNulls
                    />
                    <Area
                      yAxisId="elec"
                      type="monotone"
                      dataKey="cumElecNormal"
                      name="Elec. Normaal"
                      stroke={COLORS.elecNormal}
                      fill={`${COLORS.elecNormal}20`}
                      unit="kWh"
                      connectNulls
                    />
                    <Area
                      yAxisId="elec"
                      type="monotone"
                      dataKey="cumElecDal"
                      name="Elec. Dal"
                      stroke={COLORS.elecDal}
                      fill={`${COLORS.elecDal}20`}
                      unit="kWh"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cumulatieve kosten {year} (€)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={cumulativeData}
                    margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.3 0.03 250 / 0.3)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumCost"
                      name="Kosten"
                      stroke={COLORS.total}
                      fill={`${COLORS.total}25`}
                      strokeWidth={2.5}
                      unit="€"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Verdeling Tab ─── */}
        <TabsContent value="verdeling">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kostenverdeling {year} (jaarstotaal)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData.slices}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={{ stroke: "oklch(0.6 0.02 240)" }}
                    >
                      {pieData.slices.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `€ ${value.toFixed(2)}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 min-w-52">
                  {pieData.slices.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {d.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm text-foreground">
                        € {d.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {/* Show negative otherCosts as a separate note below pie legend */}
                  {pieData.otherTotal !== 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: COLORS.other }}
                          />
                          <span className="text-sm text-muted-foreground">
                            Overige kosten
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold text-sm ${
                            pieData.otherTotal < 0
                              ? "text-green-400"
                              : "text-foreground"
                          }`}
                        >
                          {pieData.otherTotal < 0 ? "−" : "+"}€{" "}
                          {Math.abs(pieData.otherTotal).toFixed(2)}
                          {pieData.otherTotal < 0 && (
                            <span className="ml-1 text-xs font-normal text-green-400">
                              (korting)
                            </span>
                          )}
                        </span>
                      </div>
                      {pieData.otherTotal < 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          * Niet in taart — korting wordt van totaal afgetrokken
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Weer Tab ─── */}
        {hasWeather && scatterData.length >= 2 && (
          <TabsContent value="weer" className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gasverbruik vs temperatuur — {location?.city}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart
                      margin={{ top: 10, right: 20, left: -8, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.3 0.03 250 / 0.3)"
                      />
                      <XAxis
                        dataKey="temperature"
                        name="Temperatuur"
                        unit="°C"
                        tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Temperatuur (°C)",
                          position: "insideBottomRight",
                          fill: "oklch(0.6 0.02 240)",
                          fontSize: 10,
                          offset: -10,
                        }}
                      />
                      <YAxis
                        dataKey="gas"
                        name="Gas"
                        unit="m³"
                        tick={{ fill: COLORS.gas, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ZAxis range={[40, 40]} />
                      <Tooltip
                        cursor={{
                          strokeDasharray: "3 3",
                          stroke: "oklch(0.6 0.02 240)",
                        }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
                              <p className="font-bold text-foreground mb-1">
                                {d.name}
                              </p>
                              <p className="text-gas">Gas: {d.gas} m³</p>
                              <p className="text-[#f97316]">
                                Temp: {d.temperature?.toFixed(1)}°C
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={scatterData} fill={COLORS.gas} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Elektriciteit vs temperatuur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart
                      data={monthlyData.filter(
                        (d) =>
                          d.temperature !== null &&
                          (d.elecNormal !== null || d.elecDal !== null),
                      )}
                      margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.3 0.03 250 / 0.3)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="elec"
                        orientation="left"
                        tick={{ fill: COLORS.elecNormal, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="temp"
                        orientation="right"
                        tick={{ fill: COLORS.temperature, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        yAxisId="elec"
                        dataKey="elecNormal"
                        name="Elec. Normaal"
                        fill={COLORS.elecNormal}
                        unit="kWh"
                        maxBarSize={20}
                      />
                      <Bar
                        yAxisId="elec"
                        dataKey="elecDal"
                        name="Elec. Dal"
                        fill={COLORS.elecDal}
                        unit="kWh"
                        maxBarSize={20}
                      />
                      <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="temperature"
                        name="Temp."
                        stroke={COLORS.temperature}
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLORS.temperature }}
                        unit="°C"
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
