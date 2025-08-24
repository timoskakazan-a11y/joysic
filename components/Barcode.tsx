import React, { useEffect, useRef } from 'react';

declare const JsBarcode: any;

interface BarcodeProps {
  value: string;
  className?: string;
  options?: any;
}

const Barcode: React.FC<BarcodeProps> = ({ value, className, options }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          lineColor: '#e5e7eb',
          background: 'transparent',
          width: 3,
          height: 80,
          displayValue: false,
          margin: 10,
          ...options,
        });
      } catch (e) {
        console.error("JsBarcode error:", e);
      }
    }
  }, [value, options]);

  return <canvas ref={canvasRef} className={className} />;
};

export default Barcode;