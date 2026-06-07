import { useState, useEffect } from 'react';
import api from '../services/api';
import RegistroModal from '../components/RegistroModal';
import toast from 'react-hot-toast';

/**
 * Componente Historial: Visualizador mensual de registros mediante calendario interactivo.
 * Permite navegar cronológicamente, visualizar detalles por día y gestionar el borrado/edición de los registros.
 */
export default function Historial() {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [registros, setRegistros] = useState([]);
    const [etiquetasCatalogo, setEtiquetasCatalogo] = useState([]); 
    const [cargando, setCargando] = useState(false);
    
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    /**
     * Carga el catálogo completo de etiquetas (incluyendo las inactivas).
     * Necesario para que el Historial pueda mostrar el nombre de etiquetas aunque hayan sido borradas lógicamente.
     */
    useEffect(() => {
        const cargarEtiquetas = async () => {
            try {
                const res = await api.get('/etiquetas/todas');
                setEtiquetasCatalogo(res.data || []);
            } catch (error) {
                console.error("Error al cargar etiquetas:", error);
            }
        };
        cargarEtiquetas();
    }, []);

    /**
     * Recupera los registros del mes seleccionado utilizando un rango de fechas ISO.
     * Calcula dinámicamente el primer y último día del mes activo.
     */
    const cargarRegistrosMes = async () => {
        setCargando(true);
        try {
            const año = fechaActual.getFullYear();
            const mes = fechaActual.getMonth(); 

            const pad = (num) => String(num).padStart(2, '0');
            const mesStr = pad(mes + 1);
            const ultimoDiaNum = new Date(año, mes + 1, 0).getDate(); 

            const primerDia = `${año}-${mesStr}-01T00:00:00`;
            const ultimoDia = `${año}-${mesStr}-${pad(ultimoDiaNum)}T23:59:59`;

            const res = await api.get(`/registros?inicio=${primerDia}&fin=${ultimoDia}`);
            setRegistros(res.data || []);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setCargando(false);
        }
    };

    /**
     * Elimina permanentemente un registro diario.
     * @param {string} id - Identificador único del registro a borrar.
     */
    const eliminarRegistro = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este registro permanentemente?")) {
            try {
                await api.delete(`/registros/${id}`);
                cargarRegistrosMes(); 
                toast.success("Registro eliminado correctamente."); // CU7: Confirmación de borrado
            } catch (error) {
                toast.error("Error al eliminar el registro.");
            }
        }
    };

    useEffect(() => {
        cargarRegistrosMes();
        setDiaSeleccionado(null);
    }, [fechaActual]);

    // Funciones de navegación temporal
    const mesAnterior = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    const mesSiguiente = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));

    /**
     * Algoritmo de generación de cuadrícula:
     * Calcula los días vacíos previos al primer lunes del mes (offset) y llena el resto.
     * @returns {Array} Array de objetos Date o null para los espacios vacíos.
     */
    const obtenerDiasDelMes = () => {
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0);

        // Ajuste de offset: JS .getDay() empieza en domingo (0), nosotros queremos lunes (1)
        let offset = primerDia.getDay() - 1;
        if (offset === -1) offset = 6;

        const dias = [];
        for (let i = 0; i < offset; i++) dias.push(null);
        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            dias.push(new Date(año, mes, i, 12, 0, 0));
        }
        return dias;
    };

    /**
     * Helper para vincular el registro de la API con un día específico de la cuadrícula.
     */
    const obtenerRegistroDelDia = (fechaDia) => {
        if (!fechaDia) return null;
        const year = fechaDia.getFullYear();
        const month = String(fechaDia.getMonth() + 1).padStart(2, '0');
        const day = String(fechaDia.getDate()).padStart(2, '0');
        const fechaString = `${year}-${month}-${day}`;
        return registros.find(r => r.fechaAsignada.startsWith(fechaString));
    };

    // Estilos dinámicos para el calendario
    const colorPuntuacion = (nota) => {
        if (nota >= 9) return 'bg-mood-9 text-white border-transparent shadow-md';
        if (nota >= 7) return 'bg-mood-7 text-white border-transparent shadow-md';
        if (nota >= 5) return 'bg-mood-5 text-white border-transparent shadow-md';
        if (nota >= 3) return 'bg-mood-3 text-white border-transparent shadow-md';
        return 'bg-mood-1 text-white border-transparent shadow-md';
    };

    const borderColorPuntuacion = (nota) => {
        if (nota >= 9) return 'border-mood-9';
        if (nota >= 7) return 'border-mood-7';
        if (nota >= 5) return 'border-mood-5';
        if (nota >= 3) return 'border-mood-3';
        return 'border-mood-1';
    };

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
    const diasCuadricula = obtenerDiasDelMes();

    const registroActual = diaSeleccionado ? obtenerRegistroDelDia(diaSeleccionado) : null;

    return (
        <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-main">Tu Historial</h1>
                <p className="text-main/70 mt-2">Navega por los meses y selecciona un día para ver tus notas.</p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">

                {/* COLUMNA IZQUIERDA: EL CALENDARIO */}
                <div className="flex-1 overflow-hidden rounded-3xl bg-surface shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
                    <div className="flex items-center justify-between bg-primary px-6 py-4 text-white lg:px-8 transition-colors duration-300">
                        <button onClick={mesAnterior} className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-2xl font-bold capitalize tracking-wide">
                            {nombresMeses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                        </h2>
                        <button onClick={mesSiguiente} className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="p-6 lg:p-8">
                        <div className="mb-4 grid grid-cols-7 text-center text-sm font-black text-main/40">
                            {diasSemana.map(dia => <div key={dia}>{dia}</div>)}
                        </div>

                        {cargando ? (
                            <div className="flex h-64 items-center justify-center text-primary">
                                <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-y-4 sm:gap-y-6">
                                {diasCuadricula.map((dia, index) => {
                                    if (!dia) return <div key={index} className="h-10 w-10 sm:h-12 sm:w-12"></div>;

                                    const registro = obtenerRegistroDelDia(dia);
                                    const esHoy = dia.toDateString() === new Date().toDateString();
                                    const estaSeleccionado = diaSeleccionado && dia.toDateString() === diaSeleccionado.toDateString();

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setDiaSeleccionado(dia)}
                                            className={`mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 
                                                ${registro ? colorPuntuacion(registro.puntuacionGlobal) : 'bg-canvas text-main/70 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800'}
                                                ${esHoy && !registro ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface' : ''}
                                                ${estaSeleccionado ? 'ring-4 ring-main ring-offset-2 dark:ring-offset-surface' : ''}
                                            `}
                                        >
                                            {dia.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: DETALLE DEL DÍA */}
                <div className="flex w-full flex-col lg:w-1/3">
                    {!diaSeleccionado ? (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-canvas p-6 text-center">
                            <svg className="mb-4 h-12 w-12 text-main/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="font-medium text-main/50">Toca un día en el calendario para ver los detalles.</p>
                        </div>
                    ) : !registroActual ? (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl bg-surface p-6 shadow-sm border border-gray-200 dark:border-gray-800 text-center transition-colors animate-in fade-in zoom-in-95 duration-300">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                            </div>
                            <h3 className="mb-1 text-lg font-bold text-main">Día sin registrar</h3>
                            <p className="mb-6 font-medium text-main/50">
                                {diaSeleccionado.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md transition hover:opacity-90 hover:-translate-y-1"
                            >
                                Añadir Registro
                            </button>
                        </div>
                    ) : (
                        <div className={`flex h-full flex-col rounded-3xl bg-surface p-6 shadow-md border-4 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-300 transition-colors ${borderColorPuntuacion(registroActual.puntuacionGlobal)}`}>
                            <span className="text-sm font-semibold text-main/50 uppercase tracking-wider">Fecha:</span>
                            <h3 className="text-xl font-bold text-main">
                                {new Date(registroActual.fechaAsignada).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </h3>

                            <div className="mt-6 flex items-center space-x-3">
                                <span className="text-base font-semibold text-main/80">Puntuación Global:</span>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black ${colorPuntuacion(registroActual.puntuacionGlobal)}`}>
                                    {registroActual.puntuacionGlobal}
                                </div>
                            </div>

                            {registroActual.comentario && (
                                <div className="mt-6">
                                    <span className="text-sm font-semibold text-main/80">Comentario:</span>
                                    <p className="mt-1 text-main/70 italic">"{registroActual.comentario}"</p>
                                </div>
                            )}

                            {registroActual.etiquetasAsociadas?.length > 0 && (
                                <div className="mt-6">
                                    <span className="mb-3 block text-sm font-semibold text-main/80">Etiquetas de hoy:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {registroActual.etiquetasAsociadas.map((eti, i) => {
                                            const tagInfo = etiquetasCatalogo.find(e => e.id === eti.idEtiqueta);
                                            const nombreTag = tagInfo ? tagInfo.nombre : 'Desconocida';
                                            const colorTag = tagInfo && tagInfo.color ? tagInfo.color : 'rgb(var(--color-primary))';

                                            return (
                                                <span key={i} className="flex items-center rounded-full border-2 bg-surface py-1 pl-3 pr-1 text-sm font-semibold text-main shadow-sm transition-colors" style={{ borderColor: colorTag }}>
                                                    <span className={eti.puntuacion ? "mr-2" : "pr-2"}>{nombreTag}</span>
                                                    {eti.puntuacion && (
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colorTag }}>
                                                            {eti.puntuacion}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-8 flex flex-col space-y-3">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md transition hover:opacity-90"
                                >
                                    Editar Registro
                                </button>
                                <button
                                    onClick={() => eliminarRegistro(registroActual.id)}
                                    className="w-full py-2 text-sm font-semibold text-red-500 hover:text-red-700 transition"
                                >
                                    Eliminar permanentemente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <RegistroModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { cargarRegistrosMes(); }}
                registrosPrevios={registros}
                registroAEditar={registroActual} 
                fechaPorDefecto={diaSeleccionado} 
            />
        </div>
    );
}