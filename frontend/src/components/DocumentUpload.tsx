 import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Document } from '../utils/storage';

interface DocumentUploadProps {
  onDocumentUploaded: (document: Document) => void;
  onCancel: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentUploaded,
  onCancel
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError('');
    setSuccess(false);

    // Check document count limit (max 3)
    const userId = localStorage.getItem('userId');
    const documents = JSON.parse(localStorage.getItem('document_chat_documents') || '[]');
    const userDocs = userId ? documents.filter((doc: any) => doc.userId === userId) : documents;
    if (userDocs.length >= 3) {
      setError('You can only upload up to 3 documents. Delete existing documents to upload new ones.');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get your JWT token from storage (adjust as needed)
      const token = localStorage.getItem('token');

      const response = await fetch('http://127.0.0.1:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
          // Do NOT set Content-Type; browser will set it for FormData
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Upload failed');
      }

      const chat = await response.json();
      setSuccess(true);

      // Map backend fields to frontend fields
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const userId = localStorage.getItem('userId') || '';
      const mappedDocument = {
        id: chat.document_id?.toString() || chat.id?.toString() || '',
        userId,
        fileName: originalName,
        fileType: file.name.split('.').pop() || '',
        content: '', // Not available from upload response
        uploadedAt: chat.uploaded_at || chat.uploadedAt || chat.created_at || new Date().toISOString(),
        size: file.size || 0
      };

      setTimeout(() => {
        onDocumentUploaded(mappedDocument); // Pass the mapped document to parent
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setProcessing(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {processing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Processing document...</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-green-600 font-medium">Document uploaded successfully!</p>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Drop your document here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse and upload
                </p>
                <button
                  onClick={openFileDialog}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  <FileText className="w-5 h-5" />
                  Choose File
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: PDF, DOCX, TXT (max 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};