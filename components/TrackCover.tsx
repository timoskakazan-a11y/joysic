import React from 'react';

interface TrackCoverProps {
  src: string;
  alt: string;
  className?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

const TrackCover = React.forwardRef<HTMLImageElement, TrackCoverProps>(
  ({ src, alt, className, crossOrigin }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={`object-cover ${className || ''}`}
        crossOrigin={crossOrigin}
        loading="lazy"
      />
    );
  }
);

export default TrackCover;