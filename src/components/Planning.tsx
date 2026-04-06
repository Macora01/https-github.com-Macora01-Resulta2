import React from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Plus
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { financialData } from '../data/financialData';

export const Planning = () => {
  const [goals, setGoals] = React.useState([
    { id: 1, title: 'Incrementar Ventas Q2', target: 150000000, current: 125000000, status: 'in-progress' },
    { id: 2, title: 'Reducir Gastos Operativos', target: 50000000, current: 55000000, status: 'warning' },
    { id: 3, title: 'Margen de Utilidad > 20%', target: 20, current: 21.5, status: 'completed' },
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Planificación Estratégica</h1>
          <p className="text-text-light font-medium">Establece metas y monitorea el progreso de tus objetivos.</p>
        </div>
        
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nueva Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={cn(
                "p-2 rounded-lg",
                goal.status === 'completed' ? "bg-success/10 text-success" :
                goal.status === 'warning' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
              )}>
                <Target size={20} />
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                goal.status === 'completed' ? "bg-success/10 text-success" :
                goal.status === 'warning' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
              )}>
                {goal.status === 'completed' ? 'Completado' : 
                 goal.status === 'warning' ? 'En Riesgo' : 'En Progreso'}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-text text-lg">{goal.title}</h3>
              <p className="text-text-light text-sm font-medium mt-1">
                {goal.id === 3 ? `Meta: ${goal.target}%` : `Meta: ${formatCurrency(goal.target)}`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-text-light">
                <span>Progreso</span>
                <span>{goal.id === 3 ? `${goal.current}%` : `${((goal.current / goal.target) * 100).toFixed(1)}%`}</span>
              </div>
              <div className="w-full bg-accent/10 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    goal.status === 'completed' ? "bg-success" :
                    goal.status === 'warning' ? "bg-danger" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, goal.id === 3 ? (goal.current / goal.target) * 100 : (goal.current / goal.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <h3 className="font-bold text-text text-xl mb-6">Próximos Hitos</h3>
        <div className="flex flex-col gap-6">
          {[
            { date: '15 Abr, 2026', event: 'Cierre de Trimestre Q1', type: 'financial' },
            { date: '20 Abr, 2026', event: 'Revisión de Presupuesto Q2', type: 'meeting' },
            { date: '01 May, 2026', event: 'Lanzamiento Nueva Estrategia', type: 'strategy' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 hover:bg-accent/5 rounded-xl transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex flex-col items-center justify-center text-primary">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-text-light uppercase tracking-widest">{item.date}</p>
                <h4 className="font-bold text-text">{item.event}</h4>
              </div>
              <button className="text-primary font-bold text-sm hover:underline">Ver detalles</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
