import { Button } from "@/components/ui/button";
import { Flame, LogIn, Thermometer, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.75 0.18 55)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.65 0.15 185)" }}
        />
        <div
          className="absolute top-3/4 left-1/3 w-64 h-64 rounded-full opacity-6 blur-3xl"
          style={{ background: "oklch(0.58 0.22 264)" }}
        />
      </div>

      {/* Grid lines background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.93 0.01 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.01 240) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl border border-border/50 p-8"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.025 250 / 0.95), oklch(0.18 0.025 250 / 0.95))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="mb-4 relative">
              <img
                src="/assets/generated/energy-logo.dim_256x256.png"
                alt="Energie Dashboard"
                className="w-20 h-20 rounded-2xl"
                style={{ boxShadow: "0 8px 32px oklch(0.75 0.18 55 / 0.3)" }}
              />
            </div>
            <h1
              className="text-2xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: "Outfit, system-ui, sans-serif" }}
            >
              Energie Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Uw persoonlijk energiebeheer
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 mb-8"
          >
            {[
              {
                icon: <Flame className="w-4 h-4" />,
                label: "Gas verbruik & kosten",
                color: "text-gas",
              },
              {
                icon: <Zap className="w-4 h-4" />,
                label: "Elektriciteit normaal & dal",
                color: "text-elec",
              },
              {
                icon: <Thermometer className="w-4 h-4" />,
                label: "Weercorrelatie & analyses",
                color: "text-elec-dal",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-muted/50 border border-border/30"
              >
                <span className={item.color}>{item.icon}</span>
                <span className="text-sm text-foreground/80">{item.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Login button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl"
              style={{
                background: "oklch(0.75 0.18 55)",
                color: "oklch(0.12 0.02 250)",
              }}
              data-ocid="login.primary_button"
            >
              <LogIn className="w-5 h-5" />
              {isLoggingIn ? "Inloggen..." : "Inloggen met Internet Identity"}
            </Button>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Veilig inloggen via Internet Identity — geen wachtwoord nodig
          </p>
        </div>
      </motion.div>
    </div>
  );
}
