import React, { useState } from 'react';
import { User } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  MapPin,
  Globe,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Building2,
  Sparkles,
} from 'lucide-react';

interface UpdateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLocationUpdated: (updatedUser: User) => void;
}

export const UpdateLocationModal: React.FC<UpdateLocationModalProps> = ({
  isOpen,
  onClose,
  user,
  onLocationUpdated,
}) => {
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      setFeedback({ text: 'Geolocation is not supported by your browser.', type: 'error' });
      return;
    }
    setIsDetecting(true);
    setFeedback({ text: 'Accessing GPS coordinates...', type: 'info' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedCity =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.state_district ||
              addr.county ||
              '';
            const detectedCountry = addr.country || '';
            if (detectedCity) setCity(detectedCity);
            if (detectedCountry) setCountry(detectedCountry);
            setFeedback({
              text: `Location confirmed: ${[detectedCity, detectedCountry].filter(Boolean).join(', ')}`,
              type: 'success',
            });
          } else {
            throw new Error('Reverse geocoding timed out');
          }
        } catch {
          // Fallback to timezone estimation
          try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const parts = tz.split('/');
            if (parts.length > 1) {
              const tzCity = parts[1].replace(/_/g, ' ');
              setCity(tzCity);
              setFeedback({ text: `Set location from device timezone: ${tzCity}`, type: 'info' });
            }
          } catch {
            setFeedback({ text: 'Coordinates retrieved, please type city and country.', type: 'error' });
          }
        } finally {
          setIsDetecting(false);
          setTimeout(() => setFeedback(null), 4500);
        }
      },
      (err) => {
        setIsDetecting(false);
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const parts = tz.split('/');
          if (parts.length > 1) {
            const tzCity = parts[1].replace(/_/g, ' ');
            setCity(tzCity);
            setFeedback({
              text: `GPS permission unavailable. Estimated city from timezone: ${tzCity}`,
              type: 'info',
            });
            setTimeout(() => setFeedback(null), 4500);
            return;
          }
        } catch {}
        setFeedback({ text: `Could not retrieve GPS location: ${err.message}`, type: 'error' });
        setTimeout(() => setFeedback(null), 4500);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await api.updateProfile({
        city: city.trim(),
        country: country.trim(),
      });
      onLocationUpdated(res.user);
      setFeedback({ text: 'Location updated successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to update location', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const previewLocation = [city.trim(), country.trim()].filter(Boolean).join(', ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 id="location-modal-title" className="text-base font-bold text-slate-900">
                Update Location in Profile
              </h2>
              <p className="text-xs text-slate-500">
                Update your verified city and country for network discovery and credibility.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Quick Auto-Detect Button */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>One-Tap Auto-Detect</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Use your device GPS or time zone to fill your city and country instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Locating...' : 'Auto-Detect'}</span>
            </button>
          </div>

          {/* Feedback notice if any */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>City Location</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lagos, London, New York"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Country</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria, United Kingdom, United States"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Profile Badge Preview
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-semibold text-xs text-slate-800">@{user.username}</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{previewLocation || 'No location set yet'}</span>
              </span>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (!city.trim() && !country.trim())}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save Location'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
