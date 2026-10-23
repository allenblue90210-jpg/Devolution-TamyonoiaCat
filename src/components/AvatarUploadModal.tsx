import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  X,
  Upload,
  User as UserIcon,
  Check,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { isRealAvatarUrl } from './UserAvatar.js';

interface AvatarUploadModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

const REGULAR_PROFILE_ICONS = [
  {
    id: 'regular-slate',
    label: 'Standard Slate',
    subtitle: 'Classic clean silhouette',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%23f1f5f9"/><circle cx="100" cy="74" r="38" fill="%2364748b"/><path d="M38 184c0-36 28-64 62-64s62 28 62 64" fill="%2364748b"/></svg>`,
  },
  {
    id: 'regular-indigo',
    label: 'Classic Indigo',
    subtitle: 'Signature brand style',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%23e0e7ff"/><circle cx="100" cy="74" r="38" fill="%234f46e5"/><path d="M38 184c0-36 28-64 62-64s62 28 62 64" fill="%234f46e5"/></svg>`,
  },
  {
    id: 'regular-emerald',
    label: 'Verified Green',
    subtitle: 'High trust attestation',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%23d1fae5"/><circle cx="100" cy="74" r="38" fill="%23059669"/><path d="M38 184c0-36 28-64 62-64s62 28 62 64" fill="%23059669"/></svg>`,
  },
  {
    id: 'regular-dark',
    label: 'Obsidian Dark',
    subtitle: 'High-contrast dark mode',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%231e293b"/><circle cx="100" cy="74" r="38" fill="%2394a3b8"/><path d="M38 184c0-36 28-64 62-64s62 28 62 64" fill="%2394a3b8"/></svg>`,
  },
];

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ user, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'icons'>('upload');
  const initialUrl = isRealAvatarUrl(user.avatarUrl) ? (user.avatarUrl || '') : '';
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render and crop to square via canvas
  const renderProcessedCanvas = useCallback(
    (imgSrc: string, currentZoom: number, currentRotation: number) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.scale(currentZoom, currentZoom);

        const aspect = img.width / img.height;
        let drawW = size;
        let drawH = size;
        if (aspect > 1) {
          drawW = size * aspect;
        } else {
          drawH = size / aspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const outputDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(outputDataUrl);
      };
      img.src = imgSrc;
    },
    []
  );

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('Image file size must be under 12MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRawImageSrc(result);
      setZoom(1);
      setRotation(0);
      renderProcessedCanvas(result, 1, 0);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Support pasting image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          setActiveTab('upload');
          processImageFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, newZoom, rotation);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, zoom, nextRot);
    }
  };

  const handleSelectIcon = (url: string) => {
    setRawImageSrc(null);
    setPreviewUrl(url);
    setError(null);
  };

  const handleClearToProfileIcon = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.uploadAvatar('');
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Failed to reset avatar.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset avatar.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await api.uploadAvatar(previewUrl);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Failed to update avatar.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save avatar image.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Profile Picture</h2>
              <p className="text-xs text-slate-500">Upload your real photo or use standard profile icon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'icons'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Icon Styles</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current & Preview Circle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-1">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full ring-4 ring-indigo-100 overflow-hidden bg-slate-100 shadow-md flex items-center justify-center border border-slate-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-slate-400 stroke-[1.75]" />
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full shadow-xs ring-2 ring-white">
                <Check className="w-3 h-3" />
              </span>
            </div>

            <div className="text-center sm:text-left space-y-0.5">
              <h3 className="font-bold text-slate-900 text-sm">{user.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                {previewUrl ? 'Custom photo active.' : 'Using default profile icon because no custom photo has been uploaded.'}
              </p>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setRawImageSrc(null);
                    setPreviewUrl('');
                  }}
                  className="mt-1 text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove picture and use profile icon</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: UPLOAD REAL IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to choose your photo, or drag and drop
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, or GIF up to 12MB. You can also paste (<kbd className="font-mono">Ctrl+V</kbd>).
                </p>
              </div>

              {rawImageSrc && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                      Zoom & Scale
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE ICON STYLES */}
          {activeTab === 'icons' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Profile Icon Themes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Default Profile Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setRawImageSrc(null);
                      setPreviewUrl('');
                    }}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      !previewUrl
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 shadow-2xs mb-1.5">
                      <UserIcon className="w-6 h-6 text-slate-500" />
                    </div>
                    <span className="font-semibold text-slate-800 text-xs">Default Icon</span>
                    <span className="text-[10px] text-slate-400">Pure Profile Icon</span>
                  </button>

                  {REGULAR_PROFILE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => handleSelectIcon(icon.url)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        previewUrl === icon.url
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <img src={icon.url} alt={icon.label} className="w-12 h-12 rounded-full object-cover shadow-2xs mb-1.5" />
                      <span className="font-semibold text-slate-800 text-xs">{icon.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{icon.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={handleClearToProfileIcon}
                disabled={saving}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Profile Icon</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAvatar}
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Updating...' : 'Save Profile Picture'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
