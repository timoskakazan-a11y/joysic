import React, { useEffect, useRef, useState } from 'react';

declare const Html5Qrcode: any;

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

            const startScanner = async () => {
                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
                                width: Math.min(viewfinderWidth, viewfinderHeight) * 0.8,
                                height: Math.min(viewfinderWidth, viewfinderHeight) * 0.8
                            }),
                            aspectRatio: 1.0
                        },
                        (decodedText: string, decodedResult: any) => {
                            html5QrCode.stop();
                            onScanSuccess(decodedText);
                        },
                        (errorMessage: string) => {
                            // handle scan failure, usually ignore
                        }
                    );
                } catch (err: any) {
                    console.error("Camera Error:", err);
                    setError("Не удалось получить доступ к камере. Проверьте разрешения в настройках браузера.");
                    // Fallback for devices without back camera
                    if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
                       // Do nothing specific, error message is shown
                    } else {
                        // try front camera if back fails
                         try {
                            await html5QrCode.start(
                                { facingMode: "user" },
                                { fps: 10, qrbox: { width: 250, height: 250 } },
                                (decodedText: string) => {
                                    html5QrCode.stop();
                                    onScanSuccess(decodedText);
                                },
                                () => {}
                            );
                        } catch (frontErr) {
                             console.error("Front Camera Error:", frontErr);
                        }
                    }
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
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center animate-fadeInScaleUp" onClick={onClose}>
            <div className="relative bg-surface rounded-3xl w-full max-w-md aspect-square overflow-hidden shadow-2xl m-4" onClick={e => e.stopPropagation()}>
                <div id="qr-reader" ref={scannerRef} className="w-full h-full"></div>
                {error && <div className="absolute inset-0 bg-background flex items-center justify-center p-4 text-center text-red-400">{error}</div>}
                 <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30 rounded-3xl"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] pointer-events-none rounded-2xl shadow-[0_0_0_4px_rgba(255,255,255,0.2)]">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
            </div>
            <p className="text-white mt-4">Наведите камеру на Joycode</p>
        </div>
    );
};

export default ScannerModal;
