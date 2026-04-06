import React from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { financialData } from '../data/financialData';

export const Reports = () => {
  const [selectedYear, setSelectedYear] = React.useState<number>(2025);
  const [data, setData] = React.useState<any[]>(financialData);

  React.useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('facore_token');
      try {
        const response = await fetch('/api/financial-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.length > 0) setData(result);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const yearData = React.useMemo(() => {
    return data.filter(d => d.year === selectedYear);
  }, [selectedYear, data]);

  const totals = React.useMemo(() => {
    return yearData.reduce((acc, curr) => ({
      ventasNetas: acc.ventasNetas + curr.ventasNetas,
      costo: acc.costo + curr.costo,
      gastos: acc.gastos + curr.gastos,
      resultadoMes: acc.resultadoMes + curr.resultadoMes,
    }), { ventasNetas: 0, costo: 0, gastos: 0, resultadoMes: 0 });
  }, [yearData]);

  const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Reportes Detallados</h1>
          <p className="text-text-light font-medium">Análisis anual y comparativas de rendimiento.</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-accent/10">
          <Filter size={16} className="text-primary" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-primary focus:outline-none cursor-pointer"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annual Summary Card */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-text text-xl">Resumen Anual {selectedYear}</h3>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-light font-bold uppercase tracking-wider">Ventas Totales</span>
              <span className="text-xl font-bold text-text">{formatCurrency(totals.ventasNetas)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-light font-bold uppercase tracking-wider">Resultado Neto</span>
              <span className={cn(
                "text-xl font-bold",
                totals.resultadoMes >= 0 ? "text-success" : "text-danger"
              )}>
                {formatCurrency(totals.resultadoMes)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-light font-bold uppercase tracking-wider">Margen Operativo</span>
              <span className="text-xl font-bold text-primary">
                {((totals.resultadoMes / totals.ventasNetas) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-light font-bold uppercase tracking-wider">Eficiencia de Costos</span>
              <span className="text-xl font-bold text-secondary">
                {((totals.costo / totals.ventasNetas) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
            <Download size={18} />
            Exportar Reporte PDF
          </button>
        </div>

        {/* Growth Chart */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-text text-lg mb-6">Crecimiento Mensual Acumulado</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dec29040" />
                <XAxis 
                  dataKey="month" 
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
                <Line 
                  type="monotone" 
                  dataKey="ventasNetas" 
                  name="Ventas"
                  stroke="#5f2e0a" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#5f2e0a' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="resultadoMes" 
                  name="Resultado"
                  stroke="#6B8E23" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6B8E23' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
