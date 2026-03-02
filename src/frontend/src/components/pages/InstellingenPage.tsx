import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerUserProfile,
  useGetGlobalMeterReadings,
  useSaveCallerUserProfile,
  useSetGlobalMeterReadings,
} from "../../hooks/useQueries";
import { useWeather } from "../../hooks/useWeather";

interface Props {
  year: number;
  onDashboardNameChange: (name: string) => void;
}

// ─── Profile Section ────────────────────────────────────────────────────────

function ProfileSection({
  onDashboardNameChange,
}: { onDashboardNameChange: (name: string) => void }) {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const save = useSaveCallerUserProfile();
  const [name, setName] = useState("");
  const [dashboardName, setDashboardName] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDashboardName(profile.dashboardName);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await save.mutateAsync({ name, dashboardName });
      onDashboardNameChange(dashboardName);
      toast.success("Profiel opgeslagen");
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="w-5 h-5 text-elec" /> Profiel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Laden...
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="text-xs">
                  Naam
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Uw naam"
                  data-ocid="settings.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-name" className="text-xs">
                  Dashboard naam
                </Label>
                <Input
                  id="dashboard-name"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="bijv. Energie Dashboard Jos"
                  data-ocid="settings.dashboard-name.input"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={save.isPending}
              className="gap-2"
              data-ocid="settings.profile.save_button"
            >
              {save.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Profiel opslaan
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Location & Weather Section ─────────────────────────────────────────────

function LocationSection({ year }: { year: number }) {
  const {
    getLocation,
    saveLocation,
    fetchAndSaveAllWeatherForYear,
    getLoadedMonthsForYear,
    isLoading,
    loadingProgress,
    error,
  } = useWeather();

  const existing = getLocation();
  const [city, setCity] = useState(existing?.city ?? "");
  const [lat, setLat] = useState(String(existing?.latitude ?? ""));
  const [lon, setLon] = useState(String(existing?.longitude ?? ""));
  const [loadedMonths, setLoadedMonths] = useState<number[]>(() =>
    getLoadedMonthsForYear(year),
  );

  const handleSaveLocation = () => {
    if (!city || !lat || !lon) {
      toast.error("Vul alle velden in");
      return;
    }
    saveLocation(city, Number(lat), Number(lon));
    toast.success(`Locatie opgeslagen: ${city}`);
  };

  const handleLoadWeather = async () => {
    await fetchAndSaveAllWeatherForYear(year);
    const loaded = getLoadedMonthsForYear(year);
    setLoadedMonths(loaded);
    if (loaded.length > 0) {
      toast.success(`Weerdata geladen: ${loaded.length} maanden`);
    } else {
      toast.error("Geen weerdata opgehaald");
    }
  };

  const MONTHS_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec",
  ];

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-5 h-5 text-gas" /> Locatie & Weerdata
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stel uw locatie in voor weercorrelatie-analyses
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Stad</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="bijv. Amsterdam"
              data-ocid="settings.city.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Breedtegraad</Label>
            <Input
              type="number"
              step="0.001"
              min={-90}
              max={90}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="52.3676"
              className="font-mono"
              data-ocid="settings.latitude.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lengtegraad</Label>
            <Input
              type="number"
              step="0.001"
              min={-180}
              max={180}
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="4.9041"
              className="font-mono"
              data-ocid="settings.longitude.input"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleSaveLocation}
            className="gap-2"
            data-ocid="settings.location.save_button"
          >
            <MapPin className="w-4 h-4" /> Locatie opslaan
          </Button>
          <Button
            onClick={handleLoadWeather}
            disabled={isLoading || !city}
            className="gap-2"
            data-ocid="settings.load-weather.button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading
              ? `Laden... ${loadingProgress}%`
              : `Weerdata laden voor ${year}`}
          </Button>
        </div>

        {isLoading && (
          <div data-ocid="settings.weather.loading_state">
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Maand {Math.round(loadingProgress / (100 / 12))} van 12 ophalen...
            </p>
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-2 text-xs text-destructive"
            data-ocid="settings.weather.error_state"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Month status */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Weerdata status {year} ({loadedMonths.length}/12 maanden)
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
            {MONTHS_SHORT.map((m, i) => {
              const loaded = loadedMonths.includes(i + 1);
              return (
                <div
                  key={m}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs ${loaded ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"}`}
                >
                  {loaded ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 opacity-40" />
                  )}
                  <span className="text-[10px]">{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Global Meter Readings Section ─────────────────────────────────────────

function GlobalMeterSection() {
  const { data: global, isLoading } = useGetGlobalMeterReadings();
  const setGlobal = useSetGlobalMeterReadings();
  const [gas, setGas] = useState("");
  const [elecNormal, setElecNormal] = useState("");
  const [elecDal, setElecDal] = useState("");

  useEffect(() => {
    if (global) {
      setGas(String(global.gas));
      setElecNormal(String(global.electricityNormal));
      setElecDal(String(global.electricityHigh));
    }
  }, [global]);

  const handleSave = async () => {
    try {
      await setGlobal.mutateAsync({
        gas: Number(gas),
        electricityNormal: Number(elecNormal),
        electricityHigh: Number(elecDal),
      });
      toast.success("Globale meterstanden opgeslagen");
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="w-5 h-5 text-elec-dal" /> Huidige meterstanden
          (override)
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overschrijf de globale meterstanden indien nodig
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
                <Label className="text-xs text-gas">Gas (m³)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={gas}
                  onChange={(e) => setGas(e.target.value)}
                  className="font-mono"
                  placeholder="Gas meterstand"
                  data-ocid="settings.global-gas.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-elec">
                  Elektriciteit normaal (kWh)
                </Label>
                <Input
                  type="number"
                  step="1"
                  value={elecNormal}
                  onChange={(e) => setElecNormal(e.target.value)}
                  className="font-mono"
                  placeholder="Normaal meterstand"
                  data-ocid="settings.global-elec-normal.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-elec-dal">
                  Elektriciteit dal (kWh)
                </Label>
                <Input
                  type="number"
                  step="1"
                  value={elecDal}
                  onChange={(e) => setElecDal(e.target.value)}
                  className="font-mono"
                  placeholder="Dal meterstand"
                  data-ocid="settings.global-elec-dal.input"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={setGlobal.isPending}
              variant="outline"
              className="gap-2"
              data-ocid="settings.global-meter.save_button"
            >
              {setGlobal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Meterstanden opslaan
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InstellingenPage({
  year,
  onDashboardNameChange,
}: Props) {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Instellingen
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Profiel, locatie en meterstanden
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ProfileSection onDashboardNameChange={onDashboardNameChange} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <LocationSection year={year} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlobalMeterSection />
      </motion.div>
    </div>
  );
}
