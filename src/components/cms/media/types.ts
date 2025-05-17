export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  altText?: string;
  uploadedAt: string;
  dimensions?: string;
  s3Key?: string; // S3 key for deleting the file
  folder?: string; // Path of the folder the file is in
}

export interface Folder {
  id: string;
  name: string;       // Display name (puede contener caracteres especiales)
  path: string;       // S3 path (sanitizado)
  parentPath?: string;
  isRoot?: boolean;
  itemCount?: number;
  subfolderCount?: number; // Cantidad de subcarpetas dentro de esta carpeta
}

export interface MediaLibraryState {
  currentFolder: Folder;
  folderHistory: Folder[];
  folders: Folder[];
  mediaItems: MediaItem[];
  isLoading: boolean;
  error: string | null;
}

export type MediaFileAction = 
  | { type: 'rename'; id: string; newName: string }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; targetFolder: string }
  | { type: 'createFolder'; folderName: string; parentPath?: string }
  | { type: 'navigateFolder'; path: string }
  | { type: 'back' }; 