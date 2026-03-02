import { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Pencil, Check, X, Loader2, LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetDashboardName, useSetDashboardName } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';

const DEFAULT_DASHBOARD_NAME = 'Mijn Energie Dashboard';

export default function Header() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: dashboardName, isLoading: nameLoading } = useGetDashboardName();
  const setDashboardNameMutation = useSetDashboardName();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = dashboardName || DEFAULT_DASHBOARD_NAME;

  // Update document title when dashboard name changes
  useEffect(() => {
    document.title = `${displayName} - Energie Dashboard`;
  }, [displayName]);

  const handleStartEdit = () => {
    setEditValue(displayName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    await setDashboardNameMutation.mutateAsync(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const principalShort = identity
    ? identity.getPrincipal().toString().slice(0, 8) + '...'
    : '';

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        <img
          src="/assets/generated/energy-logo.dim_256x256.png"
          alt="Energie Dashboard Logo"
          className="w-10 h-10 rounded-xl flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={60}
                className="text-lg font-bold bg-muted border border-border rounded-lg px-2 py-0.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full max-w-xs"
              />
              <button
                onClick={handleSave}
                disabled={setDashboardNameMutation.isPending}
                className="p-1 rounded-md text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                title="Opslaan"
              >
                {setDashboardNameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                title="Annuleren"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              {nameLoading ? (
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              ) : (
                <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
                  {displayName}
                </h1>
              )}
              <button
                onClick={handleStartEdit}
                className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
                title="Naam bewerken"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Dutch Energy Cost Calculator &amp; Overview</p>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-gas" />
              <span className="text-gas font-medium">Gas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-elec" />
              <span className="text-elec font-medium">Electricity</span>
            </div>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-2 border-l border-border pl-4">
            {principalShort && (
              <span className="hidden md:block text-xs text-muted-foreground font-mono">
                {principalShort}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              title="Uitloggen"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Uitloggen</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
