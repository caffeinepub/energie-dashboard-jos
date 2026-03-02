import { useState, useEffect } from 'react';
import { Flame, Zap, Gauge, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useGetYearlyStartingReadings,
  useSetYearlyStartingReadings,
  useGetGlobalMeterReadings,
  useSetGlobalMeterReadings,
} from '../hooks/useQueries';
import { toast } from 'sonner';

interface YearSettingsCardProps {
  year: number;
}

export default function YearSettingsCard({ year }: YearSettingsCardProps) {
  const { data: startingReadings, isLoading: loadingStart } = useGetYearlyStartingReadings(year);
  const { data: globalReadings, isLoading: loadingGlobal } = useGetGlobalMeterReadings();
  const setStartingReadings = useSetYearlyStartingReadings();
  const setGlobalReadings = useSetGlobalMeterReadings();

  // Starting readings state
  const [startGas, setStartGas] = useState('');
  const [startElecNormal, setStartElecNormal] = useState('');
  const [startElecHigh, setStartElecHigh] = useState('');

  // Global readings state
  const [globalGas, setGlobalGas] = useState('');
  const [globalElecNormal, setGlobalElecNormal] = useState('');
  const [globalElecHigh, setGlobalElecHigh] = useState('');

  // Pre-fill starting readings when data loads or year changes
  useEffect(() => {
    if (loadingStart) return;
    if (startingReadings) {
      setStartGas(startingReadings.meterReadings.gas.toString());
      setStartElecNormal(startingReadings.meterReadings.electricityNormal.toString());
      setStartElecHigh(startingReadings.meterReadings.electricityHigh.toString());
    } else {
      setStartGas('');
      setStartElecNormal('');
      setStartElecHigh('');
    }
  }, [startingReadings, loadingStart, year]);

  // Pre-fill global readings when data loads
  useEffect(() => {
    if (loadingGlobal) return;
    if (globalReadings) {
      setGlobalGas(globalReadings.gas.toString());
      setGlobalElecNormal(globalReadings.electricityNormal.toString());
      setGlobalElecHigh(globalReadings.electricityHigh.toString());
    }
  }, [globalReadings, loadingGlobal]);

  const handleSaveStarting = async () => {
    const gasVal = parseFloat(startGas);
    const elecNormalVal = parseFloat(startElecNormal);
    const elecHighVal = parseFloat(startElecHigh);

    if (isNaN(gasVal) || gasVal < 0) {
      toast.error('Vul een geldige beginstand in voor gas.');
      return;
    }
    if (isNaN(elecNormalVal) || elecNormalVal < 0) {
      toast.error('Vul een geldige beginstand in voor elektriciteit normaal.');
      return;
    }
    if (isNaN(elecHighVal) || elecHighVal < 0) {
      toast.error('Vul een geldige beginstand in voor elektriciteit hoog.');
      return;
    }

    try {
      await setStartingReadings.mutateAsync({
        year,
        readings: {
          gas: gasVal,
          electricityNormal: elecNormalVal,
          electricityHigh: elecHighVal,
        },
      });
      toast.success(`Beginmeterstanden voor ${year} opgeslagen.`);
    } catch {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    }
  };

  const handleSaveGlobal = async () => {
    const gasVal = parseFloat(globalGas);
    const elecNormalVal = parseFloat(globalElecNormal);
    const elecHighVal = parseFloat(globalElecHigh);

    if (isNaN(gasVal) || gasVal < 0) {
      toast.error('Vul een geldige meterstand in voor gas.');
      return;
    }
    if (isNaN(elecNormalVal) || elecNormalVal < 0) {
      toast.error('Vul een geldige meterstand in voor elektriciteit normaal.');
      return;
    }
    if (isNaN(elecHighVal) || elecHighVal < 0) {
      toast.error('Vul een geldige meterstand in voor elektriciteit hoog.');
      return;
    }

    try {
      await setGlobalReadings.mutateAsync({
        gas: gasVal,
        electricityNormal: elecNormalVal,
        electricityHigh: elecHighVal,
      });
      toast.success('Huidige meterstanden opgeslagen.');
    } catch {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    }
  };

  const isLoading = loadingStart || loadingGlobal;

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Meterstanden ({year})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary">
                Stel de beginmeterstand in voor {year}. Per maand voer je de actuele meterstand in — het verbruik wordt automatisch berekend.
              </p>
            </div>

            {/* Starting readings section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Beginmeterstand {year}
              </p>

              {/* Gas starting */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-gas" />
                  Gas beginstand (m³)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="bijv. 5000.000"
                    value={startGas}
                    onChange={(e) => setStartGas(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">m³</span>
                </div>
              </div>

              {/* Electricity Normal starting */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-elec" />
                  Elektriciteit normaal beginstand (kWh)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="bijv. 12000.000"
                    value={startElecNormal}
                    onChange={(e) => setStartElecNormal(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">kWh</span>
                </div>
              </div>

              {/* Electricity High starting */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-elec" />
                  Elektriciteit hoog beginstand (kWh)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="bijv. 8000.000"
                    value={startElecHigh}
                    onChange={(e) => setStartElecHigh(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">kWh</span>
                </div>
              </div>

              <Button
                onClick={handleSaveStarting}
                disabled={setStartingReadings.isPending}
                size="sm"
                className="w-full"
              >
                {setStartingReadings.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-2" />
                    Beginstand opslaan voor {year}
                  </>
                )}
              </Button>
            </div>

            <Separator className="bg-border/50" />

            {/* Global / current readings section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Huidige meterstanden (globaal)
              </p>
              <p className="text-xs text-muted-foreground/70">
                Worden automatisch bijgewerkt bij het opslaan van een maandelijkse invoer. Je kunt ze hier ook handmatig aanpassen.
              </p>

              {/* Global Gas */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-gas" />
                  Gas huidige stand (m³)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="—"
                    value={globalGas}
                    onChange={(e) => setGlobalGas(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">m³</span>
                </div>
              </div>

              {/* Global Elec Normal */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-elec" />
                  Elektriciteit normaal huidige stand (kWh)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="—"
                    value={globalElecNormal}
                    onChange={(e) => setGlobalElecNormal(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">kWh</span>
                </div>
              </div>

              {/* Global Elec High */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-elec" />
                  Elektriciteit hoog huidige stand (kWh)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="—"
                    value={globalElecHigh}
                    onChange={(e) => setGlobalElecHigh(e.target.value)}
                    className="h-9 text-sm font-mono bg-muted border-border pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">kWh</span>
                </div>
              </div>

              <Button
                onClick={handleSaveGlobal}
                disabled={setGlobalReadings.isPending}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {setGlobalReadings.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-2" />
                    Huidige standen opslaan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
