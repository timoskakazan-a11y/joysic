import React, { useState, useEffect } from 'react';
import { ImageAsset } from '../types';
import { MusicNoteIcon } from './IconComponents';

interface TrackCoverProps {
  asset: ImageAsset | null | undefined;
  alt: string;
  className?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

const TrackCover = React.forwardRef<HTMLImageElement, TrackCoverProps>(
  ({ asset, alt, className, crossOrigin }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const placeholderSrc = asset?.small;
    const fullSrc = asset?.full;

    useEffect(() => {
      // Reset loaded state when asset changes
      setIsLoaded(false);
      if (fullSrc) {
        const img = new Image();
        img.src = fullSrc;
        img.onload = () => {
          setIsLoaded(true);
        };
      }
    }, [fullSrc]);

    if (!fullSrc) {
      return (
        <div className={`bg-surface-light flex items-center justify-center text-text-secondary ${className || ''}`}>
          <MusicNoteIcon className="w-1/2 h-1/2 opacity-50" />
        </div>
      );
    }

    return (
      <div ref={ref as any} className={`relative bg-surface-light overflow-hidden ${className || ''}`}>
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
            style={{ filter: 'blur(20px)', transform: 'scale(1.15)' }}
          />
        )}
        <img
          src={fullSrc}
          alt={alt}
          crossOrigin={crossOrigin}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
);

export default TrackCover;