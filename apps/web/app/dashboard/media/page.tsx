'use client';

import { useRef, useState } from 'react';
import { Upload, Trash2, FileText, Image as ImageIcon, Film, File as FileIcon } from 'lucide-react';
import { useMediaFiles, useUploadMedia, useDeleteMedia } from '../../../lib/hooks';

const MAX_FILE_BYTES = 7 * 1024 * 1024; // stay under express.json's 10mb limit once base64-encoded (~33% overhead)

function iconFor(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return FileText;
  return FileIcon;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaPage() {
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaRes, isLoading } = useMediaFiles();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const files = mediaRes?.data || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError('');

    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File too large. Max size is ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadMedia.mutateAsync({
        file: base64,
        file_type: file.type || 'application/octet-stream',
        file_name: file.name,
      });
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This removes it from your media library.`)) {
      deleteMedia.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Media Library</h1>
            <p className="font-body text-body-md text-muted mt-xs">Images, videos, and documents for messages and templates</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
        </div>

        {uploadError && (
          <div className="mb-md p-md bg-error/10 border border-error/20 rounded-lg font-body text-body-sm text-error">
            {uploadError}
          </div>
        )}

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">
              No media files yet. Upload one to use it in messages and templates.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md">
              {files.map((file) => {
                const Icon = iconFor(file.mimeType);
                return (
                  <div key={file.id} className="border border-hairline rounded-lg overflow-hidden group relative">
                    {file.mimeType.startsWith('image/') && file.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.publicUrl} alt={file.originalName} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-canvas-soft flex items-center justify-center">
                        <Icon className="w-8 h-8 text-muted" />
                      </div>
                    )}
                    <div className="p-sm">
                      <p className="font-body text-caption text-ink truncate" title={file.originalName}>{file.originalName}</p>
                      <p className="font-body text-caption text-muted-soft">{formatBytes(file.sizeBytes)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(file.id, file.originalName)}
                      title="Delete file"
                      className="absolute top-xs right-xs p-xs bg-canvas-deep/60 hover:bg-red-500 rounded-md transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
