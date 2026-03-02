import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GitCompare,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type Page =
  | "dashboard"
  | "data-invoer"
  | "grafieken"
  | "analyse"
  | "vergelijking"
  | "instellingen";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    ocid: "nav.dashboard.link",
  },
  {
    id: "data-invoer",
    label: "Data Invoer",
    icon: <ClipboardList className="w-5 h-5" />,
    ocid: "nav.data-invoer.link",
  },
  {
    id: "grafieken",
    label: "Grafieken",
    icon: <BarChart3 className="w-5 h-5" />,
    ocid: "nav.grafieken.link",
  },
  {
    id: "analyse",
    label: "Analyse",
    icon: <LineChart className="w-5 h-5" />,
    ocid: "nav.analyse.link",
  },
  {
    id: "vergelijking",
    label: "Vergelijking",
    icon: <GitCompare className="w-5 h-5" />,
    ocid: "nav.vergelijking.link",
  },
  {
    id: "instellingen",
    label: "Instellingen",
    icon: <Settings className="w-5 h-5" />,
    ocid: "nav.instellingen.link",
  },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) =>
  String(CURRENT_YEAR - 2 + i),
);

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  dashboardName: string;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentPage,
  onNavigate,
  selectedYear,
  onYearChange,
  dashboardName,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { clear, identity } = useInternetIdentity();

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}…`
    : "";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
              {dashboardName || "Energie Dashboard"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {principalShort}
            </p>
          </div>
        )}
        {/* Collapse button for desktop */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
          data-ocid="sidebar.toggle"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Year selector */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
            Jaar
          </p>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => onYearChange(Number(v))}
          >
            <SelectTrigger
              className="h-8 text-sm bg-sidebar-accent border-sidebar-border"
              data-ocid="sidebar.year.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {collapsed && (
        <div className="px-2 py-3 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <span className="text-xs font-mono font-bold text-sidebar-primary">
              {selectedYear}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              onClose();
            }}
            data-ocid={item.ocid}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center" : "",
              currentPage === item.id
                ? "bg-sidebar-primary/15 text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <span
              className={cn(
                "flex-shrink-0",
                currentPage === item.id
                  ? "text-sidebar-primary"
                  : "text-muted-foreground",
              )}
            >
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && currentPage === item.id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom: logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={clear}
          data-ocid="sidebar.logout.button"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150",
            collapsed ? "justify-center" : "",
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Uitloggen</span>}
        </button>
        {!collapsed && (
          <p className="text-xs text-muted-foreground/40 text-center mt-3 px-2">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-hidden relative"
        style={{ minHeight: "100vh" }}
      >
        <div
          style={{ width: collapsed ? 64 : 240 }}
          className="flex flex-col h-full"
        >
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  data-ocid="sidebar.close.button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Topbar for mobile
export function TopBar({
  onMenuOpen,
  dashboardName: _dashboardName,
  selectedYear,
  currentPage,
}: {
  onMenuOpen: () => void;
  dashboardName: string;
  selectedYear: number;
  currentPage: Page;
}) {
  const pageLabels: Record<Page, string> = {
    dashboard: "Dashboard",
    "data-invoer": "Data Invoer",
    grafieken: "Grafieken",
    analyse: "Analyse",
    vergelijking: "Vergelijking",
    instellingen: "Instellingen",
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-background/95 backdrop-blur border-b border-border">
      <button
        type="button"
        onClick={onMenuOpen}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
        data-ocid="topbar.menu.button"
      >
        <Zap className="w-5 h-5" />
      </button>
      <span className="flex-1 font-semibold text-sm text-foreground">
        {pageLabels[currentPage]}
      </span>
      <span className="text-xs font-mono text-muted-foreground">
        {selectedYear}
      </span>
    </header>
  );
}
