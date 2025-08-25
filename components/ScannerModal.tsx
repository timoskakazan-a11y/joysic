import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './IconComponents';

declare const Html5Qrcode: any;
declare const Html5QrcodeSupportedFormats: any;

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (scannerRef.current && typeof Html5Qrcode !== 'undefined') {
            const html5QrCode = new Html5Qrcode(scannerRef.current.id, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const edge = Math.min(viewfinderWidth, viewfinderHeight);
                    const size = edge * 0.8; 
                    return {
                        width: size,
                        height: size
                    };
                },
                aspectRatio: 1.0,
            };

            const successCallback = (decodedText: string, decodedResult: any) => {
                if (html5QrCodeRef.current?.isScanning) {
                    html5QrCodeRef.current.stop();
                }
                onScanSuccess(decodedText);
            };

            const errorCallback = (errorMessage: string) => {
                // handle scan failure, usually ignore
            };

            const startScanner = async () => {
                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        successCallback,
                        errorCallback
                    );
                } catch (err: any) {
                    console.error("Camera Error:", err);
                    setError("Не удалось получить доступ к камере. Проверьте разрешения в настройках браузера.");
                }
            };

            startScanner();

            return () => {
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner:", err));
                }
            };
        }
    }, [onScanSuccess]);

    return (
        <div 
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-fadeInScaleUp"
        >
            <div id="qr-reader" ref={scannerRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
            {error && <div className="absolute inset-0 bg-black flex items-center justify-center p-4 text-center text-red-300">{error}</div>}
            
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                <div className="w-[80vw] h-[80vw] max-w-sm max-h-sm relative">
                    <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"></div>

                    {/* Corner borders - simplified and rounded */}
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white/90 rounded-tl-2xl"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white/90 rounded-tr-2xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white/90 rounded-bl-2xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white/90 rounded-br-2xl"></div>
                </div>
            </div>

            <button onClick={onClose} className="absolute top-6 right-6 z-20 bg-black/50 rounded-full p-2 text-white hover:bg-black/75 transition-colors" aria-label="Close scanner">
                <CloseIcon className="w-7 h-7" />
            </button>

            <p className="absolute bottom-10 left-0 right-0 text-center text-white text-lg z-20 drop-shadow-md pointer-events-none">
                Наведите камеру на Joycode
            </p>
        </div>
    );
};

export default ScannerModal;