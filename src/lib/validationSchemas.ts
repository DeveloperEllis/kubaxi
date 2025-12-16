import { z } from 'zod';

/**
 * Schema de validación para formulario de viaje simple
 */
export const tripRequestSchema = z.object({
  origen: z.object({
    id: z.number().positive('ID de origen requerido'),
    nombre: z.string().min(1, 'Nombre de origen requerido'),
  }).optional(),
  
  destino: z.object({
    id: z.number().positive('ID de destino requerido'),
    nombre: z.string().min(1, 'Nombre de destino requerido'),
  }).optional(),
  
  taxiType: z.enum(['colectivo', 'privado']),
  
  cantidadPersonas: z.number()
    .int('Cantidad debe ser número entero')
    .min(1, 'Debe haber al menos 1 persona')
    .max(8, 'Máximo 8 personas permitidas'),
  
  tripDate: z.string()
    .min(1, 'Fecha de viaje requerida')
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      { message: 'La fecha no puede ser anterior a hoy' }
    ),
  
  tripTime: z.string().optional(),
  
  horarioColectivo: z.enum(['mañana', 'tarde']).optional(),
}).refine(
  (data) => {
    // Validar que origen y destino existan
    if (!data.origen || !data.destino) {
      return false;
    }
    return true;
  },
  {
    message: 'Debes seleccionar origen y destino',
    path: ['origen'],
  }
).refine(
  (data) => {
    // Si es colectivo, horarioColectivo es requerido
    if (data.taxiType === 'colectivo') {
      return data.horarioColectivo !== undefined;
    }
    return true;
  },
  {
    message: 'Debes seleccionar un horario para viaje colectivo',
    path: ['horarioColectivo'],
  }
).refine(
  (data) => {
    // Si es privado, tripTime es requerido
    if (data.taxiType === 'privado') {
      return data.tripTime && data.tripTime.length > 0;
    }
    return true;
  },
  {
    message: 'Debes seleccionar una hora para viaje privado',
    path: ['tripTime'],
  }
).refine(
  (data) => {
    // Origen y destino no pueden ser iguales
    if (data.origen && data.destino) {
      return data.origen.id !== data.destino.id;
    }
    return true;
  },
  {
    message: 'El origen y destino no pueden ser iguales',
    path: ['destino'],
  }
);

export type TripRequestFormData = z.infer<typeof tripRequestSchema>;

/**
 * Schema de validación para alojamiento en circuito
 */
export const alojamientoSchema = z.object({
  habitaciones: z.number()
    .int('Número de habitaciones debe ser entero')
    .min(1, 'Mínimo 1 habitación')
    .max(10, 'Máximo 10 habitaciones'),
  
  noches: z.number()
    .int('Número de noches debe ser entero')
    .min(1, 'Mínimo 1 noche')
    .max(30, 'Máximo 30 noches'),
}).optional();

/**
 * Schema de validación para ciudad en circuito
 */
export const ciudadCircuitoSchema = z.object({
  ciudadId: z.number().positive('ID de ciudad requerido'),
  alojamiento: alojamientoSchema,
});

/**
 * Schema de validación para formulario de circuito personalizado
 */
export const circuitoPersonalizadoSchema = z.object({
  origen: z.object({
    id: z.number().positive('ID de origen requerido'),
    nombre: z.string().min(1, 'Nombre de origen requerido'),
  }).optional(),
  
  ciudadesSeleccionadas: z.array(ciudadCircuitoSchema)
    .min(1, 'Debes seleccionar al menos 1 ciudad de destino')
    .max(10, 'Máximo 10 ciudades en el circuito'),
  
  cantidadPersonas: z.number()
    .int('Cantidad debe ser número entero')
    .min(1, 'Debe haber al menos 1 persona')
    .max(8, 'Máximo 8 personas permitidas'),
  
  tipoVehiculo: z.enum(['clasico', 'moderno', 'van']),
  
  fechaInicio: z.string()
    .min(1, 'Fecha de inicio requerida')
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      { message: 'La fecha de inicio no puede ser anterior a hoy' }
    ),
  
  fechaFinal: z.string().optional(),
}).refine(
  (data) => {
    // Si hay fecha final, debe ser posterior a fecha inicio
    if (data.fechaFinal) {
      return new Date(data.fechaFinal) > new Date(data.fechaInicio);
    }
    return true;
  },
  {
    message: 'La fecha final debe ser posterior a la fecha de inicio',
    path: ['fechaFinal'],
  }
).refine(
  (data) => {
    // Si hay más de 4 personas, vehículo debe ser van
    return data.cantidadPersonas <= 4 || data.tipoVehiculo === 'van';
  },
  {
    message: 'Para más de 4 personas debes seleccionar vehículo tipo Van',
    path: ['tipoVehiculo'],
  }
);

export type CircuitoPersonalizadoFormData = z.infer<typeof circuitoPersonalizadoSchema>;

/**
 * Schema de validación para formulario de otros servicios
 */
export const otrosServiciosSchema = z.object({
  servicio: z.enum(['alojamiento', 'guia', 'clases_baile', 'excursion_caballo']),
  
  cantidadPersonas: z.number()
    .int('Cantidad debe ser número entero')
    .min(1, 'Debe haber al menos 1 persona')
    .max(20, 'Máximo 20 personas'),
  
  fechaInicio: z.string()
    .min(1, 'Fecha de inicio requerida')
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      { message: 'La fecha no puede ser anterior a hoy' }
    ),
  
  noches: z.number().int().min(1).max(30).optional(),
  ubicacion: z.string().min(1).optional(),
});

export type OtrosServiciosFormData = z.infer<typeof otrosServiciosSchema>;
