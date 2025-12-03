"use client";

import { useState, useEffect, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { getUbicaciones, calculatePrice } from "@/lib/services";
import { abrirWhatsApp } from "@/lib/whatsapp";
import type { Ubicacion } from "@/types";

interface CiudadCircuito {
  ciudadId: number;
  alojamiento?: {
    habitaciones: number;
    noches: number;
  };
}

export default function CircuitoPersonalizadoSection() {
  const t = useTranslations("customCircuit");
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>(
    []
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroOrigen, setFiltroOrigen] = useState<string>("todo");
  const [filtroDestinos, setFiltroDestinos] = useState<string>("todo");
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [tipoVehiculo, setTipoVehiculo] = useState<
    "clasico" | "moderno" | "van" | ""
  >("");
  const [origenId, setOrigenId] = useState<number | null>(null);
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<
    CiudadCircuito[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [precioTransporte, setPrecioTransporte] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [busquedaCiudad, setBusquedaCiudad] = useState("");
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [ciudadesFiltradas, setCiudadesFiltradas] = useState<Ubicacion[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  useEffect(() => {
    aplicarFiltro();
  }, [ubicaciones, filtroOrigen, filtroDestinos]);

  useEffect(() => {
    calcularRuta();
  }, [ciudadesSeleccionadas, cantidadPersonas, origenId]);

  // Actualizar ciudades filtradas cuando cambia el filtro o la búsqueda
  useEffect(() => {
    let resultado = ubicaciones;

    // Si estamos buscando destinos (origenId existe), excluir el origen
    if (origenId) {
      resultado = resultado.filter((u) => u.id !== origenId);
    } else {
      // Si estamos buscando origen, excluir destinos ya seleccionados
      if (ciudadesSeleccionadas.length > 0) {
        const destinosIds = ciudadesSeleccionadas.map((c) => c.ciudadId);
        resultado = resultado.filter((u) => !destinosIds.includes(u.id));
      }
    }

    // Solo aplicar filtros si la opción de mostrar filtros está activada
    if (mostrarFiltros) {
      // Aplicar filtro según si estamos buscando origen o destinos
      const filtroActivo = origenId ? filtroDestinos : filtroOrigen;

      if (filtroActivo !== "todo") {
        const tipoFiltro =
          filtroActivo === "turistico" ? "municipio turistico" : filtroActivo;
        resultado = resultado.filter(
          (u) => u.tipo?.toLowerCase() === tipoFiltro.toLowerCase()
        );
      }
    }

    if (busquedaCiudad.trim()) {
      const searchLower = busquedaCiudad.toLowerCase();
      resultado = resultado.filter(
        (u) =>
          u.nombre.toLowerCase().includes(searchLower) ||
          u.provincia?.toLowerCase().includes(searchLower)
      );
    }

    setCiudadesFiltradas(resultado);
  }, [
    ubicaciones,
    busquedaCiudad,
    filtroOrigen,
    filtroDestinos,
    origenId,
    mostrarFiltros,
    ciudadesSeleccionadas,
  ]);

  const cargarUbicaciones = async () => {
    try {
      setLoading(true);
      const data = await getUbicaciones();
      setUbicaciones(data);
      setUbicacionesFiltradas(data);
    } catch (error) {
      console.error("Error cargando ubicaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = () => {
    // Los filtros se aplicarán dinámicamente en el useEffect de ciudadesFiltradas
    setUbicacionesFiltradas(ubicaciones);
  };

  const calcularRuta = async () => {
    if (!origenId || ciudadesSeleccionadas.length < 1) {
      setPrecioTransporte(0);
      setDistanciaTotal(0);
      return;
    }

    try {
      setCalculando(true);
      let precioTotal = 0;
      let distanciaTotal = 0;

      // Calcular desde origen al primer destino
      const primerDestino = ciudadesSeleccionadas[0].ciudadId;
      let resultado = await calculatePrice(
        origenId,
        primerDestino,
        "privado",
        cantidadPersonas
      );
      precioTotal += resultado.price;
      distanciaTotal += resultado.distance_km;

      // Calcular entre destinos
      for (let i = 0; i < ciudadesSeleccionadas.length - 1; i++) {
        const origen = ciudadesSeleccionadas[i].ciudadId;
        const destino = ciudadesSeleccionadas[i + 1].ciudadId;

        resultado = await calculatePrice(
          origen,
          destino,
          "privado",
          cantidadPersonas
        );
        precioTotal += resultado.price;
        distanciaTotal += resultado.distance_km;
      }

      setPrecioTransporte(Math.round(precioTotal));
      setDistanciaTotal(Math.round(distanciaTotal * 10) / 10);
    } catch (error) {
      console.error("Error calculando ruta:", error);
      setPrecioTransporte(0);
      setDistanciaTotal(0);
    } finally {
      setCalculando(false);
    }
  };

  const agregarCiudad = (ciudadId: number) => {
    setCiudadesSeleccionadas((prev) => [...prev, { ciudadId }]);
  };

  const eliminarCiudad = (index: number) => {
    setCiudadesSeleccionadas((prev) => prev.filter((_, i) => i !== index));
  };

  const moverCiudad = (index: number, direccion: "arriba" | "abajo") => {
    const nuevasCiudades = [...ciudadesSeleccionadas];
    if (direccion === "arriba" && index > 0) {
      [nuevasCiudades[index], nuevasCiudades[index - 1]] = [
        nuevasCiudades[index - 1],
        nuevasCiudades[index],
      ];
    } else if (
      direccion === "abajo" &&
      index < ciudadesSeleccionadas.length - 1
    ) {
      [nuevasCiudades[index], nuevasCiudades[index + 1]] = [
        nuevasCiudades[index + 1],
        nuevasCiudades[index],
      ];
    }
    setCiudadesSeleccionadas(nuevasCiudades);
  };

  const toggleAlojamiento = (index: number) => {
    setCiudadesSeleccionadas((prev) =>
      prev.map((ciudad, i) => {
        if (i === index) {
          if (ciudad.alojamiento) {
            const { alojamiento, ...rest } = ciudad;
            return rest;
          } else {
            return { ...ciudad, alojamiento: { habitaciones: 1, noches: 1 } };
          }
        }
        return ciudad;
      })
    );
  };

  const actualizarAlojamiento = (
    index: number,
    campo: "habitaciones" | "noches",
    valor: number
  ) => {
    setCiudadesSeleccionadas((prev) =>
      prev.map((ciudad, i) => {
        if (i === index && ciudad.alojamiento) {
          return {
            ...ciudad,
            alojamiento: { ...ciudad.alojamiento, [campo]: valor },
          };
        }
        return ciudad;
      })
    );
  };

  const puedeAgregarAlojamiento = (ciudadId: number): boolean => {
    const ubicacion = ubicaciones.find((u) => u.id === ciudadId);
    const tipo = ubicacion?.tipo?.toLowerCase();
    return tipo === "municipio" || tipo === "municipio turistico";
  };

  const calcularPrecioAlojamiento = (): number => {
    return ciudadesSeleccionadas.reduce((total, ciudad) => {
      if (ciudad.alojamiento) {
        return (
          total +
          ciudad.alojamiento.habitaciones * ciudad.alojamiento.noches * 30
        );
      }
      return total;
    }, 0);
  };

  const calcularDiasTotales = (): number => {
    const nochesTotales = ciudadesSeleccionadas.reduce((total, ciudad) => {
      return total + (ciudad.alojamiento?.noches || 0);
    }, 0);
    return nochesTotales + 1;
  };

  const calcularPrecioTotal = (): number => {
    const diasCircuito = calcularDiasTotales();
    return precioTransporte * diasCircuito + calcularPrecioAlojamiento();
  };

  const validarFormulario = (): boolean => {
    setErrorValidacion("");

    // Validar tipo de vehículo
    if (!tipoVehiculo) {
      setErrorValidacion("⚠️ Debes seleccionar un tipo de vehículo");
      return false;
    }

    // Validar fecha de inicio
    if (!fechaInicio) {
      setErrorValidacion("⚠️ Debes seleccionar una fecha de inicio");
      return false;
    }

    // Validar fecha de fin
    if (!fechaFinal) {
      setErrorValidacion("⚠️ Debes seleccionar una fecha de fin");
      return false;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFinal);

    // Validar que fecha de inicio sea mayor a hoy
    if (inicio < hoy) {
      setErrorValidacion("⚠️ La fecha de inicio debe ser mayor a hoy");
      return false;
    }

    // Validar que fecha de fin no sea menor que fecha de inicio
    if (fin <= inicio) {
      setErrorValidacion("⚠️ La fecha de fin no puede ser menor o igual que la fecha de inicio");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const origenNombre =
      ubicaciones.find((u) => u.id === origenId)?.nombre || "";
    const ruta = [
      `🏁 Origen: ${origenNombre}`,
      ...ciudadesSeleccionadas.map((ciudad, index) => {
        const ubicacion = ubicaciones.find((u) => u.id === ciudad.ciudadId);
        let texto = `📍 Destino ${index + 1}: ${ubicacion?.nombre}`;

        if (ciudad.alojamiento) {
          texto += ` (🏨 ${ciudad.alojamiento.noches} ${
            ciudad.alojamiento.noches === 1 ? "noche" : "noches"
          }, ${ciudad.alojamiento.habitaciones} hab)`;
        }

        return texto;
      }),
    ].join("\n");

    const totalNoches = ciudadesSeleccionadas.reduce(
      (total, c) => total + (c.alojamiento?.noches || 0),
      0
    );
    const diasCircuito = calcularDiasTotales();

    abrirWhatsApp({
      tipo: "circuito_personalizado",
      datos: {
        nombre: formData.get("nombre"),
        email: formData.get("email"),
        telefono: formData.get("telefono"),
        fechaInicio: fechaInicio,
        fechaFinal: fechaFinal,
        horaRecogida: formData.get("hora"),
        ruta,
        personas: cantidadPersonas,
        tipoVehiculo:
          tipoVehiculo === "clasico"
            ? "Clásico"
            : tipoVehiculo === "moderno"
            ? "Moderno"
            : tipoVehiculo === "van"
            ? "Van"
            : "No especificado",
        dias: diasCircuito,
        distancia: distanciaTotal,
        precioTransporte: precioTransporte * diasCircuito,
        alojamiento: totalNoches > 0 ? "Sí" : "No",
        detalleAlojamiento:
          totalNoches > 0
            ? `${totalNoches} ${totalNoches === 1 ? "noche" : "noches"}`
            : "No requiere",
        precioAlojamiento: calcularPrecioAlojamiento(),
        precioTotal: calcularPrecioTotal(),
        comentarios: formData.get("comentarios") || "Sin comentarios",
      },
    });

    setShowBookingModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Botón de ayuda en la esquina superior */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
          >
            <span className="text-base">ℹ️</span>
            <span className="font-medium">Ayuda</span>
          </button>
        </div>

        {/* Personas y Tipo de Vehículo - Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="8"
              value={cantidadPersonas || ""}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === "") {
                  setCantidadPersonas(0);
                } else {
                  setCantidadPersonas(parseInt(valor) || 0);
                }
              }}
              onBlur={(e) => {
                if (!e.target.value || parseInt(e.target.value) < 1) {
                  setCantidadPersonas(1);
                }
              }}
              placeholder=" "
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent peer text-sm"
            />
            <label className="absolute left-4 top-2.5 text-slate-500 text-sm transition-all duration-200 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
              👥 {t("passengers")}
            </label>
          </div>
          <div className="relative">
            <select
              value={tipoVehiculo}
              onChange={(e) =>
                setTipoVehiculo(
                  e.target.value as "clasico" | "moderno" | "van" | ""
                )
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="" disabled>
                🚗 {t("vehicleType")}
              </option>
              <option value="clasico">🚗 {t("classic")}</option>
              <option value="moderno">🚙 {t("modern")}</option>
              <option value="van">🚐 {t("van")}</option>
            </select>
          </div>
        </div>

        {/* Fechas de inicio y fin - Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              placeholder=""
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent peer text-sm"
              required
            />
            <label className="absolute left-4 top-2.5 text-slate-500 text-sm transition-all duration-200 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
              📅 {t("startDate")}
            </label>
          </div>
          <div className="relative">
            <input
              type="date"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
              placeholder=""
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent peer text-sm"
              required
            />
            <label className="absolute left-4 top-2.5 text-slate-500 text-sm transition-all duration-200 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
              📅 {t("endDate")}
            </label>
          </div>
        </div>

        {/* Checkbox mostrar filtros */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={mostrarFiltros}
              onChange={(e) => setMostrarFiltros(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span>{t("showFilters")}</span>
          </label>
        </div>

        {/* Filtros de Origen */}
        {mostrarFiltros && !origenId && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              🏁 {t("filterOrigin")}
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroOrigen("todo")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroOrigen === "todo"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t("all")}
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigen("turistico")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroOrigen === "turistico"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t("tourist")}
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigen("cayo")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroOrigen === "cayo"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t("cay")}
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigen("aeropuerto")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroOrigen === "aeropuerto"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t("airport")}
              </button>
            </div>
          </div>
        )}

        {/* Origen */}
        <div className="mb-4 relative">
          <input
            type="text"
            value={
              origenId
                ? ubicaciones.find((u) => u.id === origenId)?.nombre || ""
                : busquedaCiudad
            }
            onChange={(e) => {
              if (!origenId) {
                setBusquedaCiudad(e.target.value);
                setShowCiudadDropdown(true);
              }
            }}
            onFocus={() => !origenId && setShowCiudadDropdown(true)}
            onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
            placeholder={`📍 ${t("originPlaceholder")}`}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            readOnly={!!origenId}
          />
          {origenId && (
            <button
              onClick={() => setOrigenId(null)}
              className="absolute right-3 top-2.5 text-red-600 hover:text-red-800 text-sm"
            >
              ✕
            </button>
          )}
          {!origenId && showCiudadDropdown && ciudadesFiltradas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {ciudadesFiltradas.map((ub) => (
                <button
                  key={ub.id}
                  type="button"
                  onClick={() => {
                    setOrigenId(ub.id);
                    setBusquedaCiudad("");
                    setShowCiudadDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-slate-900">
                    {ub.nombre}
                  </div>
                  <div className="text-xs text-slate-500">{ub.provincia}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtros de Destinos */}
        {mostrarFiltros && origenId && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              📍 {t("filterDestinations")}
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroDestinos("todo")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroDestinos === "todo"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinos("turistico")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroDestinos === "turistico"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Turístico
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinos("cayo")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroDestinos === "cayo"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cayo
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinos("aeropuerto")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filtroDestinos === "aeropuerto"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Aeropuerto
              </button>
            </div>
          </div>
        )}

        {/* Buscador de destinos */}
        <div className="mb-4 relative">
          <input
            type="text"
            value={origenId ? busquedaCiudad : ""}
            onChange={(e) => {
              if (origenId) {
                setBusquedaCiudad(e.target.value);
                setShowCiudadDropdown(true);
              }
            }}
            onFocus={() => origenId && setShowCiudadDropdown(true)}
            onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
            placeholder={
              origenId
                ? `📍 ${t("destinationsPlaceholder")}`
                : `⚠️ ${t("selectOriginFirst")}`
            }
            disabled={!origenId}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          {origenId && showCiudadDropdown && ciudadesFiltradas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {ciudadesFiltradas.map((ub) => (
                <button
                  key={ub.id}
                  type="button"
                  onClick={() => {
                    agregarCiudad(ub.id);
                    setBusquedaCiudad("");
                    setShowCiudadDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-slate-900">
                    {ub.nombre}
                  </div>
                  <div className="text-xs text-slate-500">{ub.provincia}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ruta seleccionada - compacta */}
        {(origenId || ciudadesSeleccionadas.length > 0) && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              {t("yourRoute")}
            </div>

            {/* Origen */}
            {origenId && (
              <div className="bg-green-50 rounded-lg p-2 border border-green-200 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-600">🏁</span>
                  <span className="text-sm font-semibold text-green-800">
                    {ubicaciones.find((u) => u.id === origenId)?.nombre}
                  </span>
                  <span className="text-xs text-green-600 ml-auto">
                    {t("origin")}
                  </span>
                  <button
                    onClick={() => setOrigenId(null)}
                    className="px-1.5 py-0.5 text-red-600 hover:bg-red-50 rounded text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Destinos */}
            <div className="space-y-1.5">
              {ciudadesSeleccionadas.map((ciudad, index) => {
                const ubicacion = ubicaciones.find(
                  (u) => u.id === ciudad.ciudadId
                );
                const puedeAlojarse = puedeAgregarAlojamiento(ciudad.ciudadId);

                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-2 border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-blue-600 flex-shrink-0">
                          📍
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {ubicacion?.nombre}
                        </span>
                        {ciudad.alojamiento && (
                          <span className="text-xs text-indigo-600 flex-shrink-0">
                            🏨 {ciudad.alojamiento.noches}n
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {puedeAlojarse && !ciudad.alojamiento && (
                          <button
                            onClick={() => toggleAlojamiento(index)}
                            className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title={t("accommodation")}
                          >
                            {t("accommodation")}
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            onClick={() => moverCiudad(index, "arriba")}
                            className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 rounded text-xs"
                          >
                            ↑
                          </button>
                        )}
                        {index < ciudadesSeleccionadas.length - 1 && (
                          <button
                            onClick={() => moverCiudad(index, "abajo")}
                            className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 rounded text-xs"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => eliminarCiudad(index)}
                          className="px-1.5 py-0.5 text-red-600 hover:bg-red-50 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Alojamiento inline */}
                    {ciudad.alojamiento && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-600 mb-0.5">
                              {t("rooms")}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={ciudad.alojamiento.habitaciones || ""}
                              onChange={(e) => {
                                const valor = e.target.value;
                                actualizarAlojamiento(
                                  index,
                                  "habitaciones",
                                  valor === "" ? 0 : parseInt(valor) || 0
                                );
                              }}
                              onBlur={(e) => {
                                if (
                                  !e.target.value ||
                                  parseInt(e.target.value) < 1
                                ) {
                                  actualizarAlojamiento(
                                    index,
                                    "habitaciones",
                                    1
                                  );
                                }
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-600 mb-0.5">
                              {t("nights")}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={ciudad.alojamiento.noches || ""}
                              onChange={(e) => {
                                const valor = e.target.value;
                                actualizarAlojamiento(
                                  index,
                                  "noches",
                                  valor === "" ? 0 : parseInt(valor) || 0
                                );
                              }}
                              onBlur={(e) => {
                                if (
                                  !e.target.value ||
                                  parseInt(e.target.value) < 1
                                ) {
                                  actualizarAlojamiento(index, "noches", 1);
                                }
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <button
                            onClick={() => toggleAlojamiento(index)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                            title="Quitar alojamiento"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen compacto */}
        {origenId && ciudadesSeleccionadas.length >= 1 ? (
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 rounded-lg text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">{t("distance")}:</span>
                <span className="font-semibold">
                  {calculando ? "..." : `${distanciaTotal} km`}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">{t("days")}:</span>
                <span className="font-semibold">{calcularDiasTotales()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t("passengers")}:</span>
                <span className="font-semibold">{cantidadPersonas}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between p-2 bg-blue-50 rounded-lg text-xs">
                <span className="text-blue-800">🚕 {t("transport")}</span>
                <span className="font-bold text-blue-900">
                  $
                  {calculando
                    ? "..."
                    : precioTransporte * calcularDiasTotales()}
                </span>
              </div>

              {calcularPrecioAlojamiento() > 0 && (
                <div className="flex justify-between p-2 bg-indigo-50 rounded-lg text-xs">
                  <span className="text-indigo-800">
                    🏨 {t("accommodation")}
                  </span>
                  <span className="font-bold text-indigo-900">
                    ${calcularPrecioAlojamiento()}
                  </span>
                </div>
              )}

              <div className="flex justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
                <span className="font-semibold text-sm">💰 {t("total")}</span>
                <span className="text-lg font-bold">
                  ${calculando ? "..." : calcularPrecioTotal()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (validarFormulario()) {
                  setShowBookingModal(true);
                }
              }}
              disabled={calculando || ciudadesSeleccionadas.length < 2}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculando ? t("calculating") : t("requestCircuit")}
            </button>

            {ciudadesSeleccionadas.length < 2 && (
              <p className="text-xs text-center text-amber-600 font-medium">
                ⚠️ Debes agregar al menos 2 destinos (3 ubicaciones en total)
              </p>
            )}

            {errorValidacion && (
              <p className="text-xs text-center text-red-600 font-medium">
                {errorValidacion}
              </p>
            )}

            <p className="text-xs text-center text-slate-500">
              {t("taxiAvailable")}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-2xl mb-1">📍</p>
            <p className="text-xs">
              {!origenId
                ? t("selectOriginToStart")
                : "Agrega al menos 2 destinos"}
            </p>
          </div>
        )}
      </div>

      {/* Modal de reserva */}
      {showBookingModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBookingModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {t("bookingTitle")}
                  </h3>
                  <p className="text-blue-100 text-sm">{t("completeData")}</p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("name")}
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder={t("namePlaceholder")}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder={t("phonePlaceholder")}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("pickupTime")}
                </label>
                <input
                  type="time"
                  name="hora"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("comments")}
                </label>
                <textarea
                  name="comentarios"
                  rows={3}
                  placeholder={t("commentsPlaceholder")}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💰 Total:{" "}
                  <span className="text-lg font-bold">
                    ${calcularPrecioTotal()}
                  </span>
                </p>
                <p className="text-xs text-blue-700">
                  {calcularDiasTotales()} días •{" "}
                  {ciudadesSeleccionadas.reduce(
                    (t, c) => t + (c.alojamiento?.noches || 0),
                    0
                  )}{" "}
                  noches
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>📱</span>
                {t("sendWhatsApp")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de ayuda */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🗺️</span>
                  <div>
                    <h3 className="text-xl font-bold">
                      ¿Cómo reservar tu circuito?
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Sigue estos simples pasos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Paso 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    📍 Selecciona tu origen
                  </h4>
                  <p className="text-sm text-slate-600">
                    Escoge desde dónde comienza tu viaje
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    🎯 Agrega destinos
                  </h4>
                  <p className="text-sm text-slate-600">
                    Añade todos los lugares que quieras visitar en tu ruta
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    🏨 Añade alojamiento (opcional)
                  </h4>
                  <p className="text-sm text-slate-600">
                    Indica habitaciones y noches en los destinos que necesites
                  </p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    💰 Revisa el presupuesto
                  </h4>
                  <p className="text-sm text-slate-600">
                    Ve el precio calculado con transporte y alojamiento
                  </p>
                </div>
              </div>

              {/* Paso 5 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    📱 Solicita por WhatsApp
                  </h4>
                  <p className="text-sm text-slate-600">
                    Envía tu circuito y coordina los detalles directamente
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-xs text-blue-800">
                    <strong>Consejo:</strong> Puedes reordenar destinos con los
                    botones ↑ ↓ y eliminarlos con ✕
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
