import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  AlertCircle,
  Table as TableIcon,
  LayoutDashboard as DashboardIcon
} from 'lucide-react';
import { financialData, MONTHS } from '../data/financialData';
import { formatCurrency, cn } from '../lib/utils';

const StatCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
  <div className="glass-card p-6 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="p-2 bg-accent/20 rounded-lg text-primary">
        <Icon size={20} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
        isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      )}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}%
      </div>
    </div>
    <div className="mt-2">
      <p className="text-text-light text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-text mt-1">{formatCurrency(value)}</h3>
    </div>
  </div>
);

export const Dashboard = () => {
  const [selectedYears, setSelectedYears] = React.useState<number[]>([2025]);
  const [selectedItems, setSelectedItems] = React.useState<string[]>(['ventasNetas', 'resultadoMes']);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'month' | 'quarter' | 'semester'>('month');
  const [view, setView] = React.useState<'charts' | 'table'>('charts');
  const [data, setData] = React.useState<any[]>(financialData);

  const items = [
    { id: 'ventasNetas', label: 'Ventas Netas', color: '#5f2e0a' },
    { id: 'costo', label: 'Costo de Ventas', color: '#A0522D' },
    { id: 'gastos', label: 'Gastos Operativos', color: '#dec290' },
    { id: 'resultadoMes', label: 'Resultado Neto', color: '#6B8E23' },
  ];

  const years = React.useMemo(() => 
    Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a),
  [data]);

  React.useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('facore_token');
      try {
        const response = await fetch('/api/financial-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          if (result && result.length > 0) {
            setData(result);
            // Seleccionar el año más reciente por defecto si no hay ninguno seleccionado
            const availableYears = Array.from(new Set(result.map((d: any) => d.year))).sort((a: any, b: any) => b - a);
            if (availableYears.length > 0) {
              setSelectedYears([availableYears[0] as number]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? (prev.length > 1 ? prev.filter(y => y !== year) : prev)
        : [...prev, year].sort((a, b) => a - b)
    );
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? (prev.length > 1 ? prev.filter(i => i !== itemId) : prev)
        : [...prev, itemId]
    );
  };

  const comparisonData = React.useMemo(() => {
    // Base structure depends on period
    let baseNames: string[] = [];
    if (selectedPeriod === 'month') baseNames = MONTHS;
    else if (selectedPeriod === 'quarter') baseNames = ['Q1', 'Q2', 'Q3', 'Q4'];
    else baseNames = ['Semestre 1', 'Semestre 2'];

    return baseNames.map((name, index) => {
      const entry: any = { name };
      
      selectedYears.forEach(year => {
        const yearData = data.filter(d => d.year === year);
        
        let periodData: any[] = [];
        if (selectedPeriod === 'month') {
          periodData = yearData.filter(d => d.monthIndex === index);
        } else if (selectedPeriod === 'quarter') {
          periodData = yearData.filter(d => Math.floor(d.monthIndex / 3) === index);
        } else {
          periodData = yearData.filter(d => Math.floor(d.monthIndex / 6) === index);
        }

        selectedItems.forEach(item => {
          const value = periodData.reduce((acc, curr) => acc + (curr[item] || 0), 0);
          entry[`${item}_${year}`] = value;
        });
      });
      
      return entry;
    });
  }, [selectedYears, selectedItems, selectedPeriod, data]);

  const totals = React.useMemo(() => {
    const currentYearData = data.filter(d => selectedYears.includes(d.year));
    
    const currentTotals = currentYearData.reduce((acc, curr) => ({
      ventasNetas: acc.ventasNetas + Number(curr.ventasNetas || 0),
      costo: acc.costo + Number(curr.costo || 0),
      gastos: acc.gastos + Number(curr.gastos || 0),
      resultadoMes: acc.resultadoMes + Number(curr.resultadoMes || 0),
    }), { ventasNetas: 0, costo: 0, gastos: 0, resultadoMes: 0 });

    const prevYears = selectedYears.map(y => y - 1);
    const prevYearData = data.filter(d => prevYears.includes(d.year));
    
    const prevTotals = prevYearData.reduce((acc, curr) => ({
      ventasNetas: acc.ventasNetas + Number(curr.ventasNetas || 0),
      costo: acc.costo + Number(curr.costo || 0),
      gastos: acc.gastos + Number(curr.gastos || 0),
      resultadoMes: acc.resultadoMes + Number(curr.resultadoMes || 0),
    }), { ventasNetas: 0, costo: 0, gastos: 0, resultadoMes: 0 });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const comparison = {
      ventas: calculateChange(currentTotals.ventasNetas, prevTotals.ventasNetas),
      costo: calculateChange(currentTotals.costo, prevTotals.costo),
      gastos: calculateChange(currentTotals.gastos, prevTotals.gastos),
      resultado: calculateChange(currentTotals.resultadoMes, prevTotals.resultadoMes),
    };

    const yearLabel = selectedYears.length === 1 
      ? selectedYears[0].toString() 
      : `${Math.min(...selectedYears)}-${Math.max(...selectedYears)}`;

    return { ...currentTotals, comparison, yearLabel, currentYearData };
  }, [data, selectedYears]);

  const currentYearData = totals.currentYearData;

  const COLORS = ['#5f2e0a', '#A0522D', '#dec290', '#6B8E23', '#8B7355', '#7B2D00'];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard Financiero</h1>
          <p className="text-text-light font-medium">Análisis detallado de rendimiento y resultados.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/50 p-1.5 rounded-xl border border-accent/20">
          {/* Multi-Year Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-accent/10">
            <Filter size={16} className="text-primary" />
            <div className="flex gap-1">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => toggleYear(y)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition-all",
                    selectedYears.includes(y) ? "bg-primary text-white" : "text-text-light hover:bg-accent/20"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-accent/20 mx-1 hidden sm:block" />

          {/* Multi-Item Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-accent/10">
            <div className="flex gap-1">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition-all",
                    selectedItems.includes(item.id) ? "bg-primary text-white" : "text-text-light hover:bg-accent/20"
                  )}
                >
                  {item.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-accent/20 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            {(['month', 'quarter', 'semester'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  selectedPeriod === period 
                    ? "bg-primary text-white shadow-md" 
                    : "text-text-light hover:bg-accent/20"
                )}
              >
                {period === 'month' ? 'Mensual' : period === 'quarter' ? 'Trimestral' : 'Semestral'}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-accent/20 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('charts')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                view === 'charts' ? "bg-primary text-white shadow-md" : "text-text-light hover:bg-accent/20"
              )}
            >
              <DashboardIcon size={18} />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                view === 'table' ? "bg-primary text-white shadow-md" : "text-text-light hover:bg-accent/20"
              )}
            >
              <TableIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {currentYearData.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4">
          <AlertCircle size={48} className="text-warning" />
          <div>
            <h3 className="text-xl font-bold text-text">No hay datos para el periodo {totals.yearLabel}</h3>
            <p className="text-text-light mt-2">Carga archivos PDF o ingresa datos manualmente en la sección de Configuración.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title={`Ventas Netas (${totals.yearLabel})`} 
            value={totals.ventasNetas} 
            change={totals.comparison.ventas.toFixed(1)} 
            isPositive={totals.comparison.ventas >= 0} 
            icon={TrendingUp} 
          />
          <StatCard 
            title={`Costo de Ventas (${totals.yearLabel})`} 
            value={totals.costo} 
            change={totals.comparison.costo.toFixed(1)} 
            isPositive={totals.comparison.costo <= 0} 
            icon={TrendingDown} 
          />
          <StatCard 
            title={`Gastos Operativos (${totals.yearLabel})`} 
            value={totals.gastos} 
            change={totals.comparison.gastos.toFixed(1)} 
            isPositive={totals.comparison.gastos <= 0} 
            icon={DollarSign} 
          />
          <StatCard 
            title={`Resultado Neto (${totals.yearLabel})`} 
            value={totals.resultadoMes} 
            change={totals.comparison.resultado.toFixed(1)} 
            isPositive={totals.comparison.resultado >= 0} 
            icon={TrendingUp} 
          />
        </div>
      )}

      {currentYearData.length > 0 && (
        view === 'charts' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Area Chart */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text text-lg">Evolución Comparativa</h3>
                <button className="text-primary hover:bg-accent/20 p-2 rounded-lg transition-colors">
                  <Download size={18} />
                </button>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dec29040" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8D6E63', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8D6E63', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    {selectedYears.map((year, yIdx) => (
                      selectedItems.map((itemId, iIdx) => {
                        const item = items.find(i => i.id === itemId);
                        const color = COLORS[(yIdx * selectedItems.length + iIdx) % COLORS.length];
                        return (
                          <Area 
                            key={`${itemId}_${year}`}
                            type="monotone" 
                            dataKey={`${itemId}_${year}`} 
                            name={`${item?.label} (${year})`}
                            stroke={color} 
                            strokeWidth={2}
                            fillOpacity={0.1} 
                            fill={color} 
                          />
                        );
                      })
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-text text-lg mb-6">Distribución de Costos</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Costo de Ventas', value: totals.costo },
                        { name: 'Gastos Operativos', value: totals.gastos },
                        { name: 'Resultado Neto', value: totals.resultadoMes },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-accent/10 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-light font-medium">Margen de Utilidad</span>
                  <span className="text-primary font-bold">
                    {((totals.resultadoMes / totals.ventasNetas) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(totals.resultadoMes / totals.ventasNetas) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bar Chart Comparison */}
            <div className="lg:col-span-3 glass-card p-6">
              <h3 className="font-bold text-text text-lg mb-6">Comparativa Detallada por Periodo</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dec29040" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8D6E63', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8D6E63', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    {selectedYears.map((year, yIdx) => (
                      selectedItems.map((itemId, iIdx) => {
                        const item = items.find(i => i.id === itemId);
                        const color = COLORS[(yIdx * selectedItems.length + iIdx) % COLORS.length];
                        return (
                          <Bar 
                            key={`${itemId}_${year}`}
                            dataKey={`${itemId}_${year}`} 
                            name={`${item?.label} (${year})`}
                            fill={color} 
                            radius={[4, 4, 0, 0]} 
                          />
                        );
                      })
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/10 border-b border-accent/20">
                    <th className="px-6 py-4 text-sm font-bold text-primary uppercase tracking-wider">Periodo</th>
                    {selectedYears.map(year => (
                      selectedItems.map(itemId => (
                        <th key={`${itemId}_${year}`} className="px-6 py-4 text-sm font-bold text-primary uppercase tracking-wider text-right">
                          {items.find(i => i.id === itemId)?.label} ({year})
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/10">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-text">{row.name}</td>
                      {selectedYears.map(year => (
                        selectedItems.map(itemId => (
                          <td key={`${itemId}_${year}`} className="px-6 py-4 text-sm text-text text-right font-medium">
                            {formatCurrency(row[`${itemId}_${year}`])}
                          </td>
                        ))
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};
