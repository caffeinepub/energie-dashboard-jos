import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Minus,
  Thermometer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
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
import { useWeather } from "../../hooks/useWeather";

interface Props {
  year: number;
}

interface MonthRow {
  month: number;
  name: string;
  gas: number;
  elecNormal: number;
  elecDal: number;
  gasCost: number;
  elecNormalCost: number;
  elecDalCost: number;
  otherCosts: number;
  total: number;
  temperature: number | null;
  humidity: number | null;
}

const TrendIcon = ({ value, compare }: { value: number; compare: number }) => {
  if (compare === 0)
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  const pct = ((value - compare) / Math.abs(compare)) * 100;
  if (pct > 5) return <TrendingUp className="w-3.5 h-3.5 text-destructive" />;
  if (pct < -5) return <TrendingDown className="w-3.5 h-3.5 text-green-400" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

export default function AnalysePage({ year }: Props) {
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

  const rows: MonthRow[] = useMemo(() => {
    const result: MonthRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const entry = yearEntries.find((e) => e.month === m);
      const consumption = consumptionByMonth.get(m);
      const weather = getWeatherForMonth(year, m);
      if (!entry || !consumption) continue;
      const cost = calculateMonthlyCost(
        consumption,
        gasPrice,
        elecNormal,
        elecDal,
        taxGas,
        taxElec,
        entry.otherCosts,
      );
      result.push({
        month: m,
        name: MONTHS[m - 1],
        gas: consumption.gas,
        elecNormal: consumption.electricityNormal,
        elecDal: consumption.electricityHigh,
        gasCost: cost.gasCost,
        elecNormalCost: cost.elecNormalCost,
        elecDalCost: cost.elecDalCost,
        otherCosts: cost.otherCosts,
        total: cost.total,
        temperature: weather?.avgTempC ?? null,
        humidity: weather?.humidity ?? null,
      });
    }
    return result;
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

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const n = rows.length;
    const sum = (key: keyof MonthRow) =>
      rows.reduce((s, r) => s + ((r[key] as number) || 0), 0);
    const avg = (key: keyof MonthRow) => sum(key) / n;
    const max = (key: keyof MonthRow) =>
      Math.max(...rows.map((r) => (r[key] as number) || 0));
    const maxRow = (key: keyof MonthRow) =>
      rows.reduce((best, r) =>
        ((r[key] as number) || 0) > ((best[key] as number) || 0) ? r : best,
      );

    const totalGas = sum("gas");
    const totalElecNormal = sum("elecNormal");
    const totalElecDal = sum("elecDal");
    const totalGasCost = sum("gasCost");
    const totalElecNormalCost = sum("elecNormalCost");
    const totalElecDalCost = sum("elecDalCost");
    const totalOther = sum("otherCosts");
    const totalCost = sum("total");

    const taxGasTotal = totalGas * taxGas;
    const taxElecTotal = (totalElecNormal + totalElecDal) * taxElec;

    const prognosis = (totalCost / n) * 12;

    const highestMonth = maxRow("total");
    const lowestMonth = rows.reduce((best, r) =>
      r.total < best.total ? r : best,
    );

    return {
      n,
      totalGas,
      totalElecNormal,
      totalElecDal,
      totalGasCost,
      totalElecNormalCost,
      totalElecDalCost,
      totalOther,
      totalCost,
      taxGasTotal,
      taxElecTotal,
      prognosis,
      avgGas: avg("gas"),
      avgElecNormal: avg("elecNormal"),
      avgElecDal: avg("elecDal"),
      avgTotal: avg("total"),
      maxGas: max("gas"),
      maxElecNormal: max("elecNormal"),
      maxElecDal: max("elecDal"),
      highestMonth,
      lowestMonth,
    };
  }, [rows, taxGas, taxElec]);

  // Weather temperature bands analysis
  const tempBands = useMemo(() => {
    if (!location) return null;
    const bands = [
      { label: "< 5°C", min: Number.NEGATIVE_INFINITY, max: 5 },
      { label: "5–10°C", min: 5, max: 10 },
      { label: "10–15°C", min: 10, max: 15 },
      { label: "> 15°C", min: 15, max: Number.POSITIVE_INFINITY },
    ];
    return bands.map((band) => {
      const matching = rows.filter(
        (r) =>
          r.temperature !== null &&
          r.temperature >= band.min &&
          r.temperature < band.max,
      );
      if (matching.length === 0)
        return {
          ...band,
          count: 0,
          avgGas: null,
          avgElec: null,
          avgCost: null,
        };
      const n = matching.length;
      return {
        ...band,
        count: n,
        avgGas: matching.reduce((s, r) => s + r.gas, 0) / n,
        avgElec: matching.reduce((s, r) => s + r.elecNormal + r.elecDal, 0) / n,
        avgCost: matching.reduce((s, r) => s + r.total, 0) / n,
      };
    });
  }, [rows, location]);

  if (rows.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div
          className="flex flex-col items-center gap-3 text-center max-w-xs"
          data-ocid="analyse.empty_state"
        >
          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Geen data voor {year}. Voer eerst meterstanden in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Analyse
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Statistieken, prognose en correlaties — {year}
        </p>
      </motion.div>

      {/* Summary KPIs */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Totaal gas",
              value: `${formatNL(stats.totalGas, 1)} m³`,
              sub: formatCurrency(stats.totalGasCost),
              color: "text-gas",
            },
            {
              label: "Elec. normaal",
              value: `${formatNL(stats.totalElecNormal, 0)} kWh`,
              sub: formatCurrency(stats.totalElecNormalCost),
              color: "text-elec",
            },
            {
              label: "Elec. dal",
              value: `${formatNL(stats.totalElecDal, 0)} kWh`,
              sub: formatCurrency(stats.totalElecDalCost),
              color: "text-elec-dal",
            },
            {
              label: "Totale kosten YTD",
              value: formatCurrency(stats.totalCost),
              sub: `${stats.n} maanden`,
              color: "text-foreground",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  {kpi.label}
                </p>
                <p className={`text-lg font-bold font-mono ${kpi.color}`}>
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kpi.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {stats && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Kostenverdeling */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-card border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kostenverdeling {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "Gas",
                    cost: stats.totalGasCost,
                    color: "bg-gas",
                    textColor: "text-gas",
                  },
                  {
                    label: "Elec. normaal",
                    cost: stats.totalElecNormalCost,
                    color: "bg-elec",
                    textColor: "text-elec",
                  },
                  {
                    label: "Elec. dal",
                    cost: stats.totalElecDalCost,
                    color: "bg-elec-dal",
                    textColor: "text-elec-dal",
                  },
                  {
                    label: "Overige",
                    cost: stats.totalOther,
                    color: "bg-overige",
                    textColor: "text-overige",
                  },
                ].map((item) => {
                  const pct =
                    stats.totalCost > 0
                      ? (item.cost / stats.totalCost) * 100
                      : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={item.textColor}>{item.label}</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(item.cost)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground">
                  <p>
                    Energiebelasting gas:{" "}
                    <span className="font-mono text-gas">
                      {formatCurrency(stats.taxGasTotal)}
                    </span>
                  </p>
                  <p>
                    Energiebelasting elektriciteit:{" "}
                    <span className="font-mono text-elec">
                      {formatCurrency(stats.taxElecTotal)}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prognose */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Prognose {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      Jaarprognose (op basis van {stats.n} maanden)
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(stats.prognosis)}
                    </span>
                  </div>
                  <Progress value={(stats.n / 12) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.n}/12 maanden ingevoerd
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gemiddelde/maand
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(stats.avgTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duurste maand</span>
                    <span className="font-mono font-bold text-destructive">
                      {stats.highestMonth.name} (
                      {formatCurrency(stats.highestMonth.total)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Goedkoopste maand
                    </span>
                    <span className="font-mono font-bold text-green-400">
                      {stats.lowestMonth.name} (
                      {formatCurrency(stats.lowestMonth.total)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gem. gas/maand
                    </span>
                    <span className="font-mono text-gas">
                      {formatNL(stats.avgGas, 1)} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gem. elec. normaal/maand
                    </span>
                    <span className="font-mono text-elec">
                      {formatNL(stats.avgElecNormal, 0)} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gem. elec. dal/maand
                    </span>
                    <span className="font-mono text-elec-dal">
                      {formatNL(stats.avgElecDal, 0)} kWh
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Weather correlation */}
      {tempBands && location && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-gas" />
                Verbruik per temperatuurband — {location.city}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-xs h-8">Temp. band</TableHead>
                      <TableHead className="text-xs h-8 text-center">
                        Maanden
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right text-gas">
                        Gem. gas (m³)
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right text-elec">
                        Gem. elec (kWh)
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Gem. kosten
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempBands.map((band, i) => (
                      <TableRow
                        key={band.label}
                        data-ocid={`analyse.temp-band.row.${i + 1}`}
                      >
                        <TableCell className="text-xs py-2 font-medium">
                          {band.label}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-center">
                          {band.count}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-gas">
                          {band.avgGas !== null
                            ? formatNL(band.avgGas, 1)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-elec">
                          {band.avgElec !== null
                            ? formatNL(band.avgElec, 0)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-foreground">
                          {band.avgCost !== null
                            ? formatCurrency(band.avgCost)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly data table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maandoverzicht {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/30 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="text-xs h-8 whitespace-nowrap">
                      Maand
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-gas">
                      Gas (m³)
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-elec">
                      Norm. (kWh)
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-elec-dal">
                      Dal (kWh)
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-gas">
                      Gas €
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-elec">
                      Norm. €
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap text-elec-dal">
                      Dal €
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right whitespace-nowrap">
                      Totaal €
                    </TableHead>
                    {location && (
                      <TableHead className="text-xs h-8 text-right whitespace-nowrap text-[#f97316]">
                        Temp °C
                      </TableHead>
                    )}
                    {location && (
                      <TableHead className="text-xs h-8 text-right whitespace-nowrap">
                        Trend
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    const prev = rows[idx - 1];
                    return (
                      <TableRow
                        key={row.month}
                        data-ocid={`analyse.month.row.${idx + 1}`}
                        className="hover:bg-muted/10"
                      >
                        <TableCell className="text-xs py-1.5 font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono text-gas">
                          {formatNL(row.gas, 1)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono text-elec">
                          {formatNL(row.elecNormal, 0)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono text-elec-dal">
                          {formatNL(row.elecDal, 0)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono">
                          {formatCurrency(row.gasCost)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono">
                          {formatCurrency(row.elecNormalCost)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono">
                          {formatCurrency(row.elecDalCost)}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono font-bold text-foreground">
                          {formatCurrency(row.total)}
                        </TableCell>
                        {location && (
                          <TableCell className="text-xs py-1.5 text-right font-mono text-[#f97316]">
                            {row.temperature !== null
                              ? formatNL(row.temperature, 1)
                              : "—"}
                          </TableCell>
                        )}
                        {location && (
                          <TableCell className="text-xs py-1.5 text-right">
                            {prev ? (
                              <TrendIcon
                                value={row.total}
                                compare={prev.total}
                              />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  {stats && (
                    <TableRow className="bg-muted/20 font-bold border-t border-border">
                      <TableCell className="text-xs py-1.5 font-bold">
                        Totaal
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono text-gas">
                        {formatNL(stats.totalGas, 1)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono text-elec">
                        {formatNL(stats.totalElecNormal, 0)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono text-elec-dal">
                        {formatNL(stats.totalElecDal, 0)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono">
                        {formatCurrency(stats.totalGasCost)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono">
                        {formatCurrency(stats.totalElecNormalCost)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono">
                        {formatCurrency(stats.totalElecDalCost)}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono font-bold text-foreground">
                        {formatCurrency(stats.totalCost)}
                      </TableCell>
                      {location && <TableCell />}
                      {location && <TableCell />}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
