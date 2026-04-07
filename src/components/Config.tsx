import React from 'react';
import { 
  UserPlus, 
  Upload, 
  Users, 
  Database, 
  Shield, 
  FileUp,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Config = () => {
  const [activeTab, setActiveTab] = React.useState<'users' | 'data'>('users');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const [uploadData, setUploadData] = React.useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadData(null);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('facore_token');
    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadData(result.data);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (err) {
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const [users, setUsers] = React.useState<any[]>([]);
  const [dbStatus, setDbStatus] = React.useState<any>(null);
  
  // Estados para nuevo usuario
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ email: '', password: '', role: 'visor' });
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);

  // Estados para carga manual
  const [manualData, setManualData] = React.useState({
    year: 2026,
    month: 'Abril',
    ventasNetas: '',
    costo: '',
    gastos: ''
  });
  const [isSavingManual, setIsSavingManual] = React.useState(false);

  const fetchUsers = async () => {
    const token = localStorage.getItem('facore_token');
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    const token = localStorage.getItem('facore_token');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        setShowUserModal(false);
        setNewUser({ email: '', password: '', role: 'visor' });
        fetchUsers();
      } else {
        alert('Error al crear usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    const token = localStorage.getItem('facore_token');
    
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthIndex = months.indexOf(manualData.month);
    
    const payload = {
      year: Number(manualData.year),
      month: manualData.month,
      monthIndex,
      ventasNetas: Number(manualData.ventasNetas),
      costo: Number(manualData.costo),
      gastos: Number(manualData.gastos),
      resultadoMes: Number(manualData.ventasNetas) - Number(manualData.costo) - Number(manualData.gastos)
    };

    try {
      const response = await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert('Datos guardados correctamente');
        setManualData({ ...manualData, ventasNetas: '', costo: '', gastos: '' });
      } else {
        alert('Error al guardar datos');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setIsSavingManual(false);
    }
  };

  React.useEffect(() => {
    const fetchDbStatus = async () => {
      console.log('📡 Iniciando fetch a /api/db-status');
      try {
        const response = await fetch('/api/db-status');
        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Datos de DB Status:', data);
        setDbStatus(data);
      } catch (err) {
        console.error('❌ Error al obtener estado de DB:', err);
        setDbStatus({ status: 'ERROR', message: 'No se pudo obtener el estado' });
      }
    };
    fetchDbStatus();

    const fetchUsers = async () => {
      const token = localStorage.getItem('facore_token');
      try {
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Configuración del Sistema</h1>
          <p className="text-text-light font-medium">Administra usuarios, permisos y carga de datos financieros.</p>
        </div>
        {dbStatus && (
          <div className={cn(
            "px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold",
            dbStatus.status === 'CONNECTED' ? "bg-success/10 border-success/20 text-success" :
            dbStatus.status === 'MOCK' ? "bg-warning/10 border-warning/20 text-warning" :
            "bg-danger/10 border-danger/20 text-danger"
          )}>
            <Database size={16} />
            <div className="flex flex-col">
              <span>{dbStatus.message}</span>
              {dbStatus.error && <span className="text-[10px] opacity-70 font-normal">{dbStatus.error}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-accent/20">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all relative",
            activeTab === 'users' ? "text-primary" : "text-text-light hover:text-primary"
          )}
        >
          Gestión de Usuarios
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all relative",
            activeTab === 'data' ? "text-primary" : "text-text-light hover:text-primary"
          )}
        >
          Carga de Datos
          {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-text text-xl flex items-center gap-2">
                <Users size={24} className="text-primary" />
                Usuarios Activos
              </h3>
              <button 
                onClick={() => setShowUserModal(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <UserPlus size={18} />
                Nuevo Usuario
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {users.length > 0 ? users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-text">{user.email}</p>
                      <p className="text-xs text-text-light font-medium">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-success/10 text-success"
                    )}>
                      Activo
                    </span>
                    <button className="text-primary font-bold text-sm hover:underline">Editar</button>
                  </div>
                </div>
              )) : (
                <p className="text-center text-text-light py-8">Cargando usuarios...</p>
              )}
            </div>
          </div>

          <div className="glass-card p-8 flex flex-col gap-6">
            <h3 className="font-bold text-text text-lg flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              Roles y Permisos
            </h3>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="font-bold text-primary text-sm">Administrador</p>
                <p className="text-xs text-text-light mt-1">Acceso total al sistema, gestión de usuarios y carga de datos.</p>
              </div>
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <p className="font-bold text-text text-sm">Editor</p>
                <p className="text-xs text-text-light mt-1">Puede visualizar y editar datos financieros, pero no gestionar usuarios.</p>
              </div>
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <p className="font-bold text-text text-sm">Visor</p>
                <p className="text-xs text-text-light mt-1">Acceso de solo lectura a los dashboards y reportes.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="font-bold text-text text-xl mb-6 flex items-center gap-2">
              <FileUp size={24} className="text-primary" />
              Cargar Archivo PDF
            </h3>
            <p className="text-text-light text-sm mb-8">
              Sube el archivo "CUADRO DE RESULTADO" en formato PDF. El sistema extraerá automáticamente las ventas, costos y gastos.
            </p>

            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all",
                isUploading ? "border-primary bg-primary/5" : "border-accent/30 group-hover:border-primary group-hover:bg-primary/5"
              )}>
                {isUploading ? (
                  <Loader2 className="text-primary animate-spin" size={48} />
                ) : uploadStatus === 'success' ? (
                  <Check className="text-success" size={48} />
                ) : (
                  <Upload className="text-text-light group-hover:text-primary" size={48} />
                )}
                <div className="text-center">
                  <p className="font-bold text-text">
                    {isUploading ? 'Procesando archivo...' : 
                     uploadStatus === 'success' ? '¡Archivo cargado con éxito!' : 
                     'Haz clic o arrastra el PDF aquí'}
                  </p>
                  <p className="text-xs text-text-light mt-1">Tamaño máximo: 10MB</p>
                </div>
              </div>
            </div>

            {uploadStatus === 'success' && (
              <div className="mt-6 p-6 bg-success/10 border border-success/20 rounded-xl flex flex-col gap-4 text-success">
                <div className="flex items-center gap-3">
                  <Check size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">¡Archivo procesado con éxito!</span>
                </div>
                {uploadData && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-success/20">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold opacity-70">Periodo</span>
                      <span className="font-bold text-text">{uploadData.month} {uploadData.year}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold opacity-70">Ventas</span>
                      <span className="font-bold text-text">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(uploadData.ventasNetas)}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs font-medium mt-2">Los datos han sido actualizados en la base de datos PostgreSQL y ya están disponibles en los reportes.</p>
              </div>
            )}
          </div>

          <div className="glass-card p-8">
            <h3 className="font-bold text-text text-xl mb-6 flex items-center gap-2">
              <Database size={24} className="text-primary" />
              Carga Manual de Datos
            </h3>
            <form onSubmit={handleManualSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Año</label>
                  <select 
                    className="input-field"
                    value={manualData.year}
                    onChange={(e) => setManualData({ ...manualData, year: Number(e.target.value) })}
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Mes</label>
                  <select 
                    className="input-field"
                    value={manualData.month}
                    onChange={(e) => setManualData({ ...manualData, month: e.target.value })}
                  >
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Ventas Netas</label>
                <input 
                  type="number" 
                  placeholder="$ 0" 
                  className="input-field"
                  value={manualData.ventasNetas}
                  onChange={(e) => setManualData({ ...manualData, ventasNetas: e.target.value })}
                  required
                />
              </div>
              <div className="flex grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Costo</label>
                  <input 
                    type="number" 
                    placeholder="$ 0" 
                    className="input-field"
                    value={manualData.costo}
                    onChange={(e) => setManualData({ ...manualData, costo: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-light uppercase">Gastos</label>
                  <input 
                    type="number" 
                    placeholder="$ 0" 
                    className="input-field"
                    value={manualData.gastos}
                    onChange={(e) => setManualData({ ...manualData, gastos: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSavingManual}
                className="btn-primary mt-4 flex items-center justify-center gap-2"
              >
                {isSavingManual ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Guardar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <UserPlus size={24} />
              Crear Nuevo Usuario
            </h3>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  className="input-field"
                  placeholder="usuario@facore.cl"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Contraseña</label>
                <input 
                  type="password" 
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-light uppercase">Rol</label>
                <select 
                  className="input-field"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="visor">Visor</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-3 px-4 bg-accent/10 text-text font-bold rounded-xl hover:bg-accent/20 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
