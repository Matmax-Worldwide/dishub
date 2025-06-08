import { useState } from 'react';
import { Trash2, FolderUp, X, CheckSquare } from 'lucide-react';
import { Folder } from './types';

interface MediaSelectionActionsProps {
  selectedCount: number;
  folders: Folder[];
  currentFolder: Folder;
  onDeleteSelected: () => void;
  onMoveSelected: (targetFolder: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalItems: number;
}

export function MediaSelectionActions({
  selectedCount,
  folders,
  currentFolder,
  onDeleteSelected,
  onMoveSelected,
  onSelectAll,
  isAllSelected,
  totalItems
}: MediaSelectionActionsProps) {
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [targetFolder, setTargetFolder] = useState('');

  const handleMoveSelected = () => {
    if (targetFolder) {
      onMoveSelected(targetFolder);
      setShowFolderSelector(false);
      setTargetFolder('');
    }
  };

  // Don't render if there are no items at all
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-2 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onSelectAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition"
          >
            <CheckSquare className={`h-3.5 w-3.5 ${isAllSelected ? 'text-blue-500' : 'text-gray-500'}`} />
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
          {selectedCount > 0 && (
            <span className="text-xs text-gray-600 ml-3">
              {selectedCount} of {totalItems} selected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {selectedCount > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowFolderSelector(!showFolderSelector)}
                  className="px-3 py-1.5 flex items-center space-x-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                >
                  <FolderUp className="h-3.5 w-3.5" />
                  <span>Move</span>
                </button>
                
                {showFolderSelector && (
                  <div className="absolute right-0 bottom-10 w-64 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-semibold">Move to folder</h3>
                      <button 
                        onClick={() => setShowFolderSelector(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <select
                        value={targetFolder}
                        onChange={(e) => setTargetFolder(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Root folder</option>
                        {folders.map((folder) => (
                          <option 
                            key={folder.id} 
                            value={folder.path}
                            disabled={currentFolder?.path === folder.path}
                          >
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={handleMoveSelected}
                      disabled={!targetFolder && currentFolder?.path !== ''}
                      className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Move Files
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onDeleteSelected}
                className="px-3 py-1.5 flex items-center space-x-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 