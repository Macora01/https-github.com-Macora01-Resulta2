/**
 * Auth Component
 * Version: 01.00.004
 */
import React from 'react';
import { Lock, Mail, ArrowRight, BarChart3, Play } from 'lucide-react';
import { APP_VERSION } from '../version';

export const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log(`🔐 Intentando login para: ${email}`);
      // Intentar POST primero
      let response;
      try {
        const postUrl = '/api/auth/session';
        console.log(`📡 Enviando POST a ${postUrl}...`);
        response = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        console.log(`📥 Respuesta POST: ${response.status} ${response.statusText}`);
      } catch (postErr) {
        console.warn('❌ Error de red en POST /api/auth/session:', postErr);
        // Si el fetch falla (ej. por CORS en un 405), forzamos el fallback
        response = { status: 405, ok: false };
      }
      
      // Si el POST falla con 405 o error de red, intentar GET como fallback
      if (response.status === 405 || !response.ok) {
        console.warn(`⚠️ POST falló. Intentando GET fallback...`);
        const params = new URLSearchParams({ u: email, p: password });
        const getUrl = `/api/auth/session?${params.toString()}`;
        try {
          response = await fetch(getUrl, {
            method: 'GET',
            headers: { 
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
          });
          console.log(`📥 Respuesta GET fallback: ${response.status} ${response.statusText}`);
          console.log(`🔗 URL final (tras posibles redirecciones): ${response.url}`);
          
          if (response.url.endsWith('/') || !response.url.includes('/api/')) {
            console.error('🚨 ¡REDIRECCIÓN DETECTADA! El servidor redirigió la API a la página principal.');
          }
        } catch (getErr) {
          console.error('❌ Error de red en GET fallback:', getErr);
          throw new Error('No se pudo contactar con el servidor mediante ningún método.');
        }
      }
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('facore_token', data.token);
        onLogin(data.user);
      } else {
        let errorMessage = 'Error al iniciar sesión';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `Error del servidor (${response.status}): El servidor no devolvió una respuesta válida.`;
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error('❌ Error de login:', err);
      alert(`Error de conexión: No se pudo contactar con el servidor. Verifica que el backend esté corriendo.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">
            <BarChart3 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Resulta2 - Dashboard Financiero</h1>
          <p className="text-text-light font-medium mt-2">Ingresa tus credenciales para acceder al dashboard</p>
        </div>

        {isLoading && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Conectando con el servidor...
          </div>
        )}

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@facore.cl"
                  className="input-field w-full !pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full !pl-10"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-accent/20 text-center flex flex-col gap-2">
            <p className="text-xs text-text-light font-medium uppercase tracking-widest">
              Acceso Restringido • Facore 2026
            </p>
            <p className="text-[10px] text-text-light/60 font-mono">
              v{APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
