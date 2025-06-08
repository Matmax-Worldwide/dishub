import { useState, useRef, useEffect } from 'react';
import { 
  MoreVerticalIcon, 
  PencilIcon, 
  Trash2Icon, 
  Loader2Icon,
  CheckIcon,
  XIcon,
  FolderIcon
} from 'lucide-react';
import { Folder } from './types';

interface FolderMenuProps {
  folder: Folder;
  onDelete: (folderPath: string) => void;
  onRename: (folderPath: string, newName: string) => void;
  onMove?: (folderPath: string, targetFolder: string) => void;
  folders?: Folder[];
  currentFolder?: Folder;
  position?: 'up' | 'down' | 'auto';
  buttonAsDiv?: boolean;
}

export function FolderMenu({
  folder,
  onDelete,
  onRename,
  onMove,
  folders = [],
  currentFolder,
  position = 'auto',
  buttonAsDiv = false
}: FolderMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'rename' | 'move'>('menu');
  const [newName, setNewName] = useState(folder.name);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'up' | 'down'>('up');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    // Focus the input field when rename mode is activated
    if (mode === 'rename' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);
  
  useEffect(() => {
    // Determine the best position for the menu based on available space
    if (position === 'auto' && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceAbove = buttonRect.top;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      
      // Use 150px as an approximate menu height
      const menuHeight = 150;
      
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setMenuPosition('up');
      } else {
        setMenuPosition('down');
      }
    } else {
      setMenuPosition(position === 'auto' ? 'up' : position);
    }
  }, [menuOpen, position]);
  
  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setMode('menu');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleRename = async () => {
    if (newName.trim() === '' || newName === folder.name || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onRename(folder.path, newName);
      setMenuOpen(false);
      setMode('menu');
    } catch (error) {
      console.error('Error renaming folder:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMove = async (targetFolder: string) => {
    if (!onMove || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onMove(folder.path, targetFolder);
      setMenuOpen(false);
      setMode('menu');
    } catch (error) {
      console.error('Error moving folder:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDelete = async () => {
    if (isProcessing) return;
    
    setMenuOpen(false);
    setMode('menu');
    onDelete(folder.path);
  };

  // Determine menu position classes
  const menuPositionClasses = menuPosition === 'up' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {buttonAsDiv ? (
        <div
          ref={buttonRef as React.RefObject<HTMLDivElement>}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
            setMode('menu');
          }}
          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none bg-gray-100 cursor-pointer"
        >
          <MoreVerticalIcon className="h-3 w-3 text-gray-600" />
        </div>
      ) : (
        <button
          ref={buttonRef as React.RefObject<HTMLButtonElement>}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
            setMode('menu');
          }}
          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none bg-gray-100"
        >
          <MoreVerticalIcon className="h-3 w-3 text-gray-600" />
        </button>
      )}
      
      {menuOpen && (
        <div className={`origin-top-right absolute right-0 ${menuPositionClasses} w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
          {mode === 'menu' && (
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMode('rename');
                  setNewName(folder.name);
                }}
                className="text-left w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <PencilIcon className="h-3 w-3 mr-1.5" />
                Rename
              </button>
              {onMove && folders && folders.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('move');
                  }}
                  className="text-left w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FolderIcon className="h-3 w-3 mr-1.5" />
                  Mover a carpeta
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-left w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2Icon className="h-3 w-3 mr-1.5" />
                Delete Folder
              </button>
            </div>
          )}
          
          {mode === 'rename' && (
            <div className="p-2">
              <div className="mb-1 text-xs font-medium text-gray-700">Rename folder</div>
              <div className="flex">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setMode('menu');
                      setNewName(folder.name);
                    }
                  }}
                />
                <div className="flex">
                  <button
                    onClick={() => handleRename()}
                    disabled={isProcessing}
                    className="px-1.5 py-1 bg-blue-500 text-white rounded-tr-md hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
                  >
                    {isProcessing ? (
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setMode('menu');
                      setNewName(folder.name);
                    }}
                    className="px-1.5 py-1 bg-gray-200 text-gray-700 rounded-br-md hover:bg-gray-300 focus:outline-none"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {mode === 'move' && onMove && folders && (
            <div className="p-2">
              <div className="mb-1 text-xs font-medium text-gray-700">Mover a carpeta</div>
              <div className="max-h-48 overflow-y-auto">
                {folder.path !== '' && (
                  <button
                    onClick={() => handleMove('')}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center rounded-md mb-1"
                  >
                    <FolderIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                    Root (Media Library)
                  </button>
                )}
                
                {folders.length > 0 ? (
                  folders
                    .filter(targetFolder => 
                      // Exclude current folder and subfolders of the folder being moved
                      targetFolder.path !== folder.path && 
                      !targetFolder.path.startsWith(`${folder.path}/`) &&
                      // Also exclude the parent folder (already there)
                      targetFolder.path !== (currentFolder?.path || '')
                    )
                    .map(targetFolder => (
                      <button
                        key={targetFolder.id}
                        onClick={() => handleMove(targetFolder.path)}
                        disabled={isProcessing}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center rounded-md mb-1"
                      >
                        <FolderIcon className="h-3 w-3 mr-1.5 text-yellow-500" />
                        {targetFolder.name}
                      </button>
                    ))
                ) : (
                  <div className="px-2 py-1.5 text-xs text-gray-400">
                    No hay carpetas disponibles
                  </div>
                )}
              </div>
              <div className="pt-1 mt-1 border-t border-gray-100">
                <button
                  onClick={() => setMode('menu')}
                  className="w-full text-xs text-center text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 