/**
 * Global Media Cache System
 * Evita múltiples llamadas a la API de S3 almacenando los resultados en memoria
 */

import { MediaItem, Folder } from '@/components/engines/cms/modules/media/types';

interface CacheEntry {
  data: MediaItem[];
  timestamp: number;
  prefix: string;
}

interface FolderCacheEntry {
  data: Folder[];
  timestamp: number;
  prefix: string;
}

class MediaCacheManager {
  private cache = new Map<string, CacheEntry>();
  private folderCache = new Map<string, FolderCacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 50; // Máximo 50 entradas

  /**
   * Genera una clave de caché basada en el prefijo
   */
  private getCacheKey(prefix: string): string {
    return `media_${prefix || 'root'}`;
  }

  /**
   * Genera una clave de caché para folders
   */
  private getFolderCacheKey(prefix: string): string {
    return `folders_${prefix || 'root'}`;
  }

  /**
   * Verifica si una entrada de caché es válida
   */
  private isValidCacheEntry(entry: CacheEntry | FolderCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.CACHE_DURATION;
  }

  /**
   * Limpia entradas de caché expiradas
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    // Limpiar caché de media
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }

    // Limpiar caché de folders
    for (const [key, entry] of this.folderCache.entries()) {
      if ((now - entry.timestamp) >= this.CACHE_DURATION) {
        this.folderCache.delete(key);
      }
    }
  }

  /**
   * Limita el tamaño del caché eliminando las entradas más antiguas
   */
  private limitCacheSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Convertir a array y ordenar por timestamp
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      // Eliminar las entradas más antiguas
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }

    if (this.folderCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.folderCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => this.folderCache.delete(key));
    }
  }

  /**
   * Obtiene media items del caché
   */
  getMediaItems(prefix: string = ''): MediaItem[] | null {
    this.cleanExpiredEntries();
    
    const cacheKey = this.getCacheKey(prefix);
    const entry = this.cache.get(cacheKey);
    
    if (entry && this.isValidCacheEntry(entry)) {
      console.log(`📦 Cache HIT for media items: ${prefix || 'root'}`);
      return entry.data;
    }
    
    console.log(`🔍 Cache MISS for media items: ${prefix || 'root'}`);
    return null;
  }

  /**
   * Almacena media items en el caché
   */
  setMediaItems(prefix: string = '', data: MediaItem[]): void {
    this.cleanExpiredEntries();
    this.limitCacheSize();
    
    const cacheKey = this.getCacheKey(prefix);
    const entry: CacheEntry = {
      data: [...data], // Crear copia para evitar mutaciones
      timestamp: Date.now(),
      prefix
    };
    
    this.cache.set(cacheKey, entry);
    console.log(`💾 Cached ${data.length} media items for: ${prefix || 'root'}`);
  }

  /**
   * Obtiene folders del caché
   */
  getFolders(prefix: string = ''): Folder[] | null {
    this.cleanExpiredEntries();
    
    const cacheKey = this.getFolderCacheKey(prefix);
    const entry = this.folderCache.get(cacheKey);
    
    if (entry && this.isValidCacheEntry(entry)) {
      console.log(`📦 Cache HIT for folders: ${prefix || 'root'}`);
      return entry.data;
    }
    
    console.log(`🔍 Cache MISS for folders: ${prefix || 'root'}`);
    return null;
  }

  /**
   * Almacena folders en el caché
   */
  setFolders(prefix: string = '', data: Folder[]): void {
    this.cleanExpiredEntries();
    this.limitCacheSize();
    
    const cacheKey = this.getFolderCacheKey(prefix);
    const entry: FolderCacheEntry = {
      data: [...data],
      timestamp: Date.now(),
      prefix
    };
    
    this.folderCache.set(cacheKey, entry);
    console.log(`💾 Cached ${data.length} folders for: ${prefix || 'root'}`);
  }

  /**
   * Invalida el caché para un prefijo específico
   */
  invalidatePrefix(prefix: string = ''): void {
    const mediaKey = this.getCacheKey(prefix);
    const folderKey = this.getFolderCacheKey(prefix);
    
    this.cache.delete(mediaKey);
    this.folderCache.delete(folderKey);
    
    console.log(`🗑️ Invalidated cache for: ${prefix || 'root'}`);
  }

  /**
   * Invalida todo el caché
   */
  invalidateAll(): void {
    this.cache.clear();
    this.folderCache.clear();
    console.log('🗑️ Invalidated all media cache');
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    mediaEntries: number;
    folderEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const allEntries = [
      ...Array.from(this.cache.values()),
      ...Array.from(this.folderCache.values())
    ];

    const timestamps = allEntries.map(entry => entry.timestamp);
    
    return {
      mediaEntries: this.cache.size,
      folderEntries: this.folderCache.size,
      totalSize: this.cache.size + this.folderCache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  /**
   * Precargar media items para folders comunes
   */
  async preloadCommonFolders(): Promise<void> {
    const commonFolders = ['', 'uploads/', 'images/', 'videos/'];
    
    for (const folder of commonFolders) {
      // Solo precargar si no está en caché
      if (!this.getMediaItems(folder)) {
        try {
          const response = await fetch(`/api/media/list?prefix=${encodeURIComponent(folder)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.items) {
              this.setMediaItems(folder, data.items);
            }
          }
        } catch (error) {
          console.warn(`Failed to preload folder: ${folder}`, error);
        }
      }
    }
  }
}

// Instancia global del caché
export const mediaCache = new MediaCacheManager();

// Función helper para obtener media items con caché
export async function getCachedMediaItems(prefix: string = ''): Promise<MediaItem[]> {
  // Intentar obtener del caché primero
  const cached = mediaCache.getMediaItems(prefix);
  if (cached) {
    return cached;
  }

  // Si no está en caché, hacer la llamada a la API
  try {
    const response = await fetch(`/api/media/list?prefix=${encodeURIComponent(prefix)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const items = data.items || [];
    
    // Almacenar en caché
    mediaCache.setMediaItems(prefix, items);
    
    return items;
  } catch (error) {
    console.error('Error fetching media items:', error);
    throw error;
  }
}

// Función helper para obtener folders con caché
export async function getCachedFolders(prefix: string = ''): Promise<Folder[]> {
  // Intentar obtener del caché primero
  const cached = mediaCache.getFolders(prefix);
  if (cached) {
    return cached;
  }

  // Si no está en caché, hacer la llamada a la API
  try {
    const response = await fetch(`/api/media/folders?prefix=${encodeURIComponent(prefix)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const folders = data.folders || [];
    
    // Almacenar en caché
    mediaCache.setFolders(prefix, folders);
    
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

// Función para invalidar caché cuando se suben/eliminan archivos
export function invalidateMediaCache(prefix?: string): void {
  if (prefix) {
    mediaCache.invalidatePrefix(prefix);
  } else {
    mediaCache.invalidateAll();
  }
}

// Precargar folders comunes al inicializar
if (typeof window !== 'undefined') {
  // Solo en el cliente
  setTimeout(() => {
    mediaCache.preloadCommonFolders().catch(console.warn);
  }, 1000); // Esperar 1 segundo después de cargar la página
} 