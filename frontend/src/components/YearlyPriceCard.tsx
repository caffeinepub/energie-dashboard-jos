import { useState, useEffect } from 'react';
import { Flame, Zap, Euro, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetYearlyPrices, useSetYearlyPrices } from '../hooks/useQueries';
import { toast } from 'sonner';

// Dutch average market price defaults
export const DEFAULT_GAS_PRICE_PER_M3 = 1.45;    // €/m³
export const DEFAULT_ELEC_PRICE_PER_KWH = 0.40;  // €/kWh

interface YearlyPriceCardProps {
  year: number;
}

export default function YearlyPriceCard({ year }: YearlyPriceCardProps) {
  const { data: yearlyPrices, isLoading } = useGetYearlyPrices(year);
  const setYearlyPrices = useSetYearlyPrices();

  const [gasPriceInput, setGasPriceInput] = useState('');
  const [elecPriceInput, setElecPriceInput] = useState('');

  // Pre-fill inputs when data loads or year changes
  useEffect(() => {
    if (isLoading) return;
    if (yearlyPrices) {
      setGasPriceInput(yearlyPrices.gasPricePerM3.toString());
      setElecPriceInput(yearlyPrices.elecPricePerKwh.toString());
    } else {
      setGasPriceInput(DEFAULT_GAS_PRICE_PER_M3.toString());
      setElecPriceInput(DEFAULT_ELEC_PRICE_PER_KWH.toString());
    }
  }, [yearlyPrices, isLoading, year]);

  const handleSave = async () => {
    const gasVal = parseFloat(gasPriceInput);
    const elecVal = parseFloat(elecPriceInput);

    if (isNaN(gasVal) || gasVal < 0) {
      toast.error('Vul een geldige gasprijs in (€/m³).');
      return;
    }
    if (isNaN(elecVal) || elecVal < 0) {
      toast.error('Vul een geldige elektriciteitsprijs in (€/kWh).');
      return;
    }

    try {
      await setYearlyPrices.mutateAsync({
        year,
        gasPricePerM3: gasVal,
        elecPricePerKwh: elecVal,
      });
      toast.success(`Energieprijzen voor ${year} opgeslagen.`);
    } catch {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    }
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Euro className="w-4 h-4" />
          Energieprijzen ({year})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary">
                Stel de energieprijzen per jaar in. Deze worden gebruikt voor de kostenberekening tenzij je een maandelijkse overschrijving instelt.
              </p>
            </div>

            {/* Gas price */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-gas" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gas">Gas</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Gasprijs (€/m³)
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={gasPriceInput}
                  onChange={(e) => setGasPriceInput(e.target.value)}
                  className="h-9 text-sm font-mono bg-muted border-border"
                  placeholder={DEFAULT_GAS_PRICE_PER_M3.toString()}
                />
                <p className="text-xs text-muted-foreground/60">
                  Standaard: €{DEFAULT_GAS_PRICE_PER_M3.toFixed(3)}/m³ (gemiddelde marktprijs)
                </p>
              </div>
            </div>

            {/* Electricity price */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-elec" />
                <span className="text-xs font-semibold uppercase tracking-wider text-elec">Elektriciteit</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Elektriciteitsprijs (€/kWh)
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={elecPriceInput}
                  onChange={(e) => setElecPriceInput(e.target.value)}
                  className="h-9 text-sm font-mono bg-muted border-border"
                  placeholder={DEFAULT_ELEC_PRICE_PER_KWH.toString()}
                />
                <p className="text-xs text-muted-foreground/60">
                  Standaard: €{DEFAULT_ELEC_PRICE_PER_KWH.toFixed(3)}/kWh (gemiddelde marktprijs)
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={setYearlyPrices.isPending}
              size="sm"
              className="w-full mt-2"
            >
              {setYearlyPrices.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Prijzen opslaan voor {year}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
