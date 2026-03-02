import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MONTHS,
  calculateMonthlyCost,
  formatCurrency,
  formatNL,
  useConsumptionData,
} from "../../hooks/useConsumptionData";
import {
  useGetAllEntries,
  useGetYearlyPrices,
  useGetYearlyTax,
} from "../../hooks/useQueries";

interface Props {
  year: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i);

const COLORS_A = {
  gas: "#f59e0b",
  elec: "#14b8a6",
  dal: "#6366f1",
  total: "#a78bfa",
};
const COLORS_B = {
  gas: "#fbbf24aa",
  elec: "#2dd4bfaa",
  dal: "#818cf8aa",
  total: "#c4b5fdaa",
};

function useYearData(year: number, entries: any[]) {
  const { data: prices } = useGetYearlyPrices(year);
  const { data: tax } = useGetYearlyTax(year);
  const { consumptionByMonth, yearEntries } = useConsumptionData(year, entries);

  return useMemo(() => {
    const gasPrice = prices?.gasPricePerM3 ?? 1.12;
    const elecNormal = prices?.electricityNormal ?? 0.32;
    const elecDal = prices?.electricityDal ?? 0.28;
    const taxGas = tax?.energyTaxGas ?? 0.447;
    const taxElec = tax?.energyTaxElec ?? 0.1228;

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const entry = yearEntries.find((e: any) => e.month === m);
      const consumption = consumptionByMonth.get(m);
      if (!entry || !consumption) return null;
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
        month: m,
        gas: consumption.gas,
        elecNormal: consumption.electricityNormal,
        elecDal: consumption.electricityHigh,
        ...cost,
      };
    });

    const withData = monthly.filter(Boolean) as NonNullable<
      (typeof monthly)[0]
    >[];
    const totalGas = withData.reduce((s, r) => s + r.gas, 0);
    const totalElecNormal = withData.reduce((s, r) => s + r.elecNormal, 0);
    const totalElecDal = withData.reduce((s, r) => s + r.elecDal, 0);
    const totalCost = withData.reduce((s, r) => s + r.total, 0);
    const totalGasCost = withData.reduce((s, r) => s + r.gasCost, 0);
    const totalElecNormalCost = withData.reduce(
      (s, r) => s + r.elecNormalCost,
      0,
    );
    const totalElecDalCost = withData.reduce((s, r) => s + r.elecDalCost, 0);

    return {
      monthly,
      totalGas,
      totalElecNormal,
      totalElecDal,
      totalCost,
      totalGasCost,
      totalElecNormalCost,
      totalElecDalCost,
      monthsWithData: withData.length,
    };
  }, [yearEntries, consumptionByMonth, prices, tax]);
}

const DeltaBadge = ({ a, b }: { a: number; b: number }) => {
  if (b === 0) return <span className="text-muted-foreground">—</span>;
  const delta = ((a - b) / Math.abs(b)) * 100;
  const isUp = delta > 0;
  return (
    <span
      className={`text-xs font-mono font-bold ${isUp ? "text-destructive" : "text-green-400"}`}
    >
      {isUp ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="py-0.5" style={{ color: p.fill }}>
          {p.name}: {p.value?.toFixed(2)} {p.unit}
        </p>
      ))}
    </div>
  );
};

