import React, { useState, useEffect } from 'react';
import { grievanceApi } from '../../services/api';
import { Loader2, Image as ImageIcon, AlertCircle, ZoomIn, X, Download } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const AttachmentViewer = ({
  grievanceId,
  attachmentIndex,
  filename = 'attachment',
  size,
  mimeType
}) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    const fetchAttachment = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await grievanceApi.getAttachmentBlob(grievanceId, attachmentIndex);
        if (!isMounted) return;

        createdUrl = URL.createObjectURL(response.data);
        setBlobUrl(createdUrl);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load attachment blob:', err);
        setError('Failed to load attachment image.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (grievanceId !== undefined && attachmentIndex !== undefined) {
      fetchAttachment();
    }

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [grievanceId, attachmentIndex]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="h-32 w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-4 text-slate-400 space-y-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        <span className="text-xs">Loading image securely…</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="h-32 w-full max-w-xs bg-rose-50/50 border border-rose-200 rounded-lg flex flex-col items-center justify-center p-4 text-rose-600 space-y-1.5">
        <AlertCircle className="w-5 h-5" />
        <span className="text-xs text-center">{error || 'Image unavailable'}</span>
      </div>
    );
  }

  return (
    <>
      <div className="group relative w-full max-w-xs bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all shadow-sm">
        <div
          className="h-36 bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden relative"
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={blobUrl}
            alt={filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-medium rounded-md shadow-sm flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5" /> Enlarge
            </span>
          </div>
        </div>

        <div className="p-2.5 flex items-center justify-between text-xs bg-white">
          <div className="truncate pr-2">
            <p className="font-medium text-slate-700 truncate" title={filename}>
              {filename}
            </p>
            {size && <p className="text-slate-400 text-[11px]">{formatFileSize(size)}</p>}
          </div>

          <a
            href={blobUrl}
            download={filename}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Download original file"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Lightbox / Modal View */}
      {showLightbox && (
        <Modal
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          title={`Attachment: ${filename}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="max-h-[70vh] flex items-center justify-center bg-slate-900/5 rounded-lg overflow-hidden p-2">
              <img
                src={blobUrl}
                alt={filename}
                className="max-h-[65vh] max-w-full object-contain rounded"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div>
                <span>Type: {mimeType || 'Image'}</span>
                {size && <span className="ml-3">&bull; Size: {formatFileSize(size)}</span>}
              </div>
              <a
                href={blobUrl}
                download={filename}
                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Download className="w-4 h-4" /> Download original
              </a>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AttachmentViewer;
