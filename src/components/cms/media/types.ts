export interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  altText?: string;
  uploadedAt: string;
  s3Key?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  isRoot: boolean;
  itemCount?: number;
  subfolderCount?: number;
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