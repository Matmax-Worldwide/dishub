'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { format, parseISO } from 'date-fns';

// Consultas GraphQL
const GET_DOCUMENTS = gql`
  query GetDocuments {
    documents {
      id
      title
      description
      fileUrl
      status
      createdAt
      updatedAt
    }
  }
`;

const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      title
      description
      fileUrl
      status
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id) {
      id
    }
  }
`;

const UPDATE_DOCUMENT_STATUS = gql`
  mutation UpdateDocumentStatus($id: ID!, $status: DocumentStatus!) {
    updateDocumentStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

// Tipos
interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  // Cargar documentos
  const { loading, error, data, refetch } = useQuery(GET_DOCUMENTS, {
    client,
  });

  // Mutaciones
  const [uploadDocument] = useMutation(UPLOAD_DOCUMENT, {
    client,
    onCompleted: () => {
      setIsUploadModalOpen(false);
      refetch();
    },
  });

  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    client,
    onCompleted: () => {
      setSelectedDocument(null);
      refetch();
    },
  });

  const [updateDocumentStatus] = useMutation(UPDATE_DOCUMENT_STATUS, {
    client,
    onCompleted: () => {
      refetch();
    },
  });

  // Manejadores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUploadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // En un caso real, aquí iría la lógica para subir el archivo a un servicio de almacenamiento
    // como S3, Firebase Storage, etc., y luego usar la URL en la mutación GraphQL
    
    // Simulación de URL para la demostración
    const mockFileUrl = `https://storage.example.com/${Date.now()}-${uploadForm.file?.name}`;
    
    uploadDocument({
      variables: {
        input: {
          title: uploadForm.title,
          description: uploadForm.description,
          fileUrl: mockFileUrl,
        },
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteDocument({
      variables: {
        id,
      },
    });
  };

  const handleStatusChange = (id: string, status: Document['status']) => {
    updateDocumentStatus({
      variables: {
        id,
        status,
      },
    });
  };

  const getStatusBadgeColor = (status: Document['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center p-6">Loading documents...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading documents: {error.message}</div>;

  const documents = data?.documents || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Upload Document
        </button>
      </div>

      {/* Documentos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No documents found. Upload your first document!</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {documents.map((doc: Document) => (
              <li key={doc.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-indigo-600 truncate">{doc.title}</div>
                        <div className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Uploaded on {format(parseISO(doc.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      {doc.description && (
                        <div className="mt-1 text-sm text-gray-500 line-clamp-2">{doc.description}</div>
                      )}
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex space-x-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          View
                        </a>
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de carga de documentos */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Upload New Document</h2>
            </div>

            <form onSubmit={handleUpload} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={uploadForm.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={uploadForm.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File</label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 
                               file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                               file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700
                               hover:file:bg-indigo-100"
                    required
                  />
                </div>
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={!uploadForm.file || !uploadForm.title}
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestión de documentos */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Manage Document</h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedDocument.title}</h3>
                {selectedDocument.description && (
                  <p className="mt-1 text-sm text-gray-500">{selectedDocument.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Uploaded on {format(parseISO(selectedDocument.createdAt), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500">
                  Last updated on {format(parseISO(selectedDocument.updatedAt), 'MMMM d, yyyy')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedDocument.status}
                  onChange={(e) => handleStatusChange(selectedDocument.id, e.target.value as Document['status'])}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <a
                  href={selectedDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-center"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(selectedDocument.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 