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
                    return {
                        width: edge * 0.7,
                        height: edge * 0.7
                    };
                },
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4 animate-fadeInScaleUp"
            onClick={onClose}
        >
            <div 
                className="relative bg-black rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-surface-light flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center p-4 z-20">
                    <h2 className="text-lg font-bold text-primary">Сканировать Joycode</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-primary transition-colors p-1">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="relative w-full aspect-square">
                    <div id="qr-reader" ref={scannerRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
                    {error && <div className="absolute inset-0 bg-background flex items-center justify-center p-4 text-center text-red-400">{error}</div>}
                    
                    {/* Viewfinder overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                        <div className="w-[70%] h-[70%] relative">
                            <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>

                            {/* Corner borders */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/90"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/90"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/90"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/90"></div>

                            {/* Scanning laser */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_15px_2px_theme(colors.accent)] animate-scan"></div>
                        </div>
                    </div>
                </div>

                <footer className="h-16 flex items-center justify-center text-center p-4 bg-black">
                    <p className="text-text-secondary">Наведите камеру на Joycode</p>
                </footer>
            </div>
        </div>
    );
};

export default ScannerModal;
