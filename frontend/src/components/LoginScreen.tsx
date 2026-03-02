import { Flame, Zap, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img
              src="/assets/generated/energy-logo.dim_256x256.png"
              alt="Energie Dashboard Logo"
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gas rounded-full flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-center">
            Energie Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Dutch Energy Cost Calculator &amp; Overview
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gas/10 border border-gas/20">
              <Flame className="w-3.5 h-3.5 text-gas" />
              <span className="text-xs font-medium text-gas">Gas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elec/10 border border-elec/20">
              <Zap className="w-3.5 h-3.5 text-elec" />
              <span className="text-xs font-medium text-elec">Electricity</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welkom terug
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Log in om toegang te krijgen tot jouw persoonlijke energie dashboard met al jouw verbruiksgegevens.
          </p>

          <Button
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-11 text-sm font-semibold rounded-xl"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inloggen...
              </>
            ) : (
              'Inloggen met Internet Identity'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Geen account? Internet Identity maakt automatisch een account aan bij je eerste login.
          </p>
        </div>

        {/* Features hint */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', label: 'Veilig & privé' },
            { icon: '📊', label: 'Jouw data' },
            { icon: '⚡', label: 'Altijd beschikbaar' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card/50 border border-border/50">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
