import React, { useState, useEffect } from 'react';
import { Upload, FileText, MessageSquare, Trash2, LogOut, Plus, Search, Link } from 'lucide-react';
import { logout } from '../utils/auth';
import { User } from '../utils/auth';
// import { Document, getDocuments, deleteDocument } from '../utils/storage';
import { DocumentUpload } from './DocumentUpload';
import { ChatInterface } from './ChatInterface';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  size: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [user.id]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/documents', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const docs = await response.json();
      setDocuments(
        docs
          .map((doc: any) => ({
            id: doc.id.toString(),
            fileName: doc.filename,
            fileType: '', // Not available from backend, can be improved
            uploadedAt: doc.uploaded_at,
            size: doc.content ? doc.content.length : 0
          }))
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      );
    } catch (err) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (document: Document) => {
    loadDocuments(); // Refresh from backend
    setSelectedDocument(document);
    setShowUpload(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://127.0.0.1:8000/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      loadDocuments();
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
    } catch (err) {
      // Optionally show error
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleLinkUpload = async () => {
    setLinkError('');
    setLinkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/links/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: linkInput })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to upload link');
      }
      setLinkInput('');
      loadDocuments();
    } catch (err: any) {
      setLinkError(err.message || 'Failed to upload link');
    } finally {
      setLinkLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.fileName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    // Parse as UTC and convert to local time
    const utcDate = new Date(dateString + 'Z');
    return (
      utcDate.toLocaleDateString() + ' ' + utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (local time)'
    );
  };

  const getFileIcon = (fileType: string, fileName?: string) => {
    if (fileName && (fileName.startsWith('http://') || fileName.startsWith('https://'))) {
      return <Link className="w-6 h-6 text-blue-500" />;
    }
    switch ((fileType || '').toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📄';
      default:
        return '📄';
    }
  };

  if (showUpload) {
    return (
      <DocumentUpload
        userId={user.id}
        onDocumentUploaded={handleDocumentUploaded}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  if (selectedDocument) {
    return (
      <ChatInterface
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
        onDelete={() => handleDeleteDocument(selectedDocument.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Chat Assistant</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload a Document</h2>
            <p className="text-gray-600 mb-6">
              Upload PDF, DOCX, or TXT files to start chatting with your documents
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Upload Document
            </button>
          </div>
          {/* Link Upload Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Or add a website link</h3>
            <div className="flex gap-2 items-center justify-center">
              <input
                type="url"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                placeholder="Paste website URL (https://...)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                disabled={linkLoading}
              />
              <button
                onClick={handleLinkUpload}
                disabled={!linkInput.trim() || linkLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkLoading ? 'Adding...' : 'Add Link'}
              </button>
            </div>
            {linkError && <div className="mt-2 text-red-600 text-sm">{linkError}</div>}
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : documents.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getFileIcon(document.fileType, document.fileName)}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{document.fileName}</h3>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(document.size)} • Uploaded {formatDateTime(document.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDocument(document)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600">Upload your first document to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
};