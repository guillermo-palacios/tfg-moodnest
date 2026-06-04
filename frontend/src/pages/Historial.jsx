import { useState, useEffect } from 'react';
import api from '../services/api';
import RegistroModal from '../components/RegistroModal';

export default function Historial() {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [registros, setRegistros] = useState([]);
    const [etiquetasCatalogo, setEtiquetasCatalogo] = useState([]); // NUEVO: Para saber los nombres
    const [cargando, setCargando] = useState(false);
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cargar catálogo de etiquetas solo la primera vez que entramos
    useEffect(() => {
        const cargarEtiquetas = async () => {
            try {
                const res = await api.get('/etiquetas');
                setEtiquetasCatalogo(res.data || []);
            } catch (error) {
                console.error("Error al cargar etiquetas:", error);
            }
        };
        cargarEtiquetas();
    }, []);

    const cargarRegistrosMes = async () => {
        setCargando(true);
        try {
            const año = fechaActual.getFullYear();
            const mes = fechaActual.getMonth();

            const primerDia = new Date(año, mes, 1).toISOString().split('T')[0] + "T00:00:00";
            const ultimoDia = new Date(año, mes + 1, 0).toISOString().split('T')[0] + "T23:59:59";

            const res = await api.get(`/registros?inicio=${primerDia}&fin=${ultimoDia}`);
            setRegistros(res.data || []);
            setRegistroSeleccionado(null);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setCargando(false);
        }
    };

    const eliminarRegistro = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este registro permanentemente?")) {
            try {
                await api.delete(`/registros/${id}`);
                setRegistroSeleccionado(null); // Limpiamos la selección
                cargarRegistrosMes(); // Recargamos el calendario
            } catch (error) {
                alert("Error al eliminar el registro.");
            }
        }
    };

    useEffect(() => {
        cargarRegistrosMes();
    }, [fechaActual]);

    const mesAnterior = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    const mesSiguiente = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));

    const obtenerDiasDelMes = () => {
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0);

        let offset = primerDia.getDay() - 1;
        if (offset === -1) offset = 6;

        const dias = [];
        for (let i = 0; i < offset; i++) dias.push(null);
        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            dias.push(new Date(año, mes, i, 12, 0, 0));
        }
        return dias;
    };

    const obtenerRegistroDelDia = (fechaDia) => {
        if (!fechaDia) return null;
        const fechaString = fechaDia.toISOString().split('T')[0];
        return registros.find(r => r.fechaAsignada.startsWith(fechaString));
    };

    // Colores de fondo (para los círculos)
    const colorPuntuacion = (nota) => {
        if (nota >= 9) return 'bg-indigo-500 text-white shadow-md border-transparent';
        if (nota >= 7) return 'bg-green-500 text-white shadow-md border-transparent';
        if (nota >= 5) return 'bg-yellow-400 text-white shadow-md border-transparent';
        if (nota >= 3) return 'bg-orange-500 text-white shadow-md border-transparent';
        return 'bg-red-500 text-white shadow-md border-transparent';
    };

    // NUEVO: Colores de borde (para el panel de detalles)
    const borderColorPuntuacion = (nota) => {
        if (nota >= 9) return 'border-indigo-500';
        if (nota >= 7) return 'border-green-500';
        if (nota >= 5) return 'border-yellow-400';
        if (nota >= 3) return 'border-orange-500';
        return 'border-red-500';
    };

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
    const diasCuadricula = obtenerDiasDelMes();

    return (
        <div className="mx-auto max-w-6xl space-y-6">

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">Tu Historial</h1>
                <p className="text-gray-600 mt-2">Navega por los meses y selecciona un día para ver tus notas.</p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">

                {/* COLUMNA IZQUIERDA: EL CALENDARIO */}
                <div className="flex-1 overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">

                    {/* Cabecera del Calendario (Ahora morada como tu Wireframe) */}
                    <div className="flex items-center justify-between bg-indigo-600 px-6 py-4 text-white lg:px-8">
                        <button onClick={mesAnterior} className="rounded-full p-2 text-indigo-100 transition hover:bg-indigo-700 hover:text-white">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-2xl font-bold capitalize tracking-wide">
                            {nombresMeses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                        </h2>
                        <button onClick={mesSiguiente} className="rounded-full p-2 text-indigo-100 transition hover:bg-indigo-700 hover:text-white">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="p-6 lg:p-8">
                        {/* Días de la semana */}
                        <div className="mb-4 grid grid-cols-7 text-center text-sm font-black text-gray-400">
                            {diasSemana.map(dia => <div key={dia}>{dia}</div>)}
                        </div>

                        {/* Cuadrícula de días */}
                        {cargando ? (
                            <div className="flex h-64 items-center justify-center text-indigo-500">
                                <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-y-4 sm:gap-y-6">
                                {diasCuadricula.map((dia, index) => {
                                    if (!dia) return <div key={index} className="h-10 w-10 sm:h-12 sm:w-12"></div>;

                                    const registro = obtenerRegistroDelDia(dia);
                                    const esHoy = dia.toDateString() === new Date().toDateString();
                                    const estaSeleccionado = registroSeleccionado?.id === registro?.id && registro !== null;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setRegistroSeleccionado(registro || 'vacio')}
                                            className={`mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 
                        ${registro ? colorPuntuacion(registro.puntuacionGlobal) : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}
                        ${esHoy && !registro ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                        ${estaSeleccionado ? 'ring-4 ring-gray-900 ring-offset-2' : ''}
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
                    {registroSeleccionado === null ? (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="font-medium text-gray-500">Toca un día en el calendario para ver los detalles.</p>
                        </div>
                    ) : registroSeleccionado === 'vacio' ? (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-center">
                            <p className="font-medium text-gray-600">No hay ningún registro guardado en este día.</p>
                        </div>
                    ) : (
                        // NUEVO: Aquí aplicamos el borde dinámico de 4px (border-4)
                        <div className={`flex h-full flex-col rounded-3xl bg-white p-6 shadow-md border-4 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-300 ${borderColorPuntuacion(registroSeleccionado.puntuacionGlobal)}`}>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha:</span>
                            <h3 className="text-xl font-bold text-gray-800">
                                {new Date(registroSeleccionado.fechaAsignada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </h3>

                            <div className="mt-6 flex items-center space-x-3">
                                <span className="text-base font-semibold text-gray-700">Puntuación Global:</span>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black ${colorPuntuacion(registroSeleccionado.puntuacionGlobal)}`}>
                                    {registroSeleccionado.puntuacionGlobal}
                                </div>
                            </div>

                            {registroSeleccionado.comentario && (
                                <div className="mt-6">
                                    <span className="text-sm font-semibold text-gray-700">Comentario:</span>
                                    <p className="mt-1 text-gray-600 italic">"{registroSeleccionado.comentario}"</p>
                                </div>
                            )}

                            {registroSeleccionado.etiquetasAsociadas?.length > 0 && (
                                <div className="mt-6">
                                    <span className="mb-3 block text-sm font-semibold text-gray-700">Etiquetas de hoy:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {registroSeleccionado.etiquetasAsociadas.map((eti, i) => {
                                            // Buscamos la info de la etiqueta
                                            const tagInfo = etiquetasCatalogo.find(e => e.id === eti.idEtiqueta);
                                            const nombreTag = tagInfo ? tagInfo.nombre : 'Desconocida';
                                            // Si la etiqueta tiene color propio lo usamos, si no, usamos un morado por defecto
                                            const colorTag = tagInfo && tagInfo.color ? tagInfo.color : '#818cf8';

                                            return (
                                                <span
                                                    key={i}
                                                    className="flex items-center rounded-full border-2 bg-white py-1 pl-3 pr-1 text-sm font-semibold text-gray-700 shadow-sm"
                                                    style={{ borderColor: colorTag }} // Aplicamos el color al borde
                                                >
                                                    <span className={eti.puntuacion ? "mr-2" : "pr-2"}>{nombreTag}</span>

                                                    {/* El circulito con la nota */}
                                                    {eti.puntuacion && (
                                                        <span
                                                            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                                                            style={{ backgroundColor: colorTag }} // Aplicamos el color al fondo del círculo
                                                        >
                                                            {eti.puntuacion}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Botones de Acción (CRUD) */}
                            <div className="mt-auto pt-8 flex flex-col space-y-3">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition hover:bg-indigo-700"
                                >
                                    Editar Registro
                                </button>
                                <button
                                    onClick={() => eliminarRegistro(registroSeleccionado.id)}
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
                onSuccess={() => { cargarRegistrosMes(); setRegistroSeleccionado(null); }}
                registrosPrevios={registros}
                registroAEditar={registroSeleccionado} // <--- Le pasamos el registro seleccionado
            />
        </div>
    );
}