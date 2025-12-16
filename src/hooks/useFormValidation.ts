import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationReturn<T> {
  errors: Record<string, string>;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasErrors: boolean;
}

/**
 * Hook personalizado para validación de formularios con Zod
 * @param schema Schema de Zod para validación
 * @returns Métodos y estado de validación
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T
): UseFormValidationReturn<z.infer<T>> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Valida todos los datos del formulario
   */
  const validate = useCallback((data: z.infer<T>): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema]);

  /**
   * Valida un campo individual
   */
  const validateField = useCallback((field: keyof z.infer<T>, value: any): boolean => {
    try {
      // Validar el campo usando safeParse en el schema parcial
      const fieldSchema = schema.shape?.[field as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Si pasa, limpiar error de este campo
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field as string];
          return updated;
        });
        return true;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field as string]: error.errors[0]?.message || 'Error de validación',
        }));
      }
      return false;
    }
  }, [schema]);

  /**
   * Limpia todos los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Limpia error de un campo específico
   */
  const clearFieldError = useCallback((field: keyof z.infer<T>) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field as string];
      return updated;
    });
  }, []);

  /**
   * Obtiene el error de un campo específico
   */
  const getFieldError = useCallback((field: keyof z.infer<T>): string | undefined => {
    return errors[field as string];
  }, [errors]);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}
