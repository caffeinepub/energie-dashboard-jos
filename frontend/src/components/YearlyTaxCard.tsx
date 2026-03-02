import { useState, useEffect } from 'react';
import { Flame, Zap, Receipt, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetYearlyTax, useSetYearlyTax } from '../hooks/useQueries';
import { toast } from 'sonner';

/**
 * Dutch statutory energiebelasting rates (energiebelasting + ODE combined) including 21% BTW.
 *
 * Source: Belastingdienst / Rijksoverheid tarieven energiebelasting 2025
 *
 * Gas (eerste schijf ≤ 170.000 m³):
 *   Energiebelasting: €0.49299/m³ excl. BTW
 *   ODE:              €0.08560/m³ excl. BTW
 *   Combined excl. BTW: €0.57859/m³
 *   Combined incl. 21% BTW: €0.57859 × 1.21 ≈ €0.70009/m³
 *
 * Elektriciteit (eerste schijf ≤ 10.000 kWh):
 *   Energiebelasting: €0.04038/kWh excl. BTW
 *   ODE:              €0.01743/kWh excl. BTW
 *   Combined excl. BTW: €0.05781/kWh
 *   Combined incl. 21% BTW: €0.05781 × 1.21 ≈ €0.06995/kWh
 */
export const DEFAULT_GAS_ENERGIEBELASTING = 0.70009;   // €/m³ incl. 21% BTW (2025)
export const DEFAULT_ELEC_ENERGIEBELASTING = 0.06995;  // €/kWh incl. 21% BTW (2025)

interface YearlyTaxCardProps {
  year: number;
}

export default function YearlyTaxCard({ year }: YearlyTaxCardProps) {
  const { data: yearlyTax, isLoading } = useGetYearlyTax(year);
  const setYearlyTax = useSetYearlyTax();

  const [gasEnergiebelasting, setGasEnergiebelasting] = useState('');
  const [elecEnergiebelasting, setElecEnergiebelasting] = useState('');

  // Pre-fill inputs when data loads or year changes
  useEffect(() => {
    if (isLoading) return;
    if (yearlyTax) {
      setGasEnergiebelasting(yearlyTax.energyTaxGas.toString());
      setElecEnergiebelasting(yearlyTax.energyTaxElec.toString());
    } else {
      setGasEnergiebelasting(DEFAULT_GAS_ENERGIEBELASTING.toString());
      setElecEnergiebelasting(DEFAULT_ELEC_ENERGIEBELASTING.toString());
    }
  }, [yearlyTax, isLoading, year]);

  const handleSave = async () => {
    const gasVal = parseFloat(gasEnergiebelasting);
    const elecVal = parseFloat(elecEnergiebelasting);

    if (isNaN(gasVal) || isNaN(elecVal)) {
      toast.error('Vul geldige getallen in voor alle belastingtarieven.');
      return;
    }

    try {
      await setYearlyTax.mutateAsync({
        year,
        energyTaxGas: gasVal,
        energyTaxElec: elecVal,
      });
      toast.success(`Energiebelastingtarieven voor ${year} opgeslagen.`);
    } catch {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    }
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Energiebelasting Tarieven ({year})
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
                Standaard tarieven zijn de wettelijke energiebelasting (incl. ODE) inclusief 21% BTW voor 2025.
                Je kunt de tarieven per jaar aanpassen.
              </p>
            </div>

            {/* Gas energiebelasting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-gas" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gas">Gas</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Energiebelasting incl. BTW (€/m³)
                </Label>
                <Input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={gasEnergiebelasting}
                  onChange={(e) => setGasEnergiebelasting(e.target.value)}
                  className="h-9 text-sm font-mono bg-muted border-border"
                  placeholder={DEFAULT_GAS_ENERGIEBELASTING.toString()}
                />
                <p className="text-xs text-muted-foreground/60">
                  Standaard: €{DEFAULT_GAS_ENERGIEBELASTING.toFixed(5)}/m³ (incl. ODE + 21% BTW)
                </p>
              </div>
            </div>

            {/* Electricity energiebelasting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-elec" />
                <span className="text-xs font-semibold uppercase tracking-wider text-elec">Elektriciteit</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Energiebelasting incl. BTW (€/kWh)
                </Label>
                <Input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={elecEnergiebelasting}
                  onChange={(e) => setElecEnergiebelasting(e.target.value)}
                  className="h-9 text-sm font-mono bg-muted border-border"
                  placeholder={DEFAULT_ELEC_ENERGIEBELASTING.toString()}
                />
                <p className="text-xs text-muted-foreground/60">
                  Standaard: €{DEFAULT_ELEC_ENERGIEBELASTING.toFixed(5)}/kWh (incl. ODE + 21% BTW)
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={setYearlyTax.isPending}
              size="sm"
              className="w-full mt-2"
            >
              {setYearlyTax.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Tarieven opslaan voor {year}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
