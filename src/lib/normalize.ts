/**
 * Funciones para normalización de texto
 * Maneja: 
 * - Conversión de caracteres acentuados (á → a, é → e, etc.)
 * - Conversión de ñ a n
 * - Espacios a guiones bajos o guiones
 * - Eliminación de caracteres especiales
 * - Manejo de errores
 */

/**
 * Normaliza un valor para usar como identificador de campo
 * Convierte a minúsculas, elimina acentos, convierte espacios a guiones bajos
 * y elimina caracteres especiales
 * 
 * @param value - Texto a normalizar
 * @returns Texto normalizado para identificadores
 */
export function normalizeValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    return value
      .toLowerCase()
      .normalize('NFD') // Descompone caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas
      .replace(/[ñÑ]/g, 'n') // Convierte ñ a n
      .replace(/\s+/g, ' ') // Normaliza espacios múltiples
      .trim() // Elimina espacios al inicio y final
      .replace(/\s/g, '_') // Convierte espacios a guiones bajos
      .replace(/[^a-z0-9_]/g, '_') // Reemplaza caracteres especiales por guiones bajos
      .replace(/_+/g, '_') // Elimina guiones bajos consecutivos
      .replace(/^_+|_+$/g, ''); // Elimina guiones bajos al inicio y final
  } catch (error) {
    console.error('Error normalizando valor:', error);
    return '';
  }
}

/**
 * Crea un slug para URLs a partir de un texto
 * Convierte a minúsculas, elimina acentos, convierte espacios a guiones
 * y elimina caracteres especiales
 * 
 * @param value - Texto a convertir en slug
 * @param maxLength - Longitud máxima del slug (default: 50)
 * @returns Slug para URL
 */
export function createSlug(value: string, maxLength = 50): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const customReplacements: Record<string, string> = {
      '&': 'and',
      '@': 'at',
      '%': 'percent',
      '+': 'plus'
    };

    let normalized = value;
    
    // Aplicar reemplazos personalizados
    Object.entries(customReplacements).forEach(([from, to]) => {
      normalized = normalized.replace(new RegExp(from, 'gi'), to);
    });

    normalized = normalized
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (maxLength && normalized.length > maxLength) {
      normalized = normalized.substring(0, maxLength).replace(/-+$/, '');
    }

    return normalized;
  } catch (error) {
    console.error('Error creando slug:', error);
    return '';
  }
}

/**
 * Crea un nombre de archivo normalizado
 * Reemplaza caracteres no permitidos en nombres de archivo
 * 
 * @param value - Texto a convertir en nombre de archivo
 * @param extension - Extensión opcional del archivo
 * @returns Nombre de archivo normalizado
 */
export function createFileName(value: string, extension = ''): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const fileReplacements: Record<string, string> = {
      '/': '_',
      '\\': '_',
      ':': '_',
      '*': '_',
      '?': '_',
      '"': '_',
      '<': '_',
      '>': '_',
      '|': '_'
    };

    let normalized = value;
    
    // Reemplazar caracteres no permitidos en nombres de archivo
    Object.entries(fileReplacements).forEach(([from, to]) => {
      normalized = normalized.replace(new RegExp(`\\${from}`, 'g'), to);
    });

    normalized = normalized
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '_')
      .replace(/[^a-z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (normalized.length > 100) {
      normalized = normalized.substring(0, 100).replace(/_+$/, '');
    }

    return extension ? `${normalized}.${extension}` : normalized;
  } catch (error) {
    console.error('Error creando nombre de archivo:', error);
    return '';
  }
}

/**
 * Crear nombre de variable válido para JavaScript/TypeScript
 * 
 * @param value - Texto a convertir en nombre de variable
 * @param isCamelCase - Si es true, convierte a camelCase, si no, usa snake_case
 * @returns Nombre de variable válido
 */
export function createVariableName(value: string, isCamelCase = false): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/^\d+/, ''); // Elimina dígitos al inicio

    if (normalized.length === 0) {
      return 'variable';
    }

    if (isCamelCase) {
      // Convertir a camelCase
      return normalized
        .split(/\s+/)
        .map((word, index) => {
          if (index === 0) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    } else {
      // Convertir a snake_case
      return normalized
        .toLowerCase()
        .replace(/\s+/g, '_');
    }
  } catch (error) {
    console.error('Error creando nombre de variable:', error);
    return 'variable';
  }
} 