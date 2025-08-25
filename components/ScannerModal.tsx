import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './IconComponents';

// Make the global variable available for TypeScript
declare const Html5Qrcode: any;

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const scannerContainerId = "joysic-qr-reader";
    const scannerInstanceRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // This effect manages the entire lifecycle of the scanner.
        
        const scanner = new Html5Qrcode(scannerContainerId, false);
        scannerInstanceRef.current = scanner;

        const successCallback = (decodedText: string) => {
            const instance = scannerInstanceRef.current;
            if (instance && instance.isScanning) {
                instance.stop()
                    .then(() => {
                        console.log("Scanner stopped on success.");
                        onScanSuccess(decodedText);
                    })
                    .catch((err: any) => {
                        console.error("Failed to stop scanner after success.", err);
                        onScanSuccess(decodedText); // Proceed even if stopping fails
                    });
            }
        };

        const errorCallback = (errorMessage: string) => {
            // This callback is called frequently, it's safe to ignore most "errors" as the library tries to decode frames.
        };
        
        const config = {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
                return { width: size, height: size };
            },
        };
        
        // Start the scanner, requesting the rear camera ('environment').
        // This is the most reliable method for mobile devices.
        scanner.start(
            { facingMode: 'environment' },
            config,
            successCallback,
            errorCallback
        ).catch((err: any) => {
            console.warn("Failed to start with rear camera, trying any camera as a fallback.", err);
            // If the rear camera fails (e.g., on a desktop), fallback to any available camera.
            scanner.start(
                undefined, // `undefined` lets the library select the default camera.
                config,
                successCallback,
                errorCallback
            ).catch((fallbackErr: any) => {
                console.error("Unable to start scanner with any camera.", fallbackErr);
                setError("Не удалось запустить камеру. Проверьте разрешения в настройках браузера.");
            });
        });


        // The cleanup function is critical. It runs when the component unmounts.
        return () => {
            const instance = scannerInstanceRef.current;
            if (instance && instance.isScanning) {
                instance.stop().catch((err: any) => {
                    console.error("Failed to stop scanner on cleanup.", err);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <div 
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-fadeInScaleUp"
        >
            {/* The element for the scanner video feed */}
            <div id={scannerContainerId} className="absolute inset-0 w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
            
            {/* Error Display */}
            {error && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center z-10">
                    <div className="bg-surface p-6 rounded-lg">
                        <p className="text-red-300 font-semibold mb-4">Ошибка сканера</p>
                        <p className="text-text-secondary text-sm">{error}</p>
                    </div>
                </div>
            )}
            
            {/* Viewfinder UI */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                <div className="w-[80vw] h-[80vw] max-w-sm max-h-sm relative">
                    {/* This creates the dark overlay *outside* the square */}
                    <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"></div>
                    {/* Corner markers */}
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