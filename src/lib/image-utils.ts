// Utilidades para optimización de imágenes desde Supabase Storage

/**
 * Genera una URL optimizada para imágenes de Supabase Storage
 * @param imageUrl - URL original de la imagen
 * @param options - Opciones de transformación
 * @returns URL optimizada con transformaciones
 */
export function getOptimizedImageUrl(
  imageUrl: string | undefined | null,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
    resize?: 'cover' | 'contain' | 'fill'
  } = {}
): string | undefined {
  if (!imageUrl) return undefined

  // Si la URL no es de Supabase, retornar sin modificar
  if (!imageUrl.includes('supabase.co/storage')) {
    return imageUrl
  }

  try {
    let cleanUrl = imageUrl

    // Si es una URL firmada (/sign/), extraer la ruta del objeto
    if (imageUrl.includes('/storage/v1/object/sign/')) {
      const match = imageUrl.match(/\/storage\/v1\/object\/sign\/([^?]+)/)
      if (match) {
        const objectPath = match[1]
        // Reconstruir como URL pública (Next.js hará la optimización)
        const baseUrl = imageUrl.split('/storage/')[0]
        cleanUrl = `${baseUrl}/storage/v1/object/public/${objectPath}`
      }
    }

    // Retornar URL pública limpia - Next.js Image component hará la optimización
    return cleanUrl
  } catch (error) {
    console.error('Error processing image URL:', error)
    return imageUrl
  }
}

/**
 * Genera un placeholder blur para mejor UX durante la carga
 */
export const BLUR_DATA_URL = 
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
