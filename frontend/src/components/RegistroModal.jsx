import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

// Añadimos 'registroAEditar' como parámetro (por defecto null)
export default function RegistroModal({ isOpen, onClose, onSuccess, registrosPrevios = [], registroAEditar = null }) {
  const [cargando, setCargando] = useState(false);
  const [etiquetasCatalogo, setEtiquetasCatalogo] = useState([]);
  
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [puntuacionGlobal, setPuntuacionGlobal] = useState(5);
  const [comentario, setComentario] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([]); 

  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [nuevaEtiquetaNombre, setNuevaEtiquetaNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarEtiquetas();
      
      // MODO EDICIÓN: Si nos pasan un registro, rellenamos los campos
      if (registroAEditar) {
        setFecha(registroAEditar.fechaAsignada.split('T')[0]);
        setPuntuacionGlobal(registroAEditar.puntuacionGlobal);
        setComentario(registroAEditar.comentario || '');
        // Adaptamos las etiquetas asociadas al formato que usa nuestro estado
        setEtiquetasSeleccionadas(
          registroAEditar.etiquetasAsociadas?.map(e => ({
            etiquetaId: e.idEtiqueta,
            puntuacion: e.puntuacion
          })) || []
        );
      } else {
        // MODO CREACIÓN: Limpiamos los campos
        setFecha(new Date().toISOString().split('T')[0]);
        setPuntuacionGlobal(5);
        setComentario('');
        setEtiquetasSeleccionadas([]);
      }
      setCreandoEtiqueta(false);
    }
  }, [isOpen, registroAEditar]); // Importante vigilar si cambia el registro a editar

  const cargarEtiquetas = async () => {
    try {
      const res = await api.get('/etiquetas');
      setEtiquetasCatalogo(res.data || []);
    } catch (err) {
      console.error("Error al cargar etiquetas", err);
    }
  };

  const toggleEtiqueta = (id) => {
    if (etiquetasSeleccionadas.find(e => e.etiquetaId === id)) {
      setEtiquetasSeleccionadas(etiquetasSeleccionadas.filter(e => e.etiquetaId !== id));
    } else {
      setEtiquetasSeleccionadas([...etiquetasSeleccionadas, { etiquetaId: id, puntuacion: null }]);
    }
  };

  const setPuntuacionEtiqueta = (id, nota) => {
    setEtiquetasSeleccionadas(etiquetasSeleccionadas.map(e => 
      e.etiquetaId === id ? { ...e, puntuacion: parseInt(nota) } : e
    ));
  };

  const handleCrearEtiqueta = async () => {
    const nombreLimpio = nuevaEtiquetaNombre.trim();
    if (!nombreLimpio) return;

    const existe = etiquetasCatalogo.some(e => e.nombre.toLowerCase() === nombreLimpio.toLowerCase());
    if (existe) {
      alert("Ya tienes una etiqueta con ese nombre en tu catálogo.");
      return;
    }

    try {
      const res = await api.post('/etiquetas', { nombre: nombreLimpio });
      setEtiquetasCatalogo([...etiquetasCatalogo, res.data]); 
      toggleEtiqueta(res.data.id); 
      setNuevaEtiquetaNombre('');
      setCreandoEtiqueta(false);
    } catch (err) {
      alert("Error al crear etiqueta.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIÓN: Evitar duplicados, PERO ignorar el registro que estamos editando actualmente
    const yaExisteRegistro = registrosPrevios.some(
      r => r.fechaAsignada.startsWith(fecha) && r.id !== registroAEditar?.id
    );
    
    if (yaExisteRegistro) {
      alert("Ya has creado otro registro para esta fecha.");
      return;
    }

    setCargando(true);

    const etiquetasFormateadas = etiquetasSeleccionadas.map(etiqueta => ({
        idEtiqueta: etiqueta.etiquetaId, 
        puntuacion: etiqueta.puntuacion || null
    }));

    const registroData = {
      fechaAsignada: `${fecha}T12:00:00`,
      puntuacionGlobal,
      comentario: comentario.trim() !== '' ? comentario : null,
      etiquetasAsociadas: etiquetasFormateadas
    };

    try {
      if (registroAEditar) {
        // Si estamos editando, hacemos un PUT
        await api.put(`/registros/${registroAEditar.id}`, registroData);
      } else {
        // Si estamos creando, hacemos un POST
        await api.post('/registros', registroData);
      }
      onSuccess(); 
      onClose();   
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar el registro.");
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {registroAEditar ? 'Editar Registro' : 'Crear Nuevo Registro'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700">Fecha:</label>
            <input type="date" required max={new Date().toISOString().split('T')[0]} value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-gray-700">Puntuación Global:</label>
              <span className="text-xl font-black text-indigo-600">{puntuacionGlobal}</span>
            </div>
            <input type="range" min="1" max="10" value={puntuacionGlobal} onChange={(e) => setPuntuacionGlobal(parseInt(e.target.value))} className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-indigo-600" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Etiquetas (opcional):</label>
            <div className="flex flex-wrap items-center gap-2">
              {etiquetasCatalogo.length === 0 && !creandoEtiqueta && (
                <span className="text-sm italic text-gray-500">Aún no tienes etiquetas.</span>
              )}
              {etiquetasCatalogo.map(tag => {
                const seleccionada = etiquetasSeleccionadas.find(e => e.etiquetaId === tag.id);
                return (
                  <div key={tag.id} className="flex flex-col items-center">
                    <button type="button" onClick={() => toggleEtiqueta(tag.id)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${seleccionada ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      {tag.nombre}
                    </button>
                    {seleccionada && (
                      <input type="number" min="1" max="10" placeholder="Nota" value={seleccionada.puntuacion || ''} className="mt-1 w-14 rounded-md border border-gray-200 p-1 text-center text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" onChange={(e) => setPuntuacionEtiqueta(tag.id, e.target.value)} />
                    )}
                  </div>
                );
              })}

              {!creandoEtiqueta ? (
                <button type="button" onClick={() => setCreandoEtiqueta(true)} className="flex items-center space-x-1 rounded-full border border-dashed border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  <span>Nueva</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1 rounded-full border border-indigo-200 bg-indigo-50 p-1">
                  <input type="text" placeholder="Ej. Deporte" autoFocus value={nuevaEtiquetaNombre} onChange={(e) => setNuevaEtiquetaNombre(e.target.value)} className="w-24 rounded-full border-none bg-transparent px-2 py-1 text-sm focus:ring-0" />
                  <button type="button" onClick={handleCrearEtiqueta} className="rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <button type="button" onClick={() => setCreandoEtiqueta(false)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Comentario (opcional):</label>
            <textarea rows="3" placeholder="¿Cómo te has sentido hoy?" value={comentario} onChange={(e) => setComentario(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"></textarea>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={cargando} className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:bg-gray-400">
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}