'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  User,
  Building,
  Tag,
  ExternalLink,
  Paperclip,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// TypeScript interfaces for GraphQL integration
interface LegalDocument {
  id: string;
  name: string;
  type: 'incorporation' | 'contract' | 'certificate' | 'power_of_attorney' | 'memorandum' | 'articles' | 'other';
  category: 'incorporation_docs' | 'legal_docs' | 'client_docs' | 'compliance_docs';
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  updatedAt: string;
  incorporationId?: string;
  clientId?: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  tags: string[];
  description?: string;
  version: number;
  isActive: boolean;
  accessLevel: 'public' | 'private' | 'restricted';
}

interface DocumentFilters {
  search: string;
  type: string;
  category: string;
  dateRange: string;
  uploadedBy: string;
  tags: string[];
  incorporationId: string;
  clientId: string;
}

// Mock data
const mockDocuments: LegalDocument[] = [
  {
    id: '1',
    name: 'Articles of Incorporation - TechStart LLC.pdf',
    type: 'articles',
    category: 'incorporation_docs',
    fileUrl: '/documents/articles-techstart-llc.pdf',
    fileSize: 2451789,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
    incorporationId: 'INC-2024-001',
    clientId: 'CLI-001',
    uploadedBy: {
      id: 'USR-001',
      name: 'Dr. Carlos Rodríguez',
      email: 'carlos@lawfirm.com'
    },
    tags: ['delaware', 'llc', 'tech-startup'],
    description: 'Final version of Articles of Incorporation for TechStart LLC',
    version: 3,
    isActive: true,
    accessLevel: 'private'
  },
  {
    id: '2',
    name: 'Certificate of Incorporation - Global Trading Ltd.pdf',
    type: 'certificate',
    category: 'incorporation_docs',
    fileUrl: '/documents/certificate-global-trading.pdf',
    fileSize: 1245678,
    mimeType: 'application/pdf',
    uploadedAt: '2024-01-08T09:15:00Z',
    updatedAt: '2024-01-08T09:15:00Z',
    incorporationId: 'INC-2024-002',
    clientId: 'CLI-002',
    uploadedBy: {
      id: 'USR-002',
      name: 'Dra. Ana López',
      email: 'ana@lawfirm.com'
    },
    tags: ['uk', 'limited-company', 'trading'],
    description: 'Official Certificate of Incorporation from Companies House',
    version: 1,
    isActive: true,
    accessLevel: 'private'
  }
];

const mockStats = {
  totalDocuments: 156,
  documentsThisMonth: 23,
  storageUsed: 2.4, // GB
  pendingReview: 5
};

export default function DocumentsPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [documents] = useState<LegalDocument[]>(mockDocuments);
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    type: '',
    category: '',
    dateRange: '',
    uploadedBy: '',
    tags: [],
    incorporationId: '',
    clientId: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'incorporation': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      case 'power_of_attorney': return 'bg-orange-100 text-orange-800';
      case 'memorandum': return 'bg-indigo-100 text-indigo-800';
      case 'articles': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incorporation_docs': return 'bg-blue-100 text-blue-800';
      case 'legal_docs': return 'bg-green-100 text-green-800';
      case 'client_docs': return 'bg-purple-100 text-purple-800';
      case 'compliance_docs': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-yellow-100 text-yellow-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.documents') || 'Legal Documents'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.documentsSubtitle') || 'Manage and organize legal documents for incorporations and clients'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            {t('legal.uploadDocument') || 'Upload Document'}
          </button>
          <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.createFolder') || 'Create Folder'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalDocuments') || 'Total Documents'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.documentsThisMonth') || 'This Month'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.documentsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Paperclip className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.storageUsed') || 'Storage Used'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.storageUsed} GB</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.pendingReview') || 'Pending Review'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.pendingReview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('legal.searchDocuments') || 'Search documents...'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allTypes') || 'All Types'}</option>
              <option value="incorporation">{t('legal.documentTypes.incorporation') || 'Incorporation'}</option>
              <option value="contract">{t('legal.documentTypes.contract') || 'Contract'}</option>
              <option value="certificate">{t('legal.documentTypes.certificate') || 'Certificate'}</option>
              <option value="articles">{t('legal.documentTypes.articles') || 'Articles'}</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allCategories') || 'All Categories'}</option>
              <option value="incorporation_docs">{t('legal.categories.incorporation_docs') || 'Incorporation Docs'}</option>
              <option value="legal_docs">{t('legal.categories.legal_docs') || 'Legal Docs'}</option>
              <option value="client_docs">{t('legal.categories.client_docs') || 'Client Docs'}</option>
              <option value="compliance_docs">{t('legal.categories.compliance_docs') || 'Compliance Docs'}</option>
            </select>

            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {t('legal.moreFilters') || 'More Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents List/Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('legal.documentsList') || 'Documents'}
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="date-desc">{t('legal.sortByDateDesc') || 'Newest First'}</option>
                <option value="date-asc">{t('legal.sortByDateAsc') || 'Oldest First'}</option>
                <option value="name-asc">{t('legal.sortByNameAsc') || 'Name A-Z'}</option>
                <option value="name-desc">{t('legal.sortByNameDesc') || 'Name Z-A'}</option>
                <option value="size-desc">{t('legal.sortBySizeDesc') || 'Largest First'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(document.type)}`}>
                          {t(`legal.documentTypes.${document.type}`) || document.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                          {t(`legal.categories.${document.category}`) || document.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(document.accessLevel)}`}>
                          {t(`legal.accessLevels.${document.accessLevel}`) || document.accessLevel}
                        </span>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {document.uploadedBy.name}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(document.uploadedAt)}
                        </span>
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>v{document.version}</span>
                        {document.incorporationId && (
                          <Link
                            href={`/${locale}/${tenantSlug}/legal/incorporations/${document.incorporationId}`}
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <Building className="h-3 w-3 mr-1" />
                            {document.incorporationId}
                          </Link>
                        )}
                      </div>
                      
                      {document.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Tag className="h-3 w-3 text-gray-400" />
                          {document.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 