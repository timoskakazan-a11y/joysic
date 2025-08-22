
import React, { useEffect, useRef } from 'react';

declare const lottie: any;

interface LottieIconProps {
  animationData: any;
  isPlaying: boolean;
  className?: string;
}

const LottieIcon: React.FC<LottieIconProps> = ({ animationData, isPlaying, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (typeof lottie === 'undefined') {
        console.error('Lottie library not loaded');
        return;
    }
    if (containerRef.current) {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: animationData,
      });
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [animationData]);

  useEffect(() => {
    if (animRef.current) {
      if (isPlaying) {
        animRef.current.play();
      } else {
        animRef.current.stop();
      }
    }
  }, [isPlaying]);

  return <div ref={containerRef} className={className} />;
};

export default LottieIcon;
