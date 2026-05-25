import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle, Image, File } from 'lucide-react';
import { recordsAPI } from '../api';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'done' | 'error';
  file_url?: string;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image size={24} className="text-purple-500" />;
  if (mimeType === 'application/pdf') return <FileText size={24} className="text-red-500" />;
  return <File size={24} className="text-gray-400" />;
}

export default function UploadView() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    
    for (const file of fileArr) {
      if (!allowed.includes(file.type)) {
        setUploads(prev => [...prev, {
          name: file.name, size: file.size, type: file.type,
          status: 'error', error: 'Unsupported file type. Use PDF, JPG, or PNG.'
        }]);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploads(prev => [...prev, {
          name: file.name, size: file.size, type: file.type,
          status: 'error', error: 'File too large. Maximum 20MB.'
        }]);
        continue;
      }

      // Add as uploading
      const entry: UploadedFile = { name: file.name, size: file.size, type: file.type, status: 'uploading' };
      setUploads(prev => [...prev, entry]);

      try {
        const result = await recordsAPI.upload(file);
        setUploads(prev =>
          prev.map(u => u.name === file.name && u.status === 'uploading'
            ? { ...u, status: 'done', file_url: result.file_url }
            : u
          )
        );
      } catch (err: any) {
        setUploads(prev =>
          prev.map(u => u.name === file.name && u.status === 'uploading'
            ? { ...u, status: 'error', error: err.message || 'Upload failed' }
            : u
          )
        );
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removeUpload = (name: string) => {
    setUploads(prev => prev.filter(u => u.name !== name));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload PDFs or images. Files are securely stored and AI extraction is triggered automatically.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50 scale-[1.01]'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 bg-white'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
          isDragging ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <UploadCloud size={32} className={isDragging ? 'text-blue-500' : 'text-gray-400'} />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">
          {isDragging ? 'Drop files here!' : 'Drag & drop files here'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          <UploadCloud size={16} /> Browse Files
        </div>
        <p className="text-xs text-gray-400 mt-4">Supported: PDF, JPG, PNG, WebP · Max 20MB per file</p>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">{uploads.length} file(s)</h3>
            <button
              onClick={() => setUploads([])}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Clear all
            </button>
          </div>

          {uploads.map((u, i) => (
            <div
              key={`${u.name}-${i}`}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                u.status === 'done' ? 'bg-emerald-50 border-emerald-100' :
                u.status === 'error' ? 'bg-red-50 border-red-100' :
                'bg-white border-gray-100'
              }`}
            >
              <FileIcon mimeType={u.type} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(u.size)}</p>
                {u.status === 'error' && (
                  <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={11} /> {u.error}
                  </p>
                )}
                {u.status === 'done' && u.file_url && (
                  <a
                    href={u.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-0.5 block"
                  >
                    View uploaded file ↗
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {u.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {u.status === 'done' && <CheckCircle size={20} className="text-emerald-500" />}
                {u.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                <button
                  onClick={() => removeUpload(u.name)}
                  className="p-1 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Files are encrypted in transit and at rest in Supabase Storage.' },
          { icon: '🤖', title: 'AI Extraction', desc: 'Our AI automatically extracts key data from your uploaded lab reports.' },
          { icon: '🔗', title: 'Linkable to Records', desc: 'After upload, copy the file URL into any medical record entry.' },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <span className="text-2xl mb-2 block">{card.icon}</span>
            <h4 className="text-xs font-bold text-gray-800 mb-1">{card.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
