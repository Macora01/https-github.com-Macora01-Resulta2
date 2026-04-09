/**
 * AIForecast Component
 * Version: 01.00.002
 */
import React from 'react';
import { TrendingUp, Calendar, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getForecast } from '../services/geminiService';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AIForecastProps {
  data: any[];
  isExporting?: boolean;
}

export const AIForecast: React.FC<AIForecastProps> = ({ data, isExporting = false }) => {
  const [forecast, setForecast] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const result = await getForecast(data);
      setForecast(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="forecast-card" className="glass-card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-text text-lg">Proyección Predictiva (AI)</h3>
            <p className="text-xs text-text-light font-medium">Pronóstico para los próximos 3 meses basado en IA.</p>
          </div>
        </div>
        {!forecast && !loading && (
          <button 
            onClick={fetchForecast}
            className="btn-primary px-4 py-1.5 text-xs flex items-center gap-2"
          >
            <Sparkles size={14} />
            Calcular Proyección
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="animate-spin text-secondary" size={32} />
          <p className="text-text-light font-medium animate-pulse">Calculando proyecciones financieras...</p>
        </div>
      ) : forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast.projections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dec29040" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8D6E63', fontSize: 12 }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8D6E63', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="predictedVentas" name="Ventas Proyectadas" fill="#5f2e0a" radius={[4, 4, 0, 0]} isAnimationActive={!isExporting} />
                <Bar dataKey="predictedResultado" name="Resultado Proyectado" fill="#6B8E23" radius={[4, 4, 0, 0]} isAnimationActive={!isExporting} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
              <h4 className="font-bold text-sm text-text mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-secondary" />
                Razonamiento de la IA
              </h4>
              <p className="text-sm text-text-light leading-relaxed">{forecast.reasoning}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {forecast.projections.map((p: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-white border border-accent/10 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-light uppercase">{p.month}</span>
                  <span className="text-xs font-bold text-primary">{formatCurrency(p.predictedVentas)}</span>
                  <span className="text-[10px] text-success font-medium">Res: {formatCurrency(p.predictedResultado)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-accent/5 rounded-xl border border-dashed border-accent/20">
          <p className="text-sm text-text-light">Haz clic en "Calcular Proyección" para ver el futuro de tus finanzas.</p>
        </div>
      )}
    </div>
  );
};
