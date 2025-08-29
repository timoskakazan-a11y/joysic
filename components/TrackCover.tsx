
import React, { useState, useEffect, memo } from 'react';
import { ImageAsset } from '../types';
import { MusicNoteIcon } from './IconComponents';

interface TrackCoverProps {
  asset: ImageAsset | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

const TrackCover: React.FC<TrackCoverProps> = memo(({ asset, alt, className, sizes, crossOrigin }) => {
    const [isHQLoaded, setIsHQLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    const placeholderSrc = asset?.small;
    const hqSrc = asset?.large || asset?.full;

    useEffect(() => {
        // Reset loading state when the image source changes
        setIsHQLoaded(false);
        setIsError(!hqSrc && !placeholderSrc);
    }, [hqSrc, placeholderSrc]);

    if (isError || (!placeholderSrc && !hqSrc)) {
        return (
            <div className={`bg-surface-light flex items-center justify-center text-text-secondary ${className || ''}`}>
                <MusicNoteIcon className="w-1/2 h-1/2 opacity-50" />
            </div>
        );
    }

    return (
        <div className={`relative bg-surface-light overflow-hidden ${className || ''}`}>
            {/* Low Quality Image Placeholder (LQIP) - Blurred */}
            {placeholderSrc && (
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHQLoaded ? 'opacity-0' : 'opacity-100'}`}
                    style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
                />
            )}
            
            {/* High-Quality Image */}
            {hqSrc && (
                <img
                    src={hqSrc}
                    alt={alt}
                    crossOrigin={crossOrigin}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHQLoaded ? 'opacity-100' : 'opacity-0'}`}
                    sizes={sizes}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsHQLoaded(true)}
                    onError={() => {
                        console.warn(`Failed to load high-quality image: ${hqSrc}`);
                        if (!placeholderSrc) {
                            setIsError(true);
                        }
                    }}
                />
            )}
        </div>
    );
});

export default TrackCover;