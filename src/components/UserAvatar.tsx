import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

export function isRealAvatarUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Ignore legacy fake generated avatar assets
  if (
    trimmed.includes('/avatar_founder_') ||
    trimmed.includes('/avatar_sarah_') ||
    trimmed.includes('/avatar_fatima_') ||
    trimmed.includes('/avatar_consultant_') ||
    trimmed.includes('/avatar_marcus_') ||
    trimmed.includes('/avatar_elena_') ||
    trimmed.includes('/avatar_david_')
  ) {
    return false;
  }
  return true;
}

interface UserAvatarProps {
  src?: string | null;
  avatarUrl?: string | null;
  name?: string;
  className?: string;
  iconClassName?: string;
  alt?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  avatarUrl,
  name,
  className = 'w-8 h-8 rounded-full',
  iconClassName,
  alt = 'Profile',
}) => {
  const [hasError, setHasError] = useState(false);
  const effectiveSrc = src || avatarUrl;

  useEffect(() => {
    setHasError(false);
  }, [effectiveSrc]);

  const valid = !hasError && isRealAvatarUrl(effectiveSrc);

  if (valid && effectiveSrc) {
    return (
      <img
        src={effectiveSrc}
        alt={alt || name || 'User profile'}
        onError={() => setHasError(true)}
        className={`${className} object-cover`}
      />
    );
  }

  // Profile icon fallback when no real image is uploaded
  return (
    <div
      className={`${className} flex items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 shrink-0 select-none overflow-hidden`}
      title={name || alt}
      aria-label={name || alt}
    >
      <UserIcon className={iconClassName || 'w-1/2 h-1/2 text-slate-500 stroke-[2]'} />
    </div>
  );
};
