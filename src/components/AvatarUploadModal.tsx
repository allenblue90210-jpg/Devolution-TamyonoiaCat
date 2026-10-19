import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Check,
  Trash2,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Palette,
  ShieldCheck,
  Link as LinkIcon,
  Video,
  VideoOff,
  Image as ImageIcon,
} from 'lucide-react';

interface AvatarUploadModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

type TabMode = 'upload' | 'camera' | 'create';

interface FilterPreset {
  id: string;
  name: string;
  cssFilter: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { id: 'normal', name: 'Original', cssFilter: 'none' },
  { id: 'crisp', name: 'Crisp', cssFilter: 'contrast(1.15) saturate(1.1)' },
  { id: 'warm', name: 'Warm Exec', cssFilter: 'sepia(0.18) contrast(1.05) brightness(1.03)' },
  { id: 'cool', name: 'Tech Cool', cssFilter: 'hue-rotate(190deg) saturate(1.1) contrast(1.05)' },
  { id: 'mono', name: 'Obsidian B&W', cssFilter: 'grayscale(1) contrast(1.2)' },
];

const GRADIENT_PALETTES = [
  { id: 'indigo', name: 'Indigo Aura', from: '#4338ca', to: '#6366f1', text: '#ffffff' },
  { id: 'cyan', name: 'Aegis Cyber', from: '#0e7490', to: '#06b6d4', text: '#ffffff' },
  { id: 'emerald', name: 'Trust Green', from: '#065f46', to: '#10b981', text: '#ffffff' },
  { id: 'sunset', name: 'Sunset Amber', from: '#c2410c', to: '#f59e0b', text: '#ffffff' },
  { id: 'royal', name: 'Royal Violet', from: '#581c87', to: '#9333ea', text: '#ffffff' },
  { id: 'dark', name: 'Obsidian Shield', from: '#0f172a', to: '#334155', text: '#38bdf8' },
];

