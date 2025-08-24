import React, { useEffect, useRef } from 'react';

declare const QRCode: any;

interface BarcodeProps {
  value: string;
  className?: string;
  options?: any;
}

const Barcode: React.FC<BarcodeProps> = ({ value, className, options }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && typeof QRCode !== 'undefined') {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 192,
        color: {
          dark: '#e5e7eb',
          light: '#00000000'
        },
        errorCorrectionLevel: 'H',
        ...options
      }, function (error: any) {
        if (error) console.error("QRCode generation error:", error);
      });
    }
  }, [value, options]);

  return <canvas ref={canvasRef} className={className} />;
};

export default Barcode;