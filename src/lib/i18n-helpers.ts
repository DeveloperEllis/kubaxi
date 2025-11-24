import { useLocale } from 'next-intl'

/**
 * Hook para obtener el campo traducido de un objeto según el idioma actual
 * 
 * @example
 * const t = useTranslatedField()
 * const excursion = { titulo_es: 'Tour La Habana', titulo_en: 'Havana Tour', titulo_fr: 'Visite de La Havane' }
 * const translatedName = t(excursion, 'titulo') // Retorna el titulo en el idioma actual
 */
export function useTranslatedField() {
  const locale = useLocale()

  return function<T extends Record<string, any>>(
    obj: T,
    fieldName: string
  ): string {
    // Siempre buscar el campo con sufijo _locale
    const translatedField = `${fieldName}_${locale}`
    
    // Si existe el campo traducido, usarlo
    if (obj[translatedField]) {
      return obj[translatedField]
    }
    
    // Fallback: intentar con español, luego el campo base
    return obj[`${fieldName}_es`] || obj[fieldName] || ''
  }
}

/**
 * Función helper para traducir campos sin hook (para usar en server components)
 */
export function getTranslatedField<T extends Record<string, any>>(
  obj: T,
  fieldName: string,
  locale: string
): string {
  // Siempre buscar el campo con sufijo _locale
  const translatedField = `${fieldName}_${locale}`
  
  // Si existe el campo traducido, usarlo
  if (obj[translatedField]) {
    return obj[translatedField]
  }
  
  // Fallback: intentar con español, luego el campo base
  return obj[`${fieldName}_es`] || obj[fieldName] || ''
}

/**
 * Función para traducir arrays de items (como "incluye" en paquetes)
 * 
 * @example
 * const incluye = ['Transporte', 'Guía turístico', 'Almuerzo']
 * const translations = {
 *   'Transporte': { en: 'Transportation', fr: 'Transport' },
 *   'Guía turístico': { en: 'Tour Guide', fr: 'Guide touristique' }
 * }
 * translateArray(incluye, translations, 'en') // ['Transportation', 'Tour Guide', 'Lunch']
 */
export function translateArray(
  items: string[],
  translations: Record<string, Record<string, string>>,
  locale: string
): string[] {
  if (locale === 'es') return items

  return items.map(item => {
    const translation = translations[item]
    return translation?.[locale] || item
  })
}