const PERSONA_PRESETS = [
  {
    label: 'Systems Architect',
    role: 'Principal Systems Architect',
    url: '/src/assets/images/avatar_founder_1792334631930.jpg',
  },
  {
    label: 'Security Auditor',
    role: 'Lead Cloud Security Auditor',
    url: '/src/assets/images/avatar_sarah_1792334645228.jpg',
  },
  {
    label: 'Operations COO',
    role: 'Chief Operating Officer',
    url: '/src/assets/images/avatar_fatima_1792334658112.jpg',
  },
  {
    label: 'Enterprise Consultant',
    role: 'Managing Partner',
    url: '/src/assets/images/avatar_consultant_1792334644466.jpg',
  },
];

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ user, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || '');
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // Editor transformation controls
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');

  // Generator / Studio states
  const [monogramText, setMonogramText] = useState<string>(
    user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AO'
  );
  const [selectedPalette, setSelectedPalette] = useState<string>('indigo');
  const [monogramStyle, setMonogramStyle] = useState<'sans' | 'mono' | 'serif'>('sans');
  const [ringStyle, setRingStyle] = useState<'gold' | 'emerald' | 'cyan' | 'none'>('emerald');

  // Camera / Webcam states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // General UI states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper to stop camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup camera on unmount or tab switch
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [activeTab, stopCameraStream]);

  // Support clipboard paste (e.g. Cmd+V / Ctrl+V image directly from screenshot or browser)
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

  // Process & draw image onto offscreen high-res canvas
  const renderProcessedCanvas = useCallback(
    (
      imgSrc: string,
      currentZoom: number,
      currentRotation: number,
      flipped: boolean,
      offsetX: number,
      offsetY: number,
      filterId: string
    ) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const size = 512; // High-res 512x512
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        // Apply visual CSS filter
        const filterObj = FILTER_PRESETS.find((f) => f.id === filterId);
        if (filterObj && filterObj.cssFilter !== 'none') {
          ctx.filter = filterObj.cssFilter;
        } else {
          ctx.filter = 'none';
        }

        ctx.save();
        // Center for rotation and scaling
        ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
        ctx.rotate((currentRotation * Math.PI) / 180);
        if (flipped) {
          ctx.scale(-currentZoom, currentZoom);
        } else {
          ctx.scale(currentZoom, currentZoom);
        }

        // Maintain cover aspect ratio
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

        try {
          const outputDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPreviewUrl(outputDataUrl);
        } catch (e: any) {
          console.warn('Canvas export notice:', e.message);
        }
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

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file size must be under 15MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRawImageSrc(result);
      setZoom(1);
      setRotation(0);
      setIsFlipped(false);
      setPanX(0);
      setPanY(0);
      setSelectedFilter('normal');
      renderProcessedCanvas(result, 1, 0, false, 0, 0, 'normal');
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

  const handleLoadFromUrl = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    try {
      // Test image load
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        setRawImageSrc(urlInput.trim());
        renderProcessedCanvas(urlInput.trim(), zoom, rotation, isFlipped, panX, panY, selectedFilter);
      };
      testImg.onerror = () => {
        setError('Unable to load image from this URL. Please verify the URL or upload directly.');
      };
      testImg.src = urlInput.trim();
    } catch {
      setError('Failed to fetch image from URL.');
    }
  };

  // Transformation adjustments
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, newZoom, rotation, isFlipped, panX, panY, selectedFilter);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, zoom, nextRot, isFlipped, panX, panY, selectedFilter);
    }
  };

  const handleFlip = () => {
    const nextFlip = !isFlipped;
    setIsFlipped(nextFlip);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, zoom, rotation, nextFlip, panX, panY, selectedFilter);
    }
  };

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    if (rawImageSrc) {
      renderProcessedCanvas(rawImageSrc, zoom, rotation, isFlipped, panX, panY, filterId);
    }
  };

  // Camera Management
  const startCamera = async (deviceId?: string) => {
    setCameraLoading(true);
    setCameraError(null);
    stopCameraStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: deviceId ? undefined : 'user',
          deviceId: deviceId ? { exact: deviceId } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Enumerate camera video devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Webcam error:', err);
      setCameraError(
        'Unable to access camera. Please ensure camera permissions are allowed in your browser settings.'
      );
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const triggerCaptureCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          captureCameraSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square from video
    const sx = ((video.videoWidth || 640) - size) / 2;
    const sy = ((video.videoHeight || 640) - size) / 2;

    ctx.save();
    // Mirror selfie naturally
    ctx.translate(512, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setRawImageSrc(dataUrl);
    setPreviewUrl(dataUrl);
    stopCameraStream();
    setActiveTab('upload');
    setSuccessToast('Photo captured! You can now adjust zoom, filter, or save.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Avatar Studio / Monogram Generation
  const generateMonogramAvatar = useCallback(
    (text: string, paletteId: string, style: 'sans' | 'mono' | 'serif', ring: string) => {
      const palette = GRADIENT_PALETTES.find((p) => p.id === paletteId) || GRADIENT_PALETTES[0];
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw rich gradient background
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, palette.from);
      grad.addColorStop(1, palette.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // 2. Subtle architectural geometric motif / mesh
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      for (let i = 40; i < size; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Central glowing radial highlight
      const radial = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
      radial.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, size, size);

      // 4. Draw Initials Typography
      ctx.save();
      ctx.fillStyle = palette.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let fontFamily = 'Plus Jakarta Sans, sans-serif';
      if (style === 'mono') fontFamily = 'JetBrains Mono, monospace';
      if (style === 'serif') fontFamily = 'Georgia, serif';

      ctx.font = `bold 190px ${fontFamily}`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;
      ctx.fillText(text.trim() || 'AO', size / 2, size / 2 + 8);
      ctx.restore();

      // 5. Verifiable Security Ring Overlay
      if (ring !== 'none') {
        ctx.save();
        ctx.lineWidth = 14;
        let ringColor = '#10b981'; // emerald
        if (ring === 'gold') ringColor = '#f59e0b';
        if (ring === 'cyan') ringColor = '#06b6d4';

        ctx.strokeStyle = ringColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      const generatedUrl = canvas.toDataURL('image/png');
      setPreviewUrl(generatedUrl);
      setRawImageSrc(null);
    },
    []
  );

  const handleApplyPersona = (url: string) => {
    setRawImageSrc(null);
    setPreviewUrl(url);
    setError(null);
    setSuccessToast('Persona portrait selected.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleResetToInitials = () => {
    generateMonogramAvatar(monogramText, selectedPalette, monogramStyle, ringStyle);
    setSuccessToast('Reset to custom monogram avatar.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Submit and persist avatar to backend
  const handleSaveAvatar = async () => {
    if (!previewUrl) {
      setError('Please choose, create, or capture an avatar first.');
      return;
    }

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Hidden Canvas for High-Resolution Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Profile Picture Studio</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Verifiable Avatar
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Create, capture, design, or upload your photo for {user.fullName} (@{user.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload & Edit</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Photo (Webcam)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('create');
                generateMonogramAvatar(monogramText, selectedPalette, monogramStyle, ringStyle);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Design / Generator</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Direct sync with GitHub</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Central Preview Cluster (Live View) */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Main Avatar 100px */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-indigo-200/80 overflow-hidden bg-white shadow-md flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center">
                      {monogramText}
                    </div>
                  )}
                </div>
                <span
                  className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full shadow-xs ring-2 ring-white"
                  title="Cryptographic Ledger Verified"
                >
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>

              {/* Context Info */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{user.fullName}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    @{user.username}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-xs">{user.headline}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-emerald-700 font-semibold pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time cross-platform update</span>
                </div>
              </div>
            </div>

            {/* Context Multi-Size Preview Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5 text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                In-app preview:
              </span>
              <div className="flex items-center gap-3">
                {/* 32px nav icon */}
                <div
                  className="w-8 h-8 rounded-full ring-2 ring-indigo-300 overflow-hidden shadow-2xs bg-white"
                  title="Navigation bar scale (32px)"
                >
                  {previewUrl && <img src={previewUrl} alt="nav" className="w-full h-full object-cover" />}
                </div>
                {/* 44px card icon */}
                <div
                  className="w-11 h-11 rounded-full ring-2 ring-emerald-300 overflow-hidden shadow-2xs bg-white"
                  title="Trust Receipt & Ledger scale (44px)"
                >
                  {previewUrl && <img src={previewUrl} alt="card" className="w-full h-full object-cover" />}
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: UPLOAD & EDIT */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse image, or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WEBP, GIF, or paste directly with{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-mono">
                    Ctrl + V
                  </kbd>
                </p>
              </div>

              {/* Direct Web Image URL Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Or paste an image URL (e.g. https://...)"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLoadFromUrl}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                >
                  Load URL
                </button>
              </div>

              {/* Image Editor Controls (Visible when image is loaded) */}
              {rawImageSrc && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Adjust, Zoom & Align
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Zoom: {Math.round(zoom * 100)}% · Angle: {rotation}°
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Zoom Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-slate-400" />
                          Scale
                        </span>
                        <span>{zoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.5"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Quick Transform Buttons */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={handleRotate}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Rotate 90 degrees clockwise"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Rotate 90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFlip}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                          isFlipped
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Mirror horizontally"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5 text-slate-600" />
                        <span>Flip Mirror</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Tone Selection */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Color Filter Tone
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {FILTER_PRESETS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleFilterSelect(f.id)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                            selectedFilter === f.id
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TAKE PHOTO (WEBCAM) */}
          {activeTab === 'camera' && (
            <div className="space-y-5">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video sm:aspect-4/3 max-w-md mx-auto flex items-center justify-center shadow-lg">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${
                    cameraActive ? 'block' : 'hidden'
                  }`}
                />

                {/* Shutter Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-20">
                    <span className="text-white text-7xl font-bold animate-ping">{countdown}</span>
                  </div>
                )}

                {/* Circular Framing Guide */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                  </div>
                )}

                {/* Loading / Inactive States */}
                {!cameraActive && (
                  <div className="text-center p-6 text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    {cameraLoading ? (
                      <p className="text-xs text-slate-300">Accessing camera hardware...</p>
                    ) : cameraError ? (
                      <div className="space-y-2">
                        <p className="text-xs text-rose-400">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300">Click below to start camera</p>
                    )}
                  </div>
                )}
              </div>

              {/* Camera Shutter & Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                {cameraActive ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={triggerCaptureCountdown}
                      disabled={countdown !== null}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{countdown !== null ? `Capturing in ${countdown}...` : 'Snap Photo (3s Timer)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={captureCameraSnapshot}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-xs font-semibold cursor-pointer"
                    >
                      Instant Snap
                    </button>

                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
                      title="Turn off camera"
                    >
                      <VideoOff className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Video className="w-4 h-4" />
                    <span>Launch Camera</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE & DESIGN (AVATAR STUDIO) */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Monogram Generator */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    Monogram & Verifiable Trust Seal
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToInitials}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Re-render Monogram
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Initials Text */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Initials (Max 3 Chars)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={monogramText}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setMonogramText(val);
                        generateMonogramAvatar(val, selectedPalette, monogramStyle, ringStyle);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-900 bg-white"
                    />
                  </div>

                  {/* Typography Font */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Font Typography
                    </label>
                    <select
                      value={monogramStyle}
                      onChange={(e) => {
                        const style = e.target.value as any;
                        setMonogramStyle(style);
                        generateMonogramAvatar(monogramText, selectedPalette, style, ringStyle);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white"
                    >
                      <option value="sans">Bold Modern Sans</option>
                      <option value="mono">Tech Monospace</option>
                      <option value="serif">Classic Editorial Serif</option>
                    </select>
                  </div>

                  {/* Trust Ring */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ledger Trust Ring
                    </label>
                    <select
                      value={ringStyle}
                      onChange={(e) => {
                        const ring = e.target.value as any;
                        setRingStyle(ring);
                        generateMonogramAvatar(monogramText, selectedPalette, monogramStyle, ring);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white"
                    >
                      <option value="emerald">Emerald Attestation Ring</option>
                      <option value="gold">Sovereign Gold Ring</option>
                      <option value="cyan">Aegis Cyber Cyan</option>
                      <option value="none">No Ring</option>
                    </select>
                  </div>
                </div>

                {/* Color Gradient Themes */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Gradient Aura Palette
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {GRADIENT_PALETTES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPalette(p.id);
                          generateMonogramAvatar(monogramText, p.id, monogramStyle, ringStyle);
                        }}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedPalette === p.id
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-200 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow-2xs"
                          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                        />
                        <span className="text-[10px] font-medium text-slate-700 truncate w-full">
                          {p.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Persona / Executive Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Or Pick High-Definition Executive Persona
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PERSONA_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPersona(p.url)}
                      className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        previewUrl === p.url
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        className="w-14 h-14 rounded-full object-cover shadow-2xs mb-2 border border-slate-200"
                      />
                      <span className="font-bold text-slate-800 text-xs">{p.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{p.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToInitials}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset to Default Monogram</span>
          </button>

          <div className="flex items-center gap-3">
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Publishing & Syncing...' : 'Save & Publish Profile Picture'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
