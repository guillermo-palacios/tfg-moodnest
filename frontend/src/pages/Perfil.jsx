import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Perfil() {
  const { aplicarPreferenciasVisuales, logout } = useContext(AuthContext); 

  const [etiquetas, setEtiquetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState({ nombre: 'Cargando...', email: 'Cargando...' });

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState('#6366f1');

  const [idEtiquetaEditando, setIdEtiquetaEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');

  // --- NUEVOS ESTADOS CU3 y CU5 ---
  const [perfilForm, setPerfilForm] = useState({ nombre: '', passwordActual: '', nuevaPassword: '' });
  const [passwordBorrado, setPasswordBorrado] = useState('');
  const [cargandoAccion, setCargandoAccion] = useState(false);

  useEffect(() => {
    cargarUsuario();
    cargarEtiquetas();
  }, []);

  const cargarUsuario = async () => {
    try {
      const res = await api.get('/usuario/me');
      setUsuario({
        nombre: res.data.nombre || res.data.username, 
        email: res.data.email,
        preferenciasSistema: res.data.preferenciasSistema
      });
      setPerfilForm(prev => ({ ...prev, nombre: res.data.nombre || '' }));
    } catch (error) {
      console.error("Error al cargar el usuario real:", error);
      setUsuario({ nombre: 'Usuario Desconocido', email: 'No se pudo cargar el correo' });
    }
  };

  const cargarEtiquetas = async () => {
    try {
      const res = await api.get('/etiquetas');
      setEtiquetas(res.data || []);
    } catch (error) {
      console.error("Error al cargar las etiquetas:", error);
    } finally {
      setCargando(false);
    }
  };

  // --- LÓGICA ETIQUETAS ---
  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      await api.post('/etiquetas', { nombre: nuevoNombre.trim(), color: nuevoColor });
      setNuevoNombre(''); setNuevoColor('#6366f1'); cargarEtiquetas();
    } catch (error) { alert("Error al crear la etiqueta. Quizás ya exista."); }
  };

  const handleActivarEdicion = (tag) => {
    setIdEtiquetaEditando(tag.id); setEditNombre(tag.nombre); setEditColor(tag.color || '#6366f1');
  };

  const handleGuardarEdicion = async (id) => {
    if (!editNombre.trim()) return;
    try {
      await api.put(`/etiquetas/${id}`, { nombre: editNombre.trim(), color: editColor });
      setIdEtiquetaEditando(null); cargarEtiquetas();
    } catch (error) { alert("Error al actualizar la etiqueta."); }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que quieres archivar esta etiqueta? Ya no aparecerá en tus nuevos registros.")) {
      try {
        await api.delete(`/etiquetas/${id}`); cargarEtiquetas();
      } catch (error) { alert("Error al archivar la etiqueta."); }
    }
  };

  const handleCambiarInterfaz = async (nuevoTema, nuevoColor) => {
    setUsuario(prev => ({ ...prev, preferenciasSistema: { ...prev.preferenciasSistema, tema: nuevoTema, colorPrincipal: nuevoColor } }));
    aplicarPreferenciasVisuales({ tema: nuevoTema, colorPrincipal: nuevoColor, familiaIconos: usuario.preferenciasSistema?.familiaIconos || 'clasica' });
    try {
      await api.put('/usuario/interfaz', { tema: nuevoTema, colorPrincipal: nuevoColor, familiaIconos: 'default' });
    } catch (error) { console.error("Error al guardar preferencias:", error); }
  };

  const handleCambiarPaleta = async (paletaId) => {
    setUsuario(prev => ({ ...prev, preferenciasSistema: { ...prev.preferenciasSistema, familiaIconos: paletaId } }));
    aplicarPreferenciasVisuales({ tema: usuario.preferenciasSistema?.tema || 'claro', colorPrincipal: usuario.preferenciasSistema?.colorPrincipal || 'indigo', familiaIconos: paletaId });
    try {
      await api.put('/usuario/escala', { escalaPersonalizada: {}, familiaIconos: paletaId });
    } catch(e) { console.error(e); }
  };

  // --- NUEVA LÓGICA CU3 (GESTIONAR PERFIL) ---
  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setCargandoAccion(true);
    try {
      await api.put('/usuario/perfil', perfilForm);
      alert("¡Perfil actualizado con éxito!");
      setPerfilForm(prev => ({ ...prev, passwordActual: '', nuevaPassword: '' })); // Limpiamos contraseñas
      cargarUsuario(); // Recargamos para reflejar cambios
    } catch (err) {
      alert(err.response?.data?.message || "Error al actualizar perfil.");
    } finally {
      setCargandoAccion(false);
    }
  };

  // --- NUEVA LÓGICA CU5 (ELIMINAR CUENTA) ---
  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    if (!window.confirm("¡ATENCIÓN! Esta acción es irreversible. ¿Deseas eliminar tu cuenta y todos tus datos?")) return;
    
    setCargandoAccion(true);
    try {
      // Axios DELETE con body se manda usando la config 'data'
      await api.delete('/usuario/cuenta', { data: { password: passwordBorrado } });
      alert("Tu cuenta ha sido eliminada. Lamentamos verte partir.");
      logout(); // Cierra la sesión y redirige al inicio
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar la cuenta. Verifica tu contraseña.");
    } finally {
      setCargandoAccion(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-main">Mi Perfil</h1>
        <p className="mt-1 text-main/70">Gestiona tus datos, apariencia y preferencias.</p>
      </div>

      {/* DISEÑO EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* COLUMNA IZQUIERDA: PERSONALIZACIÓN Y CUENTA */}
        <div className="space-y-8">
          
          {/* TARJETA 1: ASPECTO VISUAL */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm transition-colors duration-300">
            <h2 className="mb-4 text-xl font-bold text-main">Personalización visual</h2>
            
            <div className="mb-6">
              <span className="mb-2 block text-sm font-semibold text-main/80">Modo visual</span>
              <div className="flex rounded-xl bg-canvas p-1 border border-gray-200 dark:border-gray-800">
                <button onClick={() => handleCambiarInterfaz('claro', usuario.preferenciasSistema?.colorPrincipal || 'indigo')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${(usuario.preferenciasSistema?.tema || 'claro') === 'claro' ? 'bg-surface text-main shadow-sm' : 'text-main/50 hover:text-main'}`}>Claro</button>
                <button onClick={() => handleCambiarInterfaz('oscuro', usuario.preferenciasSistema?.colorPrincipal || 'indigo')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${usuario.preferenciasSistema?.tema === 'oscuro' ? 'bg-surface text-main shadow-sm' : 'text-main/50 hover:text-main'}`}>Oscuro</button>
              </div>
            </div>

            <div className="mb-6">
              <span className="mb-2 block text-sm font-semibold text-main/80">Color principal</span>
              <div className="flex gap-4">
                {[
                  { nombre: 'indigo', hex: 'bg-indigo-600', ring: 'ring-indigo-500' },
                  { nombre: 'emerald', hex: 'bg-emerald-500', ring: 'ring-emerald-400' },
                  { nombre: 'rose', hex: 'bg-rose-500', ring: 'ring-rose-400' },
                  { nombre: 'amber', hex: 'bg-amber-500', ring: 'ring-amber-400' },
                  { nombre: 'blue', hex: 'bg-blue-500', ring: 'ring-blue-400' },
                ].map((color) => {
                  const isSelected = (usuario.preferenciasSistema?.colorPrincipal || 'indigo') === color.nombre;
                  return (
                    <button key={color.nombre} onClick={() => handleCambiarInterfaz(usuario.preferenciasSistema?.tema || 'claro', color.nombre)} className={`h-10 w-10 rounded-full ${color.hex} transition-all hover:scale-110 ${isSelected ? `ring-4 ring-offset-2 ring-offset-surface ${color.ring}` : ''}`} title={color.nombre} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* TARJETA 2: ACTUALIZAR DATOS Y CONTRASEÑA (CU3) */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm transition-colors duration-300">
            <h2 className="mb-4 text-xl font-bold text-main">Configuración de Cuenta</h2>
            <form onSubmit={handleActualizarPerfil} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-main/80">Correo (Solo lectura)</label>
                <input type="text" value={usuario.email} disabled className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-canvas p-2.5 text-main/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-main/80">Nombre</label>
                <input type="text" value={perfilForm.nombre} onChange={e => setPerfilForm({...perfilForm, nombre: e.target.value})} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface p-2.5 text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                <span className="mb-2 block text-sm font-semibold text-main/60">Cambiar contraseña (Opcional)</span>
                <input type="password" placeholder="Contraseña actual" value={perfilForm.passwordActual} onChange={e => setPerfilForm({...perfilForm, passwordActual: e.target.value})} className="mb-3 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface p-2.5 text-main focus:border-primary focus:outline-none" />
                <input type="password" placeholder="Nueva contraseña" value={perfilForm.nuevaPassword} onChange={e => setPerfilForm({...perfilForm, nuevaPassword: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface p-2.5 text-main focus:border-primary focus:outline-none" />
              </div>
              <button type="submit" disabled={cargandoAccion} className="w-full rounded-xl bg-primary py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                {cargandoAccion ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          {/* TARJETA 3: ZONA DE PELIGRO (CU5) */}
          <div className="rounded-3xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-6 shadow-sm transition-colors duration-300">
            <h2 className="mb-2 text-xl font-bold text-red-600 dark:text-red-500">Zona de Peligro</h2>
            <p className="mb-4 text-sm text-red-700/70 dark:text-red-400/80">Una vez elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate bien.</p>
            <form onSubmit={handleEliminarCuenta} className="space-y-4">
              <input type="password" required placeholder="Confirma tu contraseña para borrar" value={passwordBorrado} onChange={e => setPasswordBorrado(e.target.value)} className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-surface p-2.5 text-main focus:border-red-500 focus:outline-none" />
              <button type="submit" disabled={cargandoAccion} className="w-full rounded-xl border-2 border-red-600 bg-transparent py-3 font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
                Eliminar Cuenta Permanentemente
              </button>
            </form>
          </div>

        </div>

        {/* COLUMNA DERECHA: CATÁLOGO DE ETIQUETAS */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm transition-colors duration-300 h-fit">
          <h2 className="mb-6 text-xl font-bold text-main">Catálogo de Etiquetas</h2>
          
          <form onSubmit={handleCrear} className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-canvas p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase text-main/50">Nueva Etiqueta:</label>
              <input type="text" placeholder="Ej. Gimnasio" required value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface p-2.5 text-main focus:border-primary focus:outline-none" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="color" value={nuevoColor} onChange={(e) => setNuevoColor(e.target.value)} className="h-10 w-10 cursor-pointer border-none bg-transparent" />
              <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">Añadir</button>
            </div>
          </form>

          {cargando ? (
            <div className="text-center text-sm text-main/50">Cargando catálogo...</div>
          ) : etiquetas.length === 0 ? (
            <div className="py-4 text-center text-sm italic text-main/40">Aún no has creado ninguna etiqueta.</div>
          ) : (
            <div className="scrollbar-thin max-h-[500px] space-y-3 overflow-y-auto pr-1">
              {etiquetas.map((tag) => {
                const enEdicion = idEtiquetaEditando === tag.id;
                return (
                  <div key={tag.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-surface p-3 transition hover:bg-canvas">
                    {enEdicion ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-surface p-1.5 text-sm text-main focus:border-primary" />
                        <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-8 w-10 cursor-pointer border-none bg-transparent" />
                        <div className="flex space-x-2 sm:ml-auto">
                          <button onClick={() => handleGuardarEdicion(tag.id)} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Guardar</button>
                          <button onClick={() => setIdEtiquetaEditando(null)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-canvas px-3 py-1 text-xs font-bold text-main/70 hover:bg-gray-200">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="inline-block rounded-full border-2 px-3 py-1 text-xs font-bold text-main" style={{ borderColor: tag.color || 'var(--color-primary)' }}>{tag.nombre}</span>
                        <div className="flex space-x-3">
                          <button onClick={() => handleActivarEdicion(tag)} className="text-sm font-semibold text-primary hover:opacity-80">Editar</button>
                          <button onClick={() => handleEliminar(tag.id)} className="text-sm font-semibold text-red-500 hover:text-red-700">Eliminar</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}