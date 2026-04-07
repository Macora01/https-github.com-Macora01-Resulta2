import React from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { financialData } from '../data/financialData';

export const Planning = () => {
  const [goals, setGoals] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [newGoal, setNewGoal] = React.useState({ title: '', target: '', current: '', type: 'currency' });
  const [showDetailModal, setShowDetailModal] = React.useState<any>(null);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(newGoal.target);
    const currentNum = Number(newGoal.current);
    
    let status = 'in-progress';
    if (newGoal.type === 'currency') {
      if (currentNum >= targetNum) status = 'completed';
      else if (currentNum < targetNum * 0.5) status = 'warning';
    } else {
      if (currentNum >= targetNum) status = 'completed';
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newGoal.title, 
          target: targetNum, 
          current: currentNum, 
          type: newGoal.type,
          status 
        }),
      });

      if (response.ok) {
        fetchGoals();
        setShowGoalModal(false);
        setNewGoal({ title: '', target: '', current: '', type: 'currency' });
      }
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;
    try {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Planificación Estratégica</h1>
          <p className="text-text-light font-medium">Establece metas y monitorea el progreso de tus objetivos.</p>
        </div>
        
        <button 
          onClick={() => setShowGoalModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <Target className="mx-auto text-accent mb-4" size={48} />
            <h3 className="text-xl font-bold text-text">No hay metas establecidas</h3>
            <p className="text-text-light mt-2">Haz clic en "Nueva Meta" para comenzar.</p>
          </div>
        ) : goals.map((goal) => (
          <div key={goal.id} className="glass-card p-6 flex flex-col gap-4 relative group">
            <button 
              onClick={() => handleDeleteGoal(goal.id)}
              className="absolute top-4 right-4 p-1 text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 rounded"
            >
              <X size={16} />
            </button>
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
                {goal.type === 'percentage' ? `Meta: ${goal.target}%` : `Meta: ${formatCurrency(goal.target)}`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-text-light">
                <span>Progreso</span>
                <span>{goal.type === 'percentage' ? `${goal.current}%` : `${((goal.current / goal.target) * 100).toFixed(1)}%`}</span>
              </div>
              <div className="w-full bg-accent/10 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    goal.status === 'completed' ? "bg-success" :
                    goal.status === 'warning' ? "bg-danger" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
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
              <button 
                onClick={() => setShowDetailModal(item)}
                className="text-primary font-bold text-sm hover:underline"
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nueva Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Target size={24} />
                Nueva Meta
              </h3>
              <button onClick={() => setShowGoalModal(false)} className="text-text-light hover:text-text">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Título de la Meta</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="Ej: Incrementar Ventas Q3"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Tipo de Meta</label>
                <select 
                  className="input-field"
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                >
                  <option value="currency">Monetaria ($)</option>
                  <option value="percentage">Porcentaje (%)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Objetivo</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    placeholder="0"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Actual</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    placeholder="0"
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-3 px-4 bg-accent/10 text-text font-bold rounded-xl hover:bg-accent/20 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Crear Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles Hito */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Calendar size={24} />
                Detalles del Hito
              </h3>
              <button onClick={() => setShowDetailModal(null)} className="text-text-light hover:text-text">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-1">{showDetailModal.date}</p>
                <h4 className="text-xl font-bold text-text mb-2">{showDetailModal.event}</h4>
                <p className="text-text-light text-sm leading-relaxed">
                  Este hito representa un punto crítico en la planificación estratégica de Facore para el año 2026. 
                  Se requiere la participación de los responsables de área para asegurar el cumplimiento de los objetivos.
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <h5 className="font-bold text-text text-sm">Tareas Pendientes:</h5>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2 text-sm text-text-light">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Revisión de informes financieros
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-light">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Validación de presupuestos por departamento
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-light">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Presentación a la directiva
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setShowDetailModal(null)}
                className="btn-primary w-full mt-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
