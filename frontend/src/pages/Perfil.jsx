import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Perfil() {
  const [etiquetas, setEtiquetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // NUEVO: Estado para guardar los datos reales del usuario
  const [usuario, setUsuario] = useState({ nombre: 'Cargando...', email: 'Cargando...' });

  // Estados para CREAR una nueva etiqueta
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState('#6366f1');

  // Estados para EDITAR una etiqueta existente
  const [idEtiquetaEditando, setIdEtiquetaEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    cargarUsuario();
    cargarEtiquetas();
  }, []);

  // Función para pedir los datos del usuario al backend
  const cargarUsuario = async () => {
    try {
      // Hacemos una petición al backend para obtener el usuario actual
      const res = await api.get('/usuario/me'); 
      setUsuario({
        nombre: res.data.nombre || res.data.username, // Ajusta según tu DTO
        email: res.data.email
      });
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

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      await api.post('/etiquetas', { nombre: nuevoNombre.trim(), color: nuevoColor });
      setNuevoNombre('');
      setNuevoColor('#6366f1');
      cargarEtiquetas();
    } catch (error) {
      alert("Error al crear la etiqueta. Quizás ya exista.");
    }
  };

  const handleActivarEdicion = (tag) => {
    setIdEtiquetaEditando(tag.id);
    setEditNombre(tag.nombre);
    setEditColor(tag.color || '#6366f1');
  };

  const handleGuardarEdicion = async (id) => {
    if (!editNombre.trim()) return;
    try {
      await api.put(`/etiquetas/${id}`, { nombre: editNombre.trim(), color: editColor });
      setIdEtiquetaEditando(null);
      // ¡ARREGLADO! Hemos quitado la función fantasma que rompía el código
      cargarEtiquetas();
    } catch (error) {
      alert("Error al actualizar la etiqueta.");
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que quieres archivar esta etiqueta? Ya no aparecerá en tus nuevos registros.")) {
      try {
        await api.delete(`/etiquetas/${id}`);
        cargarEtiquetas();
      } catch (error) {
        alert("Error al archivar la etiqueta.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Mi Perfil</h1>
        <p className="mt-1 text-gray-600">Gestiona tus datos personales y tu catálogo de etiquetas.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        
        {/* TARJETA 1: DATOS PERSONALES */}
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="border-b pb-2 text-xl font-bold text-gray-800">Datos del Usuario</h2>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Cuenta Activa</span>
            {/* AHORA MOSTRAMOS LOS DATOS REALES DE MONGODB */}
            <p className="mt-1 text-lg font-bold text-gray-800">{usuario.nombre}</p>
            <p className="text-sm text-gray-500">{usuario.email}</p>
          </div>
          
          <div className="border-t border-dashed pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Personalización</h3>
            <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-center">
              <span className="text-xs font-semibold text-indigo-700">🎨 Próximamente (M6)</span>
            </div>
          </div>
        </div>

        {/* TARJETA 2 y 3: GESTIÓN DEL CATÁLOGO DE ETIQUETAS */}
        <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="border-b pb-2 text-xl font-bold text-gray-800">Catálogo de Etiquetas</h2>

          <form onSubmit={handleCrear} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-gray-500">Nueva Etiqueta:</label>
              <input 
                type="text" placeholder="Ej. Gimnasio, Trabajo..." required
                value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col items-start">
              <label className="text-xs font-bold uppercase text-gray-500">Color:</label>
              <div className="mt-1 flex items-center space-x-2">
                <input 
                  type="color" 
                  value={nuevoColor} onChange={(e) => setNuevoColor(e.target.value)}
                  className="h-9 w-10 cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-xs text-gray-400">{nuevoColor}</span>
              </div>
            </div>
            <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
              Añadir
            </button>
          </form>

          {cargando ? (
            <div className="text-center text-sm text-gray-500">Cargando catálogo...</div>
          ) : etiquetas.length === 0 ? (
            <div className="py-4 text-center text-sm italic text-gray-400">Aún no has creado ninguna etiqueta en tu catálogo.</div>
          ) : (
            <div className="scrollbar-thin max-h-[350px] space-y-3 overflow-y-auto pr-1">
              {etiquetas.map((tag) => {
                const enEdicion = idEtiquetaEditando === tag.id;
                
                return (
                  <div key={tag.id} className="flex items-center justify-between rounded-xl border bg-white p-3 transition hover:bg-gray-50">
                    {enEdicion ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <input 
                          type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)}
                          className="rounded-lg border p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <input 
                          type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
                          className="h-8 w-10 cursor-pointer border-none bg-transparent"
                        />
                        <div className="flex space-x-2 sm:ml-auto">
                          <button onClick={() => handleGuardarEdicion(tag.id)} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-800">
                            Guardar
                          </button>
                          <button onClick={() => setIdEtiquetaEditando(null)} className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-300">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <span 
                            className="inline-block rounded-full border-2 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm"
                            style={{ borderColor: tag.color || '#818cf8' }}
                          >
                            {tag.nombre}
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <button onClick={() => handleActivarEdicion(tag)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                            Editar
                          </button>
                          <button onClick={() => handleEliminar(tag.id)} className="text-sm font-semibold text-red-500 hover:text-red-700">
                            Eliminar
                          </button>
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