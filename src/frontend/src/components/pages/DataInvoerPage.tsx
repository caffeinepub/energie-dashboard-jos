import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Flame,
  Loader2,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MeterReadings } from "../../backend.d";
import { MONTHS, formatNL } from "../../hooks/useConsumptionData";
import {
  useCalculateMonthlyConsumption,
  useDeleteEntry,
  useGetAllEntries,
  useGetYearlyPrices,
  useGetYearlyStartingReadings,
  useGetYearlyTax,
  useSetYearlyPrices,
  useSetYearlyStartingReadings,
  useSetYearlyTax,
  useUpsertEntry,
} from "../../hooks/useQueries";

// Default Dutch energy prices 2024
const DEFAULT_GAS_PRICE = 1.12;
const DEFAULT_ELEC_NORMAL = 0.32;
const DEFAULT_ELEC_DAL = 0.28;
const DEFAULT_TAX_GAS = 0.447;
const DEFAULT_TAX_ELEC = 0.1228;

interface Props {
  year: number;
}

// ─── Consumption Preview ────────────────────────────────────────────────────

function ConsumptionPreview({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const { data: consumption, isLoading } = useCalculateMonthlyConsumption(
    year,
    month,
  );
  if (isLoading)
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Berekenen...
      </p>
    );
  if (!consumption)
    return (
      <p className="text-xs text-muted-foreground">
        Berekend verbruik niet beschikbaar (vorige maand nodig)
      </p>
    );
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <span>
        <span className="text-muted-foreground">Gas: </span>
        <span className="font-mono font-bold text-gas">
          {formatNL(consumption.gas, 1)} m³
        </span>
      </span>
      <span>
        <span className="text-muted-foreground">Normaal: </span>
        <span className="font-mono font-bold text-elec">
          {formatNL(consumption.electricityNormal, 0)} kWh
        </span>
      </span>
      <span>
        <span className="text-muted-foreground">Dal: </span>
        <span className="font-mono font-bold text-elec-dal">
          {formatNL(consumption.electricityHigh, 0)} kWh
        </span>
      </span>
    </div>
  );
}

// ─── Meter Readings Section ─────────────────────────────────────────────────

