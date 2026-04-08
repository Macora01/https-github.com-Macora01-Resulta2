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
  const [milestones, setMilestones] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMilestonesLoading, setIsMilestonesLoading] = React.useState(true);

  React.useEffect(() => {
    fetchGoals();
    fetchMilestones();
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

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/milestones');
      if (response.ok) {
        const data = await response.json();
        setMilestones(data);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setIsMilestonesLoading(false);
    }
  };

  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = React.useState<any>(null);
  const [newGoal, setNewGoal] = React.useState({ title: '', target: '', current: '', type: 'currency' });
  const [newMilestone, setNewMilestone] = React.useState({ date: '', event: '', description: '', type: 'financial' });
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

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = typeof showMilestoneModal === 'object' && showMilestoneModal !== null;
    const url = isEditing ? `/api/milestones/${showMilestoneModal.id}` : '/api/milestones';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone),
      });

      if (response.ok) {
        fetchMilestones();
        setShowMilestoneModal(null);
        setNewMilestone({ date: '', event: '', description: '', type: 'financial' });
      }
    } catch (err) {
      console.error('Error saving milestone:', err);
    }
  };

  const openMilestoneModal = (milestone?: any) => {
    if (milestone) {
      setShowMilestoneModal(milestone);
      setNewMilestone({ 
        date: milestone.date.split('T')[0], 
        event: milestone.event, 
        description: milestone.description || '', 
        type: milestone.type || 'financial' 
      });
    } else {
      setShowMilestoneModal(true);
      setNewMilestone({ date: '', event: '', description: '', type: 'financial' });
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

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este hito?')) return;
    try {
      const response = await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchMilestones();
      }
    } catch (err) {
      console.error('Error deleting milestone:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-text text-xl">Próximos Hitos</h3>
          <button 
            onClick={() => openMilestoneModal()}
            className="text-primary hover:bg-accent/20 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <Plus size={16} />
            Agregar Hito
          </button>
        </div>
        
        <div className="flex flex-col gap-6">
          {isMilestonesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center p-8 bg-accent/5 rounded-2xl border border-dashed border-accent/20">
              <Calendar className="mx-auto text-accent mb-2" size={32} />
              <p className="text-text-light font-medium">No hay hitos programados</p>
            </div>
          ) : milestones.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-accent/5 rounded-xl transition-colors group">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex flex-col items-center justify-center text-primary">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-text-light uppercase tracking-widest">{formatDate(item.date)}</p>
                <h4 className="font-bold text-text">{item.event}</h4>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => openMilestoneModal(item)}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setShowDetailModal(item)}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Ver detalles
                </button>
                <button 
                  onClick={() => handleDeleteMilestone(item.id)}
                  className="p-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nuevo/Editar Hito */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Calendar size={24} />
                {typeof showMilestoneModal === 'object' ? 'Editar Hito' : 'Nuevo Hito'}
              </h3>
              <button onClick={() => setShowMilestoneModal(null)} className="text-text-light hover:text-text">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveMilestone} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Evento</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="Ej: Cierre de Trimestre"
                  value={newMilestone.event}
                  onChange={(e) => setNewMilestone({ ...newMilestone, event: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Fecha</label>
                <input 
                  type="date" 
                  required
                  className="input-field"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Tipo</label>
                <select 
                  className="input-field"
                  value={newMilestone.type}
                  onChange={(e) => setNewMilestone({ ...newMilestone, type: e.target.value })}
                >
                  <option value="financial">Financiero</option>
                  <option value="meeting">Reunión</option>
                  <option value="strategy">Estrategia</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Descripción</label>
                <textarea 
                  className="input-field min-h-[100px]"
                  placeholder="Detalles del hito..."
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowMilestoneModal(null)}
                  className="flex-1 py-3 px-4 bg-accent/10 text-text font-bold rounded-xl hover:bg-accent/20 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {typeof showMilestoneModal === 'object' ? 'Guardar Cambios' : 'Crear Hito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-1">{formatDate(showDetailModal.date)}</p>
                <h4 className="text-xl font-bold text-text mb-2">{showDetailModal.event}</h4>
                <p className="text-text-light text-sm leading-relaxed">
                  {showDetailModal.description || 'Sin descripción adicional para este hito.'}
                </p>
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
