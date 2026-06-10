import { useState, useEffect, useContext } from 'react';
import { useNavigate} from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast'; 

/**
 * Componente Perfil: Panel de configuración integral del usuario.
 * Permite gestionar: preferencias visuales (tema/color), datos de cuenta, 
 * catálogo de etiquetas y el flujo de eliminación de cuenta.
 */
export default function Perfil() {
  const { aplicarPreferenciasVisuales, logout } = useContext(AuthContext); 

  // Estados de gestión de la cuenta
  const [faseBorrado, setFaseBorrado] = useState('inicial'); // Flujo multi-paso para borrado
  const [usuario, setUsuario] = useState({ nombre: 'Cargando...', email: 'Cargando...' });
  const [perfilForm, setPerfilForm] = useState({ nombre: '', passwordActual: '', nuevaPassword: '' });
  
  // Estados de gestión de catálogo
  const [etiquetas, setEtiquetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState('#6366f1');
  
  // Estados de edición de etiquetas
  const [idEtiquetaEditando, setIdEtiquetaEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const [passwordBorrado, setPasswordBorrado] = useState('');
  const [cargandoAccion, setCargandoAccion] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    cargarUsuario();
    cargarEtiquetas();
  }, []);

  /**
   * Obtiene la información del perfil actual del usuario para hidratar el formulario.
   */
  const cargarUsuario = async () => {
    try {
      const res = await api.get('/usuario/me');
      setUsuario({ 
        nombre: res.data.nombre, 
        email: res.data.email, 
        preferenciasSistema: res.data.preferenciasSistema 
      });
      setPerfilForm(prev => ({ ...prev, nombre: res.data.nombre || '' }));
    } catch (error) {
      setUsuario({ nombre: 'Usuario Desconocido', email: 'Error al cargar' });
    }
  };

  const cargarEtiquetas = async () => {
    try {
      const res = await api.get('/etiquetas');
      setEtiquetas(res.data || []);
    } catch (error) {
      toast.error("No se pudieron cargar las etiquetas.");
    } finally {
      setCargando(false);
    }
  };

  /**
   * Gestión de catálogo: Crea una nueva etiqueta en el sistema.
   */
  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      await api.post('/etiquetas', { nombre: nuevoNombre.trim(), color: nuevoColor });
      setNuevoNombre(''); 
      setNuevoColor('#6366f1'); 
      cargarEtiquetas();
      toast.success("Etiqueta añadida al catálogo");
    } catch (error) { toast.error("Error al crear la etiqueta."); }
  };

  const handleActivarEdicion = (tag) => {
    setIdEtiquetaEditando(tag.id); 
    setEditNombre(tag.nombre); 
    setEditColor(tag.color || '#6366f1');
  };

  /**
   * Gestión de catálogo: Actualiza una etiqueta existente.
   */
  const handleGuardarEdicion = async (id) => {
    if (!editNombre.trim()) return;
    try {
      await api.put(`/etiquetas/${id}`, { nombre: editNombre.trim(), color: editColor });
      setIdEtiquetaEditando(null); 
      cargarEtiquetas();
      toast.success("Etiqueta actualizada"); 
    } catch (error) { toast.error("Error al actualizar la etiqueta."); }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que quieres archivar esta etiqueta? Ya no aparecerá en tus nuevos registros.")) {
      try {
        await api.delete(`/etiquetas/${id}`); cargarEtiquetas();
        toast.success("Etiqueta archivada"); 
      } catch (error) { toast.error("Error al archivar la etiqueta."); }
    }
  };

  /**
   * Persiste las preferencias visuales tanto en el backend como en el DOM actual.
   */
  const handleCambiarInterfaz = async (nuevoTema, nuevoColor) => {
    setUsuario(prev => ({ ...prev, preferenciasSistema: { ...prev.preferenciasSistema, tema: nuevoTema, colorPrincipal: nuevoColor } }));
    aplicarPreferenciasVisuales({ 
      tema: nuevoTema, 
      colorPrincipal: nuevoColor, 
      familiaIconos: usuario.preferenciasSistema?.familiaIconos || 'clasica' });
    try {
      await api.put('/usuario/interfaz', { tema: nuevoTema, colorPrincipal: nuevoColor, familiaIconos: 'default' });
    } catch (error) { toast.error("Error al guardar preferencias de interfaz."); }
  };

  // const handleCambiarPaleta = async (paletaId) => {
  //   setUsuario(prev => ({ ...prev, preferenciasSistema: { ...prev.preferenciasSistema, familiaIconos: paletaId } }));
  //   aplicarPreferenciasVisuales({ tema: usuario.preferenciasSistema?.tema || 'claro', colorPrincipal: usuario.preferenciasSistema?.colorPrincipal || 'indigo', familiaIconos: paletaId });
  //   try {
  //     await api.put('/usuario/escala', { escalaPersonalizada: {}, familiaIconos: paletaId });
  //   } catch(e) { toast.error("Error al guardar la paleta de escala."); }
  // };

  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setCargandoAccion(true);
    try {
      await api.put('/usuario/perfil', perfilForm);
      toast.success("¡Cuenta actualizada con éxito!"); 
      setPerfilForm(prev => ({ ...prev, passwordActual: '', nuevaPassword: '' })); 
      cargarUsuario(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al actualizar la cuenta."); 
    } finally {
      setCargandoAccion(false);
    }
  };

  /**
   * Flujo de eliminación de cuenta: Solicita confirmación y validación de contraseña
   * para prevenir borrados accidentales de datos históricos.
   */
  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    
    setCargandoAccion(true);
    try {

      await api.post('/usuario/cuenta/eliminar', { password: passwordBorrado });
      
      toast.success("Tu cuenta ha sido eliminada. Lamentamos verte partir.");
      logout(); 
      navigate('/');

    } catch (err) {
      toast.error(err.response?.data?.message || "Contraseña incorrecta. Se ha abortado la eliminación."); 
      setPasswordBorrado('');
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

          {/* TARJETA 2: ACTUALIZAR DATOS Y CONTRASEÑA */}
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

          {/* TARJETA 3: ZONA DE PELIGRO */}
        <div className="rounded-3xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-6 shadow-sm transition-all duration-300">
          
          {/* PASO 1: Estado Inicial */}
          {faseBorrado === 'inicial' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-500">Zona de Peligro</h2>
                <p className="text-sm text-red-700/70 dark:text-red-400/80">
                  Elimina tu cuenta y todos tus datos permanentemente.
                </p>
              </div>
              <button 
                onClick={() => setFaseBorrado('advertencia')} 
                className="rounded-xl border-2 border-red-600 bg-transparent px-6 py-2.5 font-bold text-red-600 transition hover:bg-red-600 hover:text-white shrink-0"
              >
                Eliminar Cuenta
              </button>
            </div>
          )}

          {/* PASOS 2, 3 y 4: Advertencia Crítica y Solicitud de Contraseña */}
          {faseBorrado === 'advertencia' && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <div className="mb-4 flex items-start space-x-3 rounded-xl bg-red-100 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                <svg className="h-6 w-6 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-400">¡Advertencia Crítica!</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Esta acción es <strong>completamente irreversible</strong>. Perderás tu racha, historial y etiquetas. Para continuar, introduce tu contraseña actual.
                  </p>
                </div>
              </div>

              <form onSubmit={handleEliminarCuenta} className="space-y-4">
                <input 
                  type="password" 
                  required 
                  placeholder="Introduce tu contraseña" 
                  value={passwordBorrado} 
                  onChange={e => setPasswordBorrado(e.target.value)} 
                  className="w-full rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-surface p-3 text-main focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" 
                />
                
                <div className="flex space-x-3">
                  {/* Flujo Alternativo 2: Cancelar Proceso */}
                  <button 
                    type="button"
                    onClick={() => {
                      setFaseBorrado('inicial');
                      setPasswordBorrado('');
                    }}
                    className="flex-1 rounded-xl bg-white dark:bg-surface border border-gray-300 dark:border-gray-700 py-3 font-semibold text-main hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={cargandoAccion} 
                    className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50 shadow-md"
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </form>
            </div>
          )}
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
                          <button onClick={() => setIdEtiquetaEditando(null)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-canvas px-3 py-1 text-xs font-bold text-main/70 hover:bg-gray-200 dark:hover:bg-gray-800">Cancelar</button>
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