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
            const html5QrCode = new Html5Qrcode(scannerRef.current.id);
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
                formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
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
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[70%] h-[70%] relative overflow-hidden">
                            {/* Cutout effect */}
                            <div className="absolute -top-1/2 -bottom-1/2 -left-1/2 -right-1/2 shadow-[0_0_0_2000px_rgba(0,0,0,0.5)]"></div>

                            {/* Corner borders */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-white"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-white"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-white"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-white"></div>

                            {/* Scanning laser */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent shadow-[0_0_10px_2px_theme(colors.accent)] animate-scan"></div>
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