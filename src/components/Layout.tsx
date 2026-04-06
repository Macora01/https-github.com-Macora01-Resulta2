import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/20" 
        : "text-text-light hover:bg-accent/20 hover:text-primary"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export type ViewType = 'dashboard' | 'reports' | 'planning' | 'config';

export const Layout = ({ children, onLogout, currentView, onViewChange }: { 
  children: React.ReactNode, 
  onLogout: () => void,
  currentView: ViewType,
  onViewChange: (view: ViewType) => void
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-accent/20 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white" size={18} />
          </div>
          <span className="font-bold text-primary tracking-tight">Macora01/https-github.com-Macora01-Resulta2 on main</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-primary">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-accent/20 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 p-6 flex flex-col gap-8",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BarChart3 className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-primary text-sm leading-none">Macora01/https-github.com-Macora01-Resulta2 on main</span>
            <span className="text-[10px] text-text-light font-medium uppercase tracking-widest mt-1">Dashboard</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => handleViewChange('dashboard')}
          />
          <SidebarItem 
            icon={PieChartIcon} 
            label="Reportes" 
            active={currentView === 'reports'} 
            onClick={() => handleViewChange('reports')}
          />
          <SidebarItem 
            icon={Calendar} 
            label="Planificación" 
            active={currentView === 'planning'} 
            onClick={() => handleViewChange('planning')}
          />
          <SidebarItem 
            icon={Settings} 
            label="Configuración" 
            active={currentView === 'config'} 
            onClick={() => handleViewChange('config')}
          />
        </nav>

        <div className="pt-6 border-t border-accent/20">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