function MeterReadingsSection({ year }: { year: number }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [gas, setGas] = useState("");
  const [elecNormal, setElecNormal] = useState("");
  const [elecDal, setElecDal] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    month: number;
    year: number;
  } | null>(null);

  const { data: entries = [] } = useGetAllEntries();
  const upsert = useUpsertEntry();
  const deleteEntry = useDeleteEntry();

  const yearEntries = entries.filter((e) => e.year === year);

  // Prefill when entry exists
  useEffect(() => {
    const existing = entries.find(
      (e) => e.month === selectedMonth && e.year === year,
    );
    if (existing) {
      setGas(String(existing.meterReadings.gas));
      setElecNormal(String(existing.meterReadings.electricityNormal));
      setElecDal(String(existing.meterReadings.electricityHigh));
      setOtherCosts(String(existing.otherCosts || 0));
    } else {
      setGas("");
      setElecNormal("");
      setElecDal("");
      setOtherCosts("0");
    }
  }, [selectedMonth, year, entries]);

  const handleSave = async () => {
    if (!gas || !elecNormal || !elecDal) {
      toast.error("Vul alle meterstanden in");
      return;
    }
    const readings: MeterReadings = {
      gas: Number(gas),
      electricityNormal: Number(elecNormal),
      electricityHigh: Number(elecDal),
    };
    try {
      await upsert.mutateAsync({
        month: selectedMonth,
        year,
        meterReadings: readings,
        otherCosts: Number(otherCosts) || 0,
      });
      toast.success(`${MONTHS[selectedMonth - 1]} ${year} opgeslagen`);
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry.mutateAsync(deleteTarget);
      toast.success("Invoer verwijderd");
      setDeleteTarget(null);
    } catch {
      toast.error("Verwijderen mislukt");
    }
  };

  const hasExisting = entries.some(
    (e) => e.month === selectedMonth && e.year === year,
  );

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="w-5 h-5 text-primary" />
          Meterstanden invoeren
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Voer de actuele meterstand in. Het verbruik wordt automatisch
          berekend.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <Label className="text-sm whitespace-nowrap">Maand</Label>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-48" data-ocid="invoer.month.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasExisting && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Bestaande invoer
            </span>
          )}
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="gas-reading"
              className="text-xs text-gas flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" /> Gas (m³)
            </Label>
            <Input
              id="gas-reading"
              type="number"
              step="0.001"
              placeholder="bijv. 1234.567"
              value={gas}
              onChange={(e) => setGas(e.target.value)}
              className="font-mono"
              data-ocid="invoer.gas.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="elec-normal-reading"
              className="text-xs text-elec flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" /> Elektriciteit Normaal (kWh)
            </Label>
            <Input
              id="elec-normal-reading"
              type="number"
              step="1"
              placeholder="bijv. 12345"
              value={elecNormal}
              onChange={(e) => setElecNormal(e.target.value)}
              className="font-mono"
              data-ocid="invoer.elec-normal.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="elec-dal-reading"
              className="text-xs text-elec-dal flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" /> Elektriciteit Dal (kWh)
            </Label>
            <Input
              id="elec-dal-reading"
              type="number"
              step="1"
              placeholder="bijv. 8765"
              value={elecDal}
              onChange={(e) => setElecDal(e.target.value)}
              className="font-mono"
              data-ocid="invoer.elec-dal.input"
            />
          </div>
        </div>

        {/* Other costs collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowOther(!showOther)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="invoer.other-costs.toggle"
          >
            {showOther ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Overige kosten
          </button>
          {showOther && (
            <div className="mt-2 space-y-1.5">
              <Label
                htmlFor="other-costs"
                className="text-xs text-muted-foreground"
              >
                Bedrag (€) — positief of negatief
              </Label>
              <Input
                id="other-costs"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
                className="w-40 font-mono"
                data-ocid="invoer.other-costs.input"
              />
            </div>
          )}
        </div>

        {/* Consumption preview */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5" /> Berekend verbruik (t.o.v.
            vorige maand)
          </p>
          <ConsumptionPreview year={year} month={selectedMonth} />
        </div>

        <Button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="gap-2"
          data-ocid="invoer.save.submit_button"
        >
          {upsert.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {hasExisting ? "Bijwerken" : "Opslaan"}
        </Button>

        {/* Entries table */}
        {yearEntries.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Ingevoerde maanden voor {year}
            </p>
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="text-xs h-8">Maand</TableHead>
                    <TableHead className="text-xs h-8 text-right">
                      Gas (m³)
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right">
                      Normaal (kWh)
                    </TableHead>
                    <TableHead className="text-xs h-8 text-right">
                      Dal (kWh)
                    </TableHead>
                    <TableHead className="text-xs h-8 w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearEntries
                    .sort((a, b) => a.month - b.month)
                    .map((entry, idx) => (
                      <TableRow
                        key={`${entry.year}-${entry.month}`}
                        className="cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setSelectedMonth(entry.month)}
                        data-ocid={`invoer.entry.item.${idx + 1}`}
                      >
                        <TableCell className="text-xs py-2">
                          {MONTHS[entry.month - 1]}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-gas">
                          {formatNL(entry.meterReadings.gas, 1)}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-elec">
                          {formatNL(entry.meterReadings.electricityNormal, 0)}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-mono text-elec-dal">
                          {formatNL(entry.meterReadings.electricityHigh, 0)}
                        </TableCell>
                        <TableCell className="py-2">
                          <AlertDialog
                            open={
                              deleteTarget?.month === entry.month &&
                              deleteTarget?.year === entry.year
                            }
                            onOpenChange={(open) =>
                              !open && setDeleteTarget(null)
                            }
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    month: entry.month,
                                    year: entry.year,
                                  });
                                }}
                                data-ocid={`invoer.entry.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="invoer.delete.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Invoer verwijderen?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {MONTHS[entry.month - 1]} {year} wordt
                                  definitief verwijderd.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="invoer.delete.cancel_button">
                                  Annuleren
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  data-ocid="invoer.delete.confirm_button"
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Starting Readings Section ──────────────────────────────────────────────

function StartingReadingsSection({ year }: { year: number }) {
  const { data: existing, isLoading } = useGetYearlyStartingReadings(year);
  const setReadings = useSetYearlyStartingReadings();

  const [gas, setGas] = useState("");
  const [elecNormal, setElecNormal] = useState("");
  const [elecDal, setElecDal] = useState("");

  useEffect(() => {
    if (existing) {
      setGas(String(existing.meterReadings.gas));
      setElecNormal(String(existing.meterReadings.electricityNormal));
      setElecDal(String(existing.meterReadings.electricityHigh));
    }
  }, [existing]);

  const handleSave = async () => {
    try {
      await setReadings.mutateAsync({
        year,
        readings: {
          gas: Number(gas),
          electricityNormal: Number(elecNormal),
          electricityHigh: Number(elecDal),
        },
      });
      toast.success(`Beginstand ${year} opgeslagen`);
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5 text-gas" />
          Beginstand {year}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Voer de meterstanden in op 1 januari {year}. Dit is de basis voor de
          berekening van Januari.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Laden...
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gas flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Gas beginstand (m³)
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  value={gas}
                  onChange={(e) => setGas(e.target.value)}
                  className="font-mono"
                  placeholder="bijv. 10000.000"
                  data-ocid="invoer.start-gas.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-elec flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Normaal beginstand (kWh)
                </Label>
                <Input
                  type="number"
                  step="1"
                  value={elecNormal}
                  onChange={(e) => setElecNormal(e.target.value)}
                  className="font-mono"
                  placeholder="bijv. 50000"
                  data-ocid="invoer.start-elec-normal.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-elec-dal flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Dal beginstand (kWh)
                </Label>
                <Input
                  type="number"
                  step="1"
                  value={elecDal}
                  onChange={(e) => setElecDal(e.target.value)}
                  className="font-mono"
                  placeholder="bijv. 30000"
                  data-ocid="invoer.start-elec-dal.input"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={setReadings.isPending}
              variant="outline"
              className="gap-2"
              data-ocid="invoer.start.save_button"
            >
              {setReadings.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Beginstand opslaan
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Prices & Tax Section ────────────────────────────────────────────────────

function PricesTaxSection({ year }: { year: number }) {
  const { data: prices, isLoading: pricesLoading } = useGetYearlyPrices(year);
  const { data: tax, isLoading: taxLoading } = useGetYearlyTax(year);
  const setPrices = useSetYearlyPrices();
  const setTax = useSetYearlyTax();

  const [gasPrice, setGasPrice] = useState(String(DEFAULT_GAS_PRICE));
  const [elecNormal, setElecNormal] = useState(String(DEFAULT_ELEC_NORMAL));
  const [elecDal, setElecDal] = useState(String(DEFAULT_ELEC_DAL));
  const [taxGas, setTaxGas] = useState(String(DEFAULT_TAX_GAS));
  const [taxElec, setTaxElec] = useState(String(DEFAULT_TAX_ELEC));

  useEffect(() => {
    if (prices) {
      setGasPrice(String(prices.gasPricePerM3));
      setElecNormal(String(prices.electricityNormal));
      setElecDal(String(prices.electricityDal));
    }
  }, [prices]);

  useEffect(() => {
    if (tax) {
      setTaxGas(String(tax.energyTaxGas));
      setTaxElec(String(tax.energyTaxElec));
    }
  }, [tax]);

  const handleSavePrices = async () => {
    try {
      await setPrices.mutateAsync({
        year,
        gasPrice: Number(gasPrice),
        elecNormal: Number(elecNormal),
        elecDal: Number(elecDal),
      });
      toast.success(`Prijzen ${year} opgeslagen`);
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  const handleSaveTax = async () => {
    try {
      await setTax.mutateAsync({
        year,
        energyTaxGas: Number(taxGas),
        energyTaxElec: Number(taxElec),
      });
      toast.success(`Belastingen ${year} opgeslagen`);
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Prices */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-elec" />
            Energieprijzen {year}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Netto tarief exclusief belastingen
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricesLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Laden...
            </p>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gas">Gas prijs (€/m³)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={gasPrice}
                    onChange={(e) => setGasPrice(e.target.value)}
                    className="font-mono"
                    data-ocid="invoer.gas-price.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-elec">
                    Elektriciteit normaal (€/kWh)
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={elecNormal}
                    onChange={(e) => setElecNormal(e.target.value)}
                    className="font-mono"
                    data-ocid="invoer.elec-normal-price.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-elec-dal">
                    Elektriciteit dal (€/kWh)
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={elecDal}
                    onChange={(e) => setElecDal(e.target.value)}
                    className="font-mono"
                    data-ocid="invoer.elec-dal-price.input"
                  />
                </div>
              </div>
              <Button
                onClick={handleSavePrices}
                disabled={setPrices.isPending}
                variant="outline"
                className="gap-2 w-full"
                data-ocid="invoer.prices.save_button"
              >
                {setPrices.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Prijzen opslaan
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tax */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="w-5 h-5 text-gas" />
            Energiebelasting {year}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inclusief BTW — standaardwaarden 2024
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Laden...
            </p>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gas">
                    Energiebelasting gas (€/m³ incl. BTW)
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={taxGas}
                    onChange={(e) => setTaxGas(e.target.value)}
                    className="font-mono"
                    data-ocid="invoer.tax-gas.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-elec">
                    Energiebelasting elektriciteit (€/kWh incl. BTW)
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={taxElec}
                    onChange={(e) => setTaxElec(e.target.value)}
                    className="font-mono"
                    data-ocid="invoer.tax-elec.input"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveTax}
                disabled={setTax.isPending}
                variant="outline"
                className="gap-2 w-full"
                data-ocid="invoer.tax.save_button"
              >
                {setTax.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Belastingen opslaan
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DataInvoerPage({ year }: Props) {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Data Invoer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Meterstanden, beginstand en tarieven voor {year}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MeterReadingsSection year={year} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StartingReadingsSection year={year} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <PricesTaxSection year={year} />
      </motion.div>
    </div>
  );
}
