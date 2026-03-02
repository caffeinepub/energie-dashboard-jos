import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Flame, Zap, Save, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpsertEntry, useGetAllEntries, useGetYearlyStartingReadings } from '../hooks/useQueries';
import type { Entry } from '../backend';

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maart' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Augustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface EntryFormProps {
  editEntry: Entry | null;
  onCancelEdit: () => void;
  defaultYear: number;
}

export default function EntryForm({ editEntry, onCancelEdit, defaultYear }: EntryFormProps) {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(defaultYear);

  // Meter reading inputs (absolute values)
  const [gasReading, setGasReading] = useState('');
  const [elecNormalReading, setElecNormalReading] = useState('');
  const [elecHighReading, setElecHighReading] = useState('');
  const [otherCosts, setOtherCosts] = useState('0');

  const [showAdvanced, setShowAdvanced] = useState(false);

  const upsertEntry = useUpsertEntry();
  const { data: allEntries } = useGetAllEntries();
  const { data: startingReadings } = useGetYearlyStartingReadings(year);

  // Determine previous month's meter readings for consumption preview
  const prevReading = (() => {
    if (!allEntries) return null;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevEntry = allEntries.find((e) => e.year === prevYear && e.month === prevMonth);
    if (prevEntry) {
      return prevEntry.meterReadings;
    }
    // For January, fall back to yearly starting readings
    if (month === 1 && startingReadings) {
      return startingReadings.meterReadings;
    }
    return null;
  })();

  // Calculate consumption preview
  const gasConsumption = (() => {
    const current = parseFloat(gasReading);
    if (isNaN(current) || !prevReading) return null;
    return Math.max(0, current - prevReading.gas);
  })();

  const elecNormalConsumption = (() => {
    const current = parseFloat(elecNormalReading);
    if (isNaN(current) || !prevReading) return null;
    return Math.max(0, current - prevReading.electricityNormal);
  })();

  const elecHighConsumption = (() => {
    const current = parseFloat(elecHighReading);
    if (isNaN(current) || !prevReading) return null;
    return Math.max(0, current - prevReading.electricityHigh);
  })();

  useEffect(() => {
    if (editEntry) {
      setMonth(editEntry.month);
      setYear(editEntry.year);
      setGasReading(editEntry.meterReadings.gas.toString());
      setElecNormalReading(editEntry.meterReadings.electricityNormal.toString());
      setElecHighReading(editEntry.meterReadings.electricityHigh.toString());
      setOtherCosts(editEntry.otherCosts != null ? editEntry.otherCosts.toString() : '0');
      setShowAdvanced(editEntry.otherCosts != null && editEntry.otherCosts !== 0);
    }
  }, [editEntry]);

  useEffect(() => {
    if (!editEntry) {
      setYear(defaultYear);
    }
  }, [defaultYear, editEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const gasVal = parseFloat(gasReading);
    const elecNormalVal = parseFloat(elecNormalReading);
    const elecHighVal = parseFloat(elecHighReading);

    if (isNaN(gasVal) || gasVal < 0) {
      toast.error('Gas meterstand moet een niet-negatief getal zijn');
      return;
    }
    if (isNaN(elecNormalVal) || elecNormalVal < 0) {
      toast.error('Elektriciteit normaal meterstand moet een niet-negatief getal zijn');
      return;
    }
    if (isNaN(elecHighVal) || elecHighVal < 0) {
      toast.error('Elektriciteit hoog meterstand moet een niet-negatief getal zijn');
      return;
    }

    const otherCostsVal = parseFloat(otherCosts) || 0;

    try {
      await upsertEntry.mutateAsync({
        month,
        year,
        meterReadings: {
          gas: gasVal,
          electricityNormal: elecNormalVal,
          electricityHigh: elecHighVal,
        },
        otherCosts: otherCostsVal,
      });
      toast.success(`Meterstand voor ${MONTHS[month - 1].label} ${year} opgeslagen`);
      if (!editEntry) {
        setGasReading('');
        setElecNormalReading('');
        setElecHighReading('');
        setOtherCosts('0');
        setShowAdvanced(false);
      } else {
        onCancelEdit();
      }
    } catch (err) {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    }
  };

  const ConsumptionPreview = ({
    consumption,
    unit,
    colorClass,
  }: {
    consumption: number | null;
    unit: string;
    colorClass: string;
  }) => {
    if (consumption === null) return null;
    return (
      <div className={`flex items-center gap-1.5 text-xs mt-1 ${colorClass}`}>
        <ArrowRight className="w-3 h-3 opacity-60" />
        <span className="opacity-80">Verbruik deze maand:</span>
        <span className="font-mono font-semibold">
          {consumption.toFixed(2)} {unit}
        </span>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Maand</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Jaar</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground/70 -mt-1">
            Voer de actuele meterstand in. Het verbruik wordt automatisch berekend op basis van de vorige maand.
          </p>

          {/* Gas Meter Reading */}
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Flame className="w-4 h-4 text-gas" />
              <span className="text-gas">Gas meterstand (m³)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="bijv. 5120.500"
                value={gasReading}
                onChange={(e) => setGasReading(e.target.value)}
                className="bg-muted border-border pr-12 font-mono focus:ring-gas/50 focus:border-gas/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">m³</span>
            </div>
            <ConsumptionPreview consumption={gasConsumption} unit="m³" colorClass="text-gas" />
            {gasReading && !prevReading && (
              <p className="text-xs text-muted-foreground/50 mt-1">
                Stel een beginmeterstand in bij "Meterstanden" om het verbruik te berekenen.
              </p>
            )}
          </div>

          {/* Electricity Normal Meter Reading */}
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-elec" />
              <span className="text-elec">Elektriciteit normaal/laag meterstand (kWh)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="bijv. 12350.000"
                value={elecNormalReading}
                onChange={(e) => setElecNormalReading(e.target.value)}
                className="bg-muted border-border pr-14 font-mono focus:ring-elec/50 focus:border-elec/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">kWh</span>
            </div>
            <ConsumptionPreview consumption={elecNormalConsumption} unit="kWh" colorClass="text-elec" />
          </div>

          {/* Electricity High Meter Reading */}
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-elec" />
              <span className="text-elec">Elektriciteit hoog meterstand (kWh)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="bijv. 8200.000"
                value={elecHighReading}
                onChange={(e) => setElecHighReading(e.target.value)}
                className="bg-muted border-border pr-14 font-mono focus:ring-elec/50 focus:border-elec/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">kWh</span>
            </div>
            <ConsumptionPreview consumption={elecHighConsumption} unit="kWh" colorClass="text-elec" />
          </div>

          {/* Advanced / Optional overrides toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full py-1"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Geavanceerde opties (overige kosten)
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-1 border-t border-border/50">
              {/* Other costs */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Overige kosten (optioneel)
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Overige kosten (€) — positief = extra kosten, negatief = korting/teruggave
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={otherCosts}
                      onChange={(e) => setOtherCosts(e.target.value)}
                      className="h-8 text-xs bg-muted border-border pr-8 font-mono"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">€</span>
                  </div>
                  <p className="text-xs text-muted-foreground/50">
                    Bijv. vaste leveringskosten, teruggave zonnepanelen, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={upsertEntry.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {upsertEntry.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Opslaan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editEntry ? 'Bijwerken' : 'Opslaan'}
                </span>
              )}
            </Button>
            {editEntry && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
                className="border-border hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