export default function VergelijkingPage({ year }: Props) {
  const [yearB, setYearB] = useState(year - 1);
  const { data: entries = [] } = useGetAllEntries();

  const dataA = useYearData(year, entries);
  const dataB = useYearData(yearB, entries);

  const comparisonChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const rowA = dataA.monthly[i];
      const rowB = dataB.monthly[i];
      return {
        name: MONTHS[i].slice(0, 3),
        [`Gas ${year}`]: rowA?.gas ?? null,
        [`Gas ${yearB}`]: rowB?.gas ?? null,
        [`Normaal ${year}`]: rowA?.elecNormal ?? null,
        [`Normaal ${yearB}`]: rowB?.elecNormal ?? null,
        [`Dal ${year}`]: rowA?.elecDal ?? null,
        [`Dal ${yearB}`]: rowB?.elecDal ?? null,
        [`Kosten ${year}`]: rowA?.total ?? null,
        [`Kosten ${yearB}`]: rowB?.total ?? null,
      };
    });
  }, [dataA, dataB, year, yearB]);

  const hasAnyData = dataA.monthsWithData > 0 || dataB.monthsWithData > 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Vergelijking
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vergelijk twee jaren naast elkaar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gas flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">{year}</span>
          </div>
          <span className="text-muted-foreground text-sm">vs.</span>
          <Select
            value={String(yearB)}
            onValueChange={(v) => setYearB(Number(v))}
          >
            <SelectTrigger
              className="w-28"
              data-ocid="vergelijking.year-b.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.filter((y) => y !== year).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {!hasAnyData ? (
        <div
          className="flex items-center justify-center min-h-40"
          data-ocid="vergelijking.empty_state"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Geen data beschikbaar voor vergelijking.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary comparison */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jaarsamenvatting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="text-xs h-8">Categorie</TableHead>
                        <TableHead className="text-xs h-8 text-right text-gas">
                          {year}
                        </TableHead>
                        <TableHead className="text-xs h-8 text-right text-muted-foreground">
                          {yearB}
                        </TableHead>
                        <TableHead className="text-xs h-8 text-right">
                          Verschil
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          label: "Gas totaal (m³)",
                          a: dataA.totalGas,
                          b: dataB.totalGas,
                          format: (v: number) => formatNL(v, 1),
                        },
                        {
                          label: "Elec. normaal (kWh)",
                          a: dataA.totalElecNormal,
                          b: dataB.totalElecNormal,
                          format: (v: number) => formatNL(v, 0),
                        },
                        {
                          label: "Elec. dal (kWh)",
                          a: dataA.totalElecDal,
                          b: dataB.totalElecDal,
                          format: (v: number) => formatNL(v, 0),
                        },
                        {
                          label: "Gas kosten (€)",
                          a: dataA.totalGasCost,
                          b: dataB.totalGasCost,
                          format: formatCurrency,
                        },
                        {
                          label: "Elec. normaal kosten (€)",
                          a: dataA.totalElecNormalCost,
                          b: dataB.totalElecNormalCost,
                          format: formatCurrency,
                        },
                        {
                          label: "Elec. dal kosten (€)",
                          a: dataA.totalElecDalCost,
                          b: dataB.totalElecDalCost,
                          format: formatCurrency,
                        },
                        {
                          label: "Totale kosten (€)",
                          a: dataA.totalCost,
                          b: dataB.totalCost,
                          format: formatCurrency,
                        },
                      ].map((row, idx) => (
                        <TableRow
                          key={row.label}
                          data-ocid={`vergelijking.summary.row.${idx + 1}`}
                          className="hover:bg-muted/10"
                        >
                          <TableCell className="text-xs py-1.5">
                            {row.label}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 text-right font-mono text-foreground">
                            {row.format(row.a)}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 text-right font-mono text-muted-foreground">
                            {row.format(row.b)}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 text-right">
                            <DeltaBadge a={row.a} b={row.b} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maandvergelijking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="gas" data-ocid="vergelijking.chart.tabs">
                  <TabsList className="mb-4">
                    <TabsTrigger value="gas" data-ocid="vergelijking.gas.tab">
                      Gas
                    </TabsTrigger>
                    <TabsTrigger
                      value="normaal"
                      data-ocid="vergelijking.normaal.tab"
                    >
                      Normaal
                    </TabsTrigger>
                    <TabsTrigger value="dal" data-ocid="vergelijking.dal.tab">
                      Dal
                    </TabsTrigger>
                    <TabsTrigger
                      value="kosten"
                      data-ocid="vergelijking.kosten.tab"
                    >
                      Kosten
                    </TabsTrigger>
                  </TabsList>

                  {[
                    {
                      key: "gas",
                      keyA: `Gas ${year}`,
                      keyB: `Gas ${yearB}`,
                      colorA: COLORS_A.gas,
                      colorB: COLORS_B.gas,
                      unit: "m³",
                    },
                    {
                      key: "normaal",
                      keyA: `Normaal ${year}`,
                      keyB: `Normaal ${yearB}`,
                      colorA: COLORS_A.elec,
                      colorB: COLORS_B.elec,
                      unit: "kWh",
                    },
                    {
                      key: "dal",
                      keyA: `Dal ${year}`,
                      keyB: `Dal ${yearB}`,
                      colorA: COLORS_A.dal,
                      colorB: COLORS_B.dal,
                      unit: "kWh",
                    },
                    {
                      key: "kosten",
                      keyA: `Kosten ${year}`,
                      keyB: `Kosten ${yearB}`,
                      colorA: COLORS_A.total,
                      colorB: COLORS_B.total,
                      unit: "€",
                    },
                  ].map(({ key, keyA, keyB, colorA, colorB, unit }) => (
                    <TabsContent key={key} value={key}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={comparisonChartData}
                          margin={{ top: 5, right: 16, left: -8, bottom: 5 }}
                          barGap={2}
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
                            dataKey={keyA}
                            fill={colorA}
                            unit={unit}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={20}
                          />
                          <Bar
                            dataKey={keyB}
                            fill={colorB}
                            unit={unit}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly detail table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maandelijkse kosten — {year} vs {yearB}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/30 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="text-xs h-8">Maand</TableHead>
                        <TableHead className="text-xs h-8 text-right text-gas">
                          {year} (€)
                        </TableHead>
                        <TableHead className="text-xs h-8 text-right text-muted-foreground">
                          {yearB} (€)
                        </TableHead>
                        <TableHead className="text-xs h-8 text-right">
                          Δ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 12 }, (_, i) => {
                        const rowA = dataA.monthly[i];
                        const rowB = dataB.monthly[i];
                        return (
                          <TableRow
                            key={MONTHS[i]}
                            data-ocid={`vergelijking.month.row.${i + 1}`}
                            className="hover:bg-muted/10"
                          >
                            <TableCell className="text-xs py-1.5">
                              {MONTHS[i]}
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-mono text-foreground">
                              {rowA ? formatCurrency(rowA.total) : "—"}
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-mono text-muted-foreground">
                              {rowB ? formatCurrency(rowB.total) : "—"}
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-right">
                              {rowA && rowB ? (
                                <DeltaBadge a={rowA.total} b={rowB.total} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
