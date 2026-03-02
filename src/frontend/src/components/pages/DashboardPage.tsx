import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Droplets,
  Flame,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MONTHS,
  calculateMonthlyCost,
  formatCurrency,
  useConsumptionData,
} from "../../hooks/useConsumptionData";
import {
  useGetAllEntries,
  useGetYearlyPrices,
  useGetYearlyTax,
} from "../../hooks/useQueries";
import { useWeather } from "../../hooks/useWeather";
import type { Page } from "../Sidebar";

interface Props {
  year: number;
  onNavigate: (page: Page) => void;
  dashboardName: string;
}

function WeatherWidget({ year }: { year: number }) {
  const { getLocation, getWeatherForMonth } = useWeather();
  const location = getLocation();
  const currentMonth = new Date().getMonth() + 1;
  const weather = getWeatherForMonth(year, currentMonth);

  if (!location) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Thermometer className="w-4 h-4" /> Weerdata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-start gap-2 text-xs text-muted-foreground"
            data-ocid="dashboard.weather.empty_state"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gas" />
            <p>
              Geen locatie ingesteld. Ga naar Instellingen om weerdata te
              activeren.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Thermometer className="w-4 h-4" /> {location.city}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Geen weerdata voor {MONTHS[currentMonth - 1]}. Laad weerdata in
            Instellingen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-gas" />
          {location.city} — {MONTHS[currentMonth - 1]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold font-mono text-gas">
              {weather.avgTempC.toFixed(1)}°
            </p>
            <p className="text-xs text-muted-foreground">Gem. temp</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold font-mono text-elec">
              {weather.humidity.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Droplets className="w-3 h-3" /> Vochtigheid
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold font-mono text-elec-dal">
              {weather.precipitation.toFixed(0)}mm
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Wind className="w-3 h-3" /> Neerslag
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {p.value?.toFixed(1)} {p.unit}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage({
  year,
  onNavigate,
  dashboardName,
}: Props) {
  const { data: entries = [] } = useGetAllEntries();
  const { data: prices } = useGetYearlyPrices(year);
  const { data: tax } = useGetYearlyTax(year);
  const { consumptionByMonth, yearEntries } = useConsumptionData(year, entries);

  const stats = useMemo(() => {
    let totalGasCost = 0;
    let totalElecNormalCost = 0;
    let totalElecDalCost = 0;
    let totalOther = 0;
    let monthsWithData = 0;

    const gasPrice = prices?.gasPricePerM3 ?? 1.0;
    const elecNormal = prices?.electricityNormal ?? 0.32;
    const elecDal = prices?.electricityDal ?? 0.28;
    const taxGas = tax?.energyTaxGas ?? 0.44;
    const taxElec = tax?.energyTaxElec ?? 0.12;

    const chartData: {
      name: string;
      gas: number;
      elecNormal: number;
      elecDal: number;
    }[] = [];

    for (let m = 1; m <= 12; m++) {
      const entry = yearEntries.find((e) => e.month === m);
      const consumption = consumptionByMonth.get(m);
      if (!entry || !consumption) continue;

      monthsWithData++;
      const cost = calculateMonthlyCost(
        consumption,
        gasPrice,
        elecNormal,
        elecDal,
        taxGas,
        taxElec,
        entry.otherCosts,
      );

      totalGasCost += cost.gasCost;
      totalElecNormalCost += cost.elecNormalCost;
      totalElecDalCost += cost.elecDalCost;
      totalOther += cost.otherCosts;

      if (chartData.length < 6) {
        chartData.push({
          name: MONTHS[m - 1].slice(0, 3),
          gas: Math.round(consumption.gas),
          elecNormal: Math.round(consumption.electricityNormal),
          elecDal: Math.round(consumption.electricityHigh),
        });
      }
    }

    const totalYTD =
      totalGasCost + totalElecNormalCost + totalElecDalCost + totalOther;
    const prognosis = monthsWithData > 0 ? (totalYTD / monthsWithData) * 12 : 0;

    return {
      totalGasCost,
      totalElecNormalCost,
      totalElecDalCost,
      totalYTD,
      prognosis,
      monthsWithData,
      chartData,
    };
  }, [yearEntries, consumptionByMonth, prices, tax]);

  const kpis = [
    {
      label: "Gas kosten (YTD)",
      value: formatCurrency(stats.totalGasCost),
      icon: <Flame className="w-5 h-5" />,
      color: "text-gas",
      glow: "card-glow-gas",
      gradient: "gradient-gas",
      ocid: "dashboard.gas-cost.card",
    },
    {
      label: "Elektriciteit normaal",
      value: formatCurrency(stats.totalElecNormalCost),
      icon: <Zap className="w-5 h-5" />,
      color: "text-elec",
      glow: "card-glow-elec",
      gradient: "gradient-elec",
      ocid: "dashboard.elec-normal-cost.card",
    },
    {
      label: "Elektriciteit dal",
      value: formatCurrency(stats.totalElecDalCost),
      icon: <Zap className="w-5 h-5" />,
      color: "text-elec-dal",
      glow: "card-glow-dal",
      gradient: "gradient-dal",
      ocid: "dashboard.elec-dal-cost.card",
    },
    {
      label: "Prognose jaarkosten",
      value: formatCurrency(stats.prognosis),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-overige",
      glow: "",
      gradient: "",
      ocid: "dashboard.prognosis.card",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {dashboardName || "Energie Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overzicht {year} — {stats.monthsWithData} van 12 maanden ingevoerd
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("data-invoer")}
          className="gap-1.5"
          data-ocid="dashboard.add-entry.button"
        >
          <Calendar className="w-4 h-4" />
          Invoeren
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.ocid}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            data-ocid={kpi.ocid}
          >
            <Card
              className={`bg-card border-border/50 ${kpi.glow} overflow-hidden`}
            >
              <div
                className={`absolute inset-0 ${kpi.gradient} pointer-events-none`}
              />
              <CardContent className="p-4 relative">
                <div className={`flex items-center gap-2 mb-3 ${kpi.color}`}>
                  {kpi.icon}
                  <span className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </span>
                </div>
                <p className="kpi-number text-foreground">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress + Chart + Weather */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Voortgang {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Maanden ingevoerd</span>
                  <span className="font-mono font-bold text-foreground">
                    {stats.monthsWithData}/12
                  </span>
                </div>
                <Progress
                  value={(stats.monthsWithData / 12) * 100}
                  className="h-2"
                  data-ocid="dashboard.progress.toggle"
                />
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Totaal YTD</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(stats.totalYTD)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Gem./maand</span>
                  <span className="font-mono font-bold text-foreground">
                    {stats.monthsWithData > 0
                      ? formatCurrency(stats.totalYTD / stats.monthsWithData)
                      : "—"}
                  </span>
                </div>
              </div>
              {stats.monthsWithData === 0 && (
                <div
                  className="flex items-start gap-2 text-xs text-muted-foreground pt-2"
                  data-ocid="dashboard.entries.empty_state"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gas" />
                  <p>
                    Nog geen gegevens voor {year}.{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => onNavigate("data-invoer")}
                    >
                      Voer meterstanden in
                    </button>
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("data-invoer")}
                className="w-full gap-1.5 mt-2"
                data-ocid="dashboard.goto-invoer.button"
              >
                Data invoeren <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mini chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Verbruik afgelopen maanden
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={stats.chartData}
                    margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
                    barGap={2}
                    barSize={6}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.6 0.02 240)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="gas"
                      name="Gas"
                      fill="#f59e0b"
                      unit="m³"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="elecNormal"
                      name="Normaal"
                      fill="#14b8a6"
                      unit="kWh"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="elecDal"
                      name="Dal"
                      fill="#6366f1"
                      unit="kWh"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  Geen data beschikbaar
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weather widget */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WeatherWidget year={year} />
        </motion.div>
      </div>

      {/* Quick nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Grafieken bekijken",
            page: "grafieken" as Page,
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            label: "Analyse openen",
            page: "analyse" as Page,
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            label: "Jaren vergelijken",
            page: "vergelijking" as Page,
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            label: "Instellingen",
            page: "instellingen" as Page,
            icon: <Zap className="w-4 h-4" />,
          },
        ].map((item, i) => (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            onClick={() => onNavigate(item.page)}
            className="justify-start gap-2 h-10 text-xs border-border/50 hover:border-primary/40"
            data-ocid={`dashboard.nav.button.${i + 1}`}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </motion.div>
    </div>
  );
}
