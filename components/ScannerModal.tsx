import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './IconComponents';

// Make the global variable available for TypeScript
declare const Html5Qrcode: any;

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess }) => {
    // A ref to the DOM element that will contain the camera view.
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    // A ref to hold the scanner library instance. This is key to avoiding re-initialization.
    const scannerInstanceRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // This effect manages the entire lifecycle of the scanner.
        // It runs only once when the component mounts.

        if (!scannerContainerRef.current) {
            console.error("Scanner container ref is not available.");
            return;
        }

        // We will assign the instance to our ref.
        scannerInstanceRef.current = new Html5Qrcode(scannerContainerRef.current.id);
        const scanner = scannerInstanceRef.current;

        const successCallback = (decodedText: string) => {
            // Ensure we don't process scans after starting to tear down.
            if (scanner && scanner.isScanning) {
                // Stop the scanner immediately on a successful scan.
                scanner.stop()
                    .then(() => {
                        console.log("Scanner stopped on success.");
                        // Only after stopping, call the success handler.
                        onScanSuccess(decodedText);
                    })
                    .catch((err: any) => {
                        console.error("Failed to stop scanner after success.", err);
                        // Still call the handler to ensure functionality.
                        onScanSuccess(decodedText);
                    });
            }
        };

        const errorCallback = (errorMessage: string) => {
            // The library calls this frequently. It's safe to ignore.
        };
        
        const config = {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
                return { width: size, height: size };
            },
        };

        // Start the camera and scanner.
        scanner.start(
            { facingMode: "environment" }, // Use the rear camera
            config,
            successCallback,
            errorCallback
        ).catch((err: any) => {
            console.error("Unable to start scanning.", err);
            setError("Не удалось получить доступ к камере. Проверьте разрешения.");
        });

        // The cleanup function is critical. It runs when the component unmounts.
        return () => {
            const instance = scannerInstanceRef.current;
            if (instance && instance.isScanning) {
                instance.stop()
                    .then(() => console.log("Scanner stopped on cleanup."))
                    .catch((err: any) => console.error("Failed to stop scanner on cleanup.", err));
            }
        };
    }, []); // The empty dependency array is crucial. It ensures this runs only once.
             // We rely on the `onScanSuccess` prop being stable from the parent (`useCallback`).

    return (
        <div 
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-fadeInScaleUp"
        >
            <div id="joysic-qr-reader" ref={scannerContainerRef} className="absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
            
            {error && (
                <div className="absolute inset-0 bg-black flex items-center justify-center p-4 text-center text-red-300 z-10">
                    <p>{error}</p>
                </div>
            )}
            
            {/* Viewfinder UI */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                <div className="w-[80vw] h-[80vw] max-w-sm max-h-sm relative">
                    <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"></div>
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
