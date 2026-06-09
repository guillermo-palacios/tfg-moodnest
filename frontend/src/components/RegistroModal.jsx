import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast'; 


/**
 * Modal dinámico para la creación y edición de registros diarios.
 * * @param {Object} props
 * @param {boolean} props.isOpen - Estado de visibilidad del modal.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Function} props.onSuccess - Callback ejecutado tras guardar exitosamente.
 * @param {Array} props.registrosPrevios - Historial actual para prevenir registros duplicados por fecha.
 * @param {Object|null} props.registroAEditar - Objeto de registro si estamos en modo edición, null si es nuevo.
 * @param {string|null} props.fechaPorDefecto - Fecha inicial (ISO) para el formulario.
 */
export default function RegistroModal({ isOpen, onClose, onSuccess, registrosPrevios = [], registroAEditar = null, fechaPorDefecto = null }) {
  const [cargando, setCargando] = useState(false);
  const [etiquetasCatalogo, setEtiquetasCatalogo] = useState([]);
  
  const [fecha, setFecha] = useState('');
  const [puntuacionGlobal, setPuntuacionGlobal] = useState(5);
  const [comentario, setComentario] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([]); 

  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [nuevaEtiquetaNombre, setNuevaEtiquetaNombre] = useState('');
  
  /**
   * Determina la clase CSS de estilo según la puntuación seleccionada.
   * Proporciona feedback visual inmediato del "estado de ánimo".
   */
  const colorPuntuacion = (nota) => {
    if (nota >= 9) return 'bg-mood-9 text-white shadow-md';
    if (nota >= 7) return 'bg-mood-7 text-white shadow-md';
    if (nota >= 5) return 'bg-mood-5 text-white shadow-md';
    if (nota >= 3) return 'bg-mood-3 text-white shadow-md';
    return 'bg-mood-1 text-white shadow-md';
  };

  /**
   * Efecto de inicialización: carga etiquetas y formatea los datos 
   * dependiendo de si el formulario está en modo "Creación" o "Edición".
   */
  useEffect(() => {
    if (isOpen) {
      cargarEtiquetas();
      
      if (registroAEditar) {
        // Modo Edición: Mapeamos los datos del registro existente al estado local
        setFecha(registroAEditar.fechaAsignada.split('T')[0]);
        setPuntuacionGlobal(registroAEditar.puntuacionGlobal);
        setComentario(registroAEditar.comentario || '');
        setEtiquetasSeleccionadas(
          registroAEditar.etiquetasAsociadas?.map(e => ({ etiquetaId: e.idEtiqueta, puntuacion: e.puntuacion })) || []
        );
      } else {
        // Modo Creación: Calculamos la fecha actual o usamos la pasada por props
        let f = fechaPorDefecto ? new Date(fechaPorDefecto) : new Date();
        const year = f.getFullYear();
        const month = String(f.getMonth() + 1).padStart(2, '0');
        const day = String(f.getDate()).padStart(2, '0');
        
        setFecha(`${year}-${month}-${day}`);
        setPuntuacionGlobal(5);
        setComentario('');
        setEtiquetasSeleccionadas([]);
      }
      setCreandoEtiqueta(false);
    }
  }, [isOpen, registroAEditar, fechaPorDefecto]);

  const cargarEtiquetas = async () => {
    try {
      const res = await api.get('/etiquetas');
      setEtiquetasCatalogo(res.data || []);
    } catch (err) { console.error("Error al cargar etiquetas", err); }
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

  /**
   * Crea una nueva etiqueta mediante API y la añade al estado local.
   * Incluye validación de duplicados para evitar conflictos en el catálogo.
   */
  const handleCrearEtiqueta = async () => {
    const nombreLimpio = nuevaEtiquetaNombre.trim();
    if (!nombreLimpio) return;

    const existe = etiquetasCatalogo.some(e => e.nombre.toLowerCase() === nombreLimpio.toLowerCase());
    if (existe) { 
      toast.error("Ya tienes una etiqueta con ese nombre en tu catálogo."); 
      return; 
    }

    try {
      const res = await api.post('/etiquetas', { nombre: nombreLimpio });
      setEtiquetasCatalogo([...etiquetasCatalogo, res.data]); 
      toggleEtiqueta(res.data.id); 
      setNuevaEtiquetaNombre('');
      setCreandoEtiqueta(false);
      toast.success("Etiqueta añadida.");
    } catch (err) { toast.error("Error al crear etiqueta."); }
  };

  /**
   * Envío del formulario. 
   * Incluye validación de unicidad de fecha (no permitir dos registros el mismo día)
   * y gestión de llamadas API (PUT para editar, POST para crear).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar duplicidad de fecha (excluyendo el propio registro si estamos editando)
    const yaExisteRegistro = registrosPrevios.some(
      r => r.fechaAsignada.startsWith(fecha) && r.id !== registroAEditar?.id
    );
    
    if (yaExisteRegistro) { 
      toast.error("Ya has creado otro registro para esta fecha.");
      return; 
    }

    setCargando(true);
    const etiquetasFormateadas = etiquetasSeleccionadas.map(etiqueta => ({
        idEtiqueta: etiqueta.etiquetaId, puntuacion: etiqueta.puntuacion || null
    }));

    const registroData = {
      fechaAsignada: `${fecha}T12:00:00`,
      puntuacionGlobal,
      comentario: comentario.trim() !== '' ? comentario : null,
      etiquetasAsociadas: etiquetasFormateadas
    };

    try {
      if (registroAEditar) {
        await api.put(`/registros/${registroAEditar.id}`, registroData);
        toast.success("Registro actualizado correctamente."); 
      } else {
        await api.post('/registros', registroData);
        toast.success("Registro guardado correctamente."); 
      }
      onSuccess(); 
      onClose();   
    } catch (err) { 
      toast.error(err.response?.data?.message || "Error al guardar el registro."); 
    } finally { 
      setCargando(false); 
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl bg-surface p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-main">
            {registroAEditar ? 'Editar Registro' : 'Crear Nuevo Registro'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-main/50 transition hover:bg-canvas hover:text-main">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-main/80 mb-2">Fecha:</label>
            <input type="date" required max={new Date().toISOString().split('T')[0]} value={fecha} onChange={(e) => setFecha(e.target.value)} 
                   className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-canvas text-main p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-main/80">Puntuación Global:</label>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-black transition-colors ${colorPuntuacion(puntuacionGlobal)}`}>
                {puntuacionGlobal}
              </div>
            </div>
            <input type="range" min="1" max="10" value={puntuacionGlobal} onChange={(e) => setPuntuacionGlobal(parseInt(e.target.value))} 
                   className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 accent-primary outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-main/80 mb-3">Etiquetas (opcional):</label>
            <div className="flex flex-wrap items-center gap-2">
              {etiquetasCatalogo.length === 0 && !creandoEtiqueta && (
                <span className="text-sm italic text-main/50">Aún no tienes etiquetas.</span>
              )}
              {etiquetasCatalogo.map(tag => {
                const seleccionada = etiquetasSeleccionadas.find(e => e.etiquetaId === tag.id);
                return (
                  <div key={tag.id} className="flex flex-col items-center">
                    <button type="button" onClick={() => toggleEtiqueta(tag.id)} 
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${seleccionada ? 'border-primary bg-primary text-white shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-canvas text-main/70 hover:text-main hover:border-gray-300 dark:hover:border-gray-600'}`}>
                      {tag.nombre}
                    </button>
                    {seleccionada && (
                      <input type="number" min="1" max="10" placeholder="Nota" value={seleccionada.puntuacion || ''} onChange={(e) => setPuntuacionEtiqueta(tag.id, e.target.value)} 
                             className="mt-1 w-14 rounded-md border border-gray-200 dark:border-gray-700 bg-surface p-1 text-center text-xs text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    )}
                  </div>
                );
              })}

              {!creandoEtiqueta ? (
                <button type="button" onClick={() => setCreandoEtiqueta(true)} className="flex items-center space-x-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 bg-surface px-3 py-1.5 text-sm font-medium text-main/50 hover:border-primary hover:text-primary transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  <span>Nueva</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1 rounded-full border border-primary/30 bg-primary/10 p-1">
                  <input type="text" placeholder="Ej. Deporte" autoFocus value={nuevaEtiquetaNombre} onChange={(e) => setNuevaEtiquetaNombre(e.target.value)} 
                         className="w-24 rounded-full border-none bg-transparent px-2 py-1 text-sm text-primary placeholder-primary/50 focus:ring-0 outline-none" />
                  <button type="button" onClick={handleCrearEtiqueta} className="rounded-full bg-primary p-1.5 text-white hover:opacity-80 transition-opacity">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <button type="button" onClick={() => setCreandoEtiqueta(false)} className="rounded-full p-1.5 text-primary/70 hover:bg-primary/20 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-main/80 mb-2">Comentario (opcional):</label>
            <textarea rows="3" placeholder="¿Cómo te has sentido hoy?" value={comentario} onChange={(e) => setComentario(e.target.value)} 
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-canvas p-3 text-sm text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={cargando} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50">
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}