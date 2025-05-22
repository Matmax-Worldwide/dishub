import { useState, useRef } from 'react';
import { FolderIcon, ChevronLeftIcon, FolderPlusIcon, HomeIcon, Trash2Icon, CheckIcon, XIcon, FileIcon } from 'lucide-react';
import { Folder } from './types';
import { FolderMenu } from './FolderMenu';

interface FolderNavigationProps {
  currentFolder: Folder;
  folders: Folder[];
  onNavigateFolder: (folder: Folder) => void;
  onNavigateBack: () => void;
  onCreateFolder: (folderName: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onRenameFolder?: (folderPath: string, newName: string) => void;
  onMoveFolder?: (folderPath: string, targetFolder: string) => void;
}

export function FolderNavigation({
  currentFolder,
  folders,
  onNavigateFolder,
  onNavigateBack,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onMoveFolder
}: FolderNavigationProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    // Prevent default events
    console.log(`Creating folder with name: ${newFolderName.trim()}`);
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleDeleteFolder = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation(); // Prevent navigating to the folder
    e.preventDefault();
    
    console.log(`Deleting folder: ${folder.name}, Path: ${folder.path}`);
    if (onDeleteFolder) {
      onDeleteFolder(folder.path);
    }
  };
  
  const startRenaming = (folder: Folder) => {
    if (!onRenameFolder) return;
    console.log(`Starting to rename folder: ${folder.name}, Path: ${folder.path}, ID: ${folder.id}`);
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
    // Focus will be set by useEffect on the input ref
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 10);
  };
  
  const cancelRenaming = () => {
    setEditingFolderId(null);
    setEditingName('');
  };
  
  const completeRenaming = () => {
    if (!editingFolderId || !editingName.trim() || !onRenameFolder) return cancelRenaming();
    
    // Encontrar la carpeta real por su ID
    const folderToRename = folders.find(f => f.id === editingFolderId) || 
                           (currentFolder.id === editingFolderId ? currentFolder : null);
    
    if (!folderToRename) {
      console.error(`Cannot find folder with id: ${editingFolderId} for renaming`);
      return cancelRenaming();
    }
    
    console.log(`Renaming folder with path: ${folderToRename.path}, id: ${folderToRename.id}`);
    onRenameFolder(folderToRename.path, editingName);
    setEditingFolderId(null);
    setEditingName('');
  };

  const handleNavigateFolder = (e: React.MouseEvent, folder: Folder) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Navigating to folder: ${folder.name}, Path: ${folder.path}, ID: ${folder.id}`);
    onNavigateFolder(folder);
  };

  return (
    <div className="mb-4 folder-navigation-container" onClick={(e) => e.stopPropagation()}>
      {/* Bread crumb navigation */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center mb-1 text-sm bg-gray-50 p-2 rounded-md"
             onClick={(e) => e.stopPropagation()}>
          {!currentFolder.isRoot && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateBack();
              }}
              className="inline-flex items-center px-2 py-1 mr-2 text-xs bg-white rounded-md border border-gray-200 hover:bg-gray-50"
              title="Volver atrás"
            >
              <ChevronLeftIcon className="h-3 w-3 mr-1" />
              Atrás
            </button>
          )}
          
          <div className="flex items-center flex-wrap gap-1">
            <button 
              className={`inline-flex items-center px-2 py-1 rounded-md ${currentFolder.isRoot ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateFolder({
                  id: 'root',
                  name: 'Media Library',
                  path: '',
                  parentPath: '',
                  isRoot: true
                });
              }}
              title="Ir a la biblioteca principal"
            >
              <HomeIcon className="h-3 w-3 mr-1" />
              Inicio
            </button>
            
            {/* Show path segments if we're in a subfolder */}
            {!currentFolder.isRoot && currentFolder.path.split('/').filter(Boolean).map((segment, index, array) => {
              // Build the path up to this segment
              const path = array.slice(0, index + 1).join('/');
              const isLastSegment = index === array.length - 1;
              
              // Find the actual folder object from the folders list instead of creating a new one
              // This ensures we're using the real folder object with sanitized paths
              let folderObj: Folder;
              
              if (isLastSegment) {
                // For the last segment, use currentFolder
                folderObj = currentFolder;
              } else {
                // For other segments, find by path or create if not found
                const existingFolder = folders.find(f => f.path === path);
                if (existingFolder) {
                  folderObj = existingFolder;
                } else {
                  // Fallback to creating a new folder object
                  folderObj = {
                    id: `folder-${path}`,
                    name: segment,
                    path: path,
                    parentPath: array.slice(0, index).join('/') || '',
                    isRoot: false
                  };
                }
              }
              
              return (
                <div key={path} className="flex items-center">
                  <span className="text-gray-400 mx-1">/</span>
                  
                  {/* If this segment is being edited, show the input */}
                  {isLastSegment && editingFolderId === folderObj.id ? (
                    <div className="flex bg-white border border-blue-300 rounded-md overflow-hidden">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-24 px-2 py-1 text-xs focus:outline-none focus:ring-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') completeRenaming();
                          if (e.key === 'Escape') cancelRenaming();
                        }}
                      />
                      <div className="flex">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            completeRenaming();
                          }}
                          className="px-1 py-1 bg-blue-500 text-white text-xs"
                        >
                          <CheckIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelRenaming();
                          }}
                          className="px-1 py-1 bg-gray-200 text-gray-700 text-xs"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className={`inline-flex items-center px-2 py-1 rounded-md ${
                        isLastSegment 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={(e) => handleNavigateFolder(e, folderObj)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isLastSegment && onRenameFolder) {
                          startRenaming(folderObj);
                        }
                      }}
                      title={`Ir a la carpeta ${segment}`}
                    >
                      {isLastSegment ? (
                        <span className="flex items-center">
                          <FolderIcon className="h-3 w-3 mr-1 text-blue-500" />
                          {segment}
                          
                          {/* Add folder menu for the current folder */}
                          {onRenameFolder && (
                            <span className="ml-1.5" onClick={(e) => e.stopPropagation()}>
                              <FolderMenu
                                folder={folderObj}
                                onDelete={onDeleteFolder || (() => {})}
                                onRename={onRenameFolder}
                                onMove={onMoveFolder}
                                folders={folders}
                                currentFolder={currentFolder}
                                position="down"
                                buttonAsDiv={true}
                              />
                            </span>
                          )}
                        </span>
                      ) : segment}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Crear carpeta button aligned right */}
          <div className="ml-auto">
            {!showNewFolderInput && (
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="inline-flex items-center px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                title="Crear nueva carpeta"
              >
                <FolderPlusIcon className="h-3 w-3 mr-1.5" />
                Nueva Carpeta
              </button>
            )}
            
            {/* Delete current folder button */}
            {!currentFolder.isRoot && onDeleteFolder && (
              <button
                onClick={() => onDeleteFolder(currentFolder.path)}
                className="inline-flex items-center px-3 py-1 ml-2 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                title="Eliminar esta carpeta"
              >
                <Trash2Icon className="h-3 w-3 mr-1.5" />
                Eliminar Carpeta
              </button>
            )}
          </div>
        </div>
        
        {/* Crear carpeta input */}
        {showNewFolderInput && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h3 className="text-xs font-medium text-blue-700 mb-2">Crear nueva carpeta en: {currentFolder.isRoot ? 'Media Library' : currentFolder.name}</h3>
            <div className="flex">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
                className="flex-1 px-3 py-1.5 text-sm border border-blue-200 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolderInput(false);
                }}
              />
              <div className="flex">
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-tr-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowNewFolderInput(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-br-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Subcarpetas */}
      {folders.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="relative group"
            >
              {/* If this folder is being edited, show the rename input */}
              {editingFolderId === folder.id ? (
                <div className="flex flex-col w-full p-3 rounded-md bg-white border border-blue-300">
                  <FolderIcon className="h-8 w-8 mb-1 text-yellow-500 mx-auto" />
                  <div className="flex flex-col">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') completeRenaming();
                        if (e.key === 'Escape') cancelRenaming();
                      }}
                    />
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={completeRenaming}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md"
                      >
                        <CheckIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={cancelRenaming}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onNavigateFolder(folder)}
                  onDoubleClick={() => onRenameFolder && startRenaming(folder)}
                  className="flex items-center justify-center flex-col w-full p-3 text-sm rounded-md bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <FolderIcon className="h-8 w-8 mb-1 text-yellow-500" />
                  <span className="truncate w-full text-center text-xs" title={folder.name}>
                    {folder.name}
                  </span>
                  
                  {/* Badges container - positioned at the bottom right */}
                  <div className="absolute bottom-1 right-1 flex space-x-1">
                    {/* Item count badge (files) */}
                    {(folder.itemCount && folder.itemCount > 0) ? (
                      <div 
                        className="h-5 px-1.5 bg-gray-700 rounded-full flex items-center justify-center min-w-[20px]"
                        title={`${folder.itemCount} archivo${folder.itemCount !== 1 ? 's' : ''}`}
                      >
                        <FileIcon className="h-2.5 w-2.5 mr-0.5 text-gray-300" />
                        <span className="text-white text-[10px] font-semibold">
                          {folder.itemCount > 99 ? "99+" : folder.itemCount}
                        </span>
                      </div>
                    ) : null}
                    
                    {/* Subfolder count badge */}
                    {(folder.subfolderCount && folder.subfolderCount > 0) ? (
                      <div 
                        className="h-5 px-1.5 bg-blue-600 rounded-full flex items-center justify-center min-w-[20px]"
                        title={`${folder.subfolderCount} subcarpeta${folder.subfolderCount !== 1 ? 's' : ''}`}
                      >
                        <FolderIcon className="h-2.5 w-2.5 mr-0.5 text-blue-200" />
                        <span className="text-white text-[10px] font-semibold">
                          {folder.subfolderCount > 99 ? "99+" : folder.subfolderCount}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </button>
              )}
              
              {/* Folder action menu */}
              {!editingFolderId && onRenameFolder && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FolderMenu
                    folder={folder}
                    onDelete={onDeleteFolder || (() => {})}
                    onRename={onRenameFolder}
                    onMove={onMoveFolder}
                    folders={folders}
                    currentFolder={currentFolder}
                  />
                </div>
              )}
              
              {/* Delete folder button overlay - hide when menu is showing */}
              {!editingFolderId && onDeleteFolder && !onRenameFolder && (
                <button
                  onClick={(e) => handleDeleteFolder(e, folder)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  title="Eliminar carpeta"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Separador de sección */}
      <div className="mt-4 mb-2 border-t border-gray-200"></div>
    </div>
  );
} 