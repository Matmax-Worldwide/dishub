'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ImageIcon,
  FileIcon,
  VideoIcon,
  UploadIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  TrashIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon
} from 'lucide-react';

interface MediaItem {
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
}

export default function MediaLibrary() {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // In a real app, you would fetch media items from the API
    // For now, we'll just simulate a loading state and then set dummy data
    const timer = setTimeout(() => {
      const dummyMediaItems: MediaItem[] = [
        {
          id: '1',
          title: 'Hero Image',
          description: 'Main homepage hero background',
          fileUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8',
          fileName: 'hero-image.jpg',
          fileSize: 1240000,
          fileType: 'image/jpeg',
          altText: 'People working in a modern office',
          uploadedAt: '2023-10-15',
          dimensions: '1920x1080'
        },
        {
          id: '2',
          title: 'Product Brochure',
          description: 'PDF brochure for services',
          fileUrl: '/documents/brochure.pdf',
          fileName: 'company-brochure.pdf',
          fileSize: 3540000,
          fileType: 'application/pdf',
          uploadedAt: '2023-10-12'
        },
        {
          id: '3',
          title: 'Team Photo',
          fileUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
          fileName: 'team-photo.jpg',
          fileSize: 2340000,
          fileType: 'image/jpeg',
          altText: 'Our team gathered for a group photo',
          uploadedAt: '2023-10-08',
          dimensions: '1600x900'
        },
        {
          id: '4',
          title: 'Product Demo Video',
          description: 'Overview of our platform features',
          fileUrl: '/videos/product-demo.mp4',
          fileName: 'product-demo.mp4',
          fileSize: 12400000,
          fileType: 'video/mp4',
          uploadedAt: '2023-10-05'
        },
        {
          id: '5',
          title: 'Logo',
          fileUrl: '/images/logo.png',
          fileName: 'logo.png',
          fileSize: 45000,
          fileType: 'image/png',
          altText: 'Company logo',
          uploadedAt: '2023-09-20',
          dimensions: '512x512'
        },
        {
          id: '6',
          title: 'About Background',
          fileUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
          fileName: 'about-bg.jpg',
          fileSize: 1840000,
          fileType: 'image/jpeg',
          uploadedAt: '2023-09-15',
          dimensions: '1920x1080'
        }
      ];
      setMediaItems(dummyMediaItems);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            // Add a dummy new file to the media library
            const file = e.target.files![0];
            const newMediaItem: MediaItem = {
              id: `new-${Date.now()}`,
              title: file.name,
              fileUrl: URL.createObjectURL(file),
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString().split('T')[0]
            };
            setMediaItems(prev => [newMediaItem, ...prev]);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDeleteSelected = () => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      setMediaItems(mediaItems.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === mediaItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mediaItems.map(item => item.id));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setClipboard(url);
    setTimeout(() => setClipboard(null), 2000);
  };

  const filteredMedia = mediaItems
    .filter(item => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) || 
          item.fileName.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) || false)
        );
      }
      // Apply type filter
      if (filterType !== 'all') {
        if (filterType === 'image' && !item.fileType.startsWith('image/')) return false;
        if (filterType === 'video' && !item.fileType.startsWith('video/')) return false;
        if (filterType === 'document' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(item.fileType)) return false;
      }
      return true;
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (fileType.startsWith('video/')) return <VideoIcon className="h-8 w-8 text-purple-500" />;
    return <FileIcon className="h-8 w-8 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <button
          onClick={handleFileUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          Upload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
      </div>

      {uploadProgress !== null && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center mb-2">
            <span className="font-medium">Uploading...</span>
            <span className="ml-auto">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
              >
                <option value="all">All Media</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
              <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex border rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                title="Grid view"
              >
                <GridIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                title="List view"
              >
                <ListIcon className="h-5 w-5" />
              </button>
            </div>

            {selectedItems.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-2 text-red-600 rounded-md flex items-center hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete ({selectedItems.length})
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square"></div>
              ))}
            </div>
          </div>
        ) : filteredMedia.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMedia.map((item) => (
                  <div 
                    key={item.id}
                    className={`border rounded-lg overflow-hidden group ${
                      selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {item.fileType.startsWith('image/') ? (
                        <Image
                          src={item.fileUrl}
                          alt={item.altText || item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 20vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {getFileIcon(item.fileType)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(item.fileUrl)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                            title="Copy URL"
                          >
                            {clipboard === item.fileUrl ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CopyIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => window.open(item.fileUrl, '_blank')}
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                            title="Open in new tab"
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatFileSize(item.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === mediaItems.length && mediaItems.length > 0}
                        onChange={selectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedia.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            {item.fileType.startsWith('image/') ? (
                              <Image
                                src={item.fileUrl}
                                alt={item.altText || item.title}
                                width={40}
                                height={40}
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                {getFileIcon(item.fileType)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.fileType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.uploadedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => copyToClipboard(item.fileUrl)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Copy URL"
                          >
                            {clipboard === item.fileUrl ? (
                              <CheckIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <CopyIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => window.open(item.fileUrl, '_blank')}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View file"
                          >
                            <ExternalLinkIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItems([item.id]);
                              handleDeleteSelected();
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete file"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-12 text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
            <p className="max-w-md mx-auto mb-6">
              {searchQuery || filterType !== 'all'
                ? "No media matches your search criteria. Try adjusting your filters."
                : "Your media library is empty. Upload files to get started."}
            </p>
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 