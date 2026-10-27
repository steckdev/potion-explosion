import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { playBloop, playNfcHum } from '../utils/audio';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeDetected: (code: string) => void;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  isOpen,
  onClose,
  onCodeDetected
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    detectedRef.current = false;
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    detectedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Camera access is not supported by this browser. You can use your phone’s built-in Camera app or NFC!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        startDetectionLoop();
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      setErrorMessage('Camera access was denied or is unavailable. Please allow camera access in browser settings, or use your phone’s native Camera app!');
    }
  };

  const startDetectionLoop = () => {
    // Check if BarcodeDetector is natively available
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      // BarcodeDetector not supported directly in this browser version
      // The camera will display the viewfinder, but detection requires native camera or fallback
      return;
    }

    let detector: { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } | null = null;
    try {
      detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
    } catch (e) {
      console.debug('Failed to construct BarcodeDetector', e);
      return;
    }

    let lastCheckTime = 0;

    const tick = async (now: number) => {
      if (detectedRef.current || !videoRef.current || !detector) return;

      // Throttle detection to ~8 FPS to save phone battery
      if (now - lastCheckTime > 120 && videoRef.current.readyState >= 2) {
        lastCheckTime = now;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && !detectedRef.current) {
            const code = barcodes[0].rawValue;
            if (code) {
              detectedRef.current = true;
              playBloop(1.2);
              playNfcHum(1.0);
              stopCamera();
              onCodeDetected(code);
              return;
            }
          }
        } catch {
          // Frame drop or detection skip
        }
      }

      if (!detectedRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(5, 3, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c081e',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.3), 0 20px 45px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgba(56, 189, 248, 0.2), rgba(9, 7, 20, 0.8))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={18} color="#38bdf8" />
            </div>
            <div>
              <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                QR Code Scanner
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                Point camera at wall poster or card
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              playBloop(0.9);
              stopCamera();
              onClose();
            }}
            aria-label="Close camera scanner"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '320px',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {/* Viewfinder Reticle Overlay */}
          {isScanning && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              {/* Target Box */}
              <div style={{
                width: '210px',
                height: '210px',
                border: '2px solid rgba(56, 189, 248, 0.8)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 20px rgba(56, 189, 248, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Laser scan line animation */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8, 0 0 20px #38bdf8',
                  animation: 'laserScan 2s infinite ease-in-out'
                }} />

                {/* 4 Corner Markers */}
                <div style={{ position: 'absolute', top: '4px', left: '4px', width: '16px', height: '16px', borderTop: '3px solid #ffbe0b', borderLeft: '3px solid #ffbe0b' }} />
                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', borderTop: '3px solid #ffbe0b', borderRight: '3px solid #ffbe0b' }} />
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '16px', height: '16px', borderBottom: '3px solid #ffbe0b', borderLeft: '3px solid #ffbe0b' }} />
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderBottom: '3px solid #ffbe0b', borderRight: '3px solid #ffbe0b' }} />
              </div>
            </div>
          )}

          {/* Error / Fallback Message */}
          {errorMessage && (
            <div style={{
              position: 'absolute',
              inset: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f8fafc',
              gap: '0.75rem'
            }}>
              <AlertCircle size={32} color="#f87171" />
              <div style={{ fontSize: '0.88rem', lineHeight: 1.4, color: '#e2e8f0' }}>
                {errorMessage}
              </div>
              <button
                onClick={() => {
                  playBloop(1.1);
                  startCamera();
                }}
                style={{
                  backgroundColor: '#38bdf8',
                  color: '#090714',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem'
                }}
              >
                <RefreshCw size={14} />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#94a3b8'
        }}>
          <div>
            💡 <strong style={{ color: '#ffbe0b' }}>Explorer Tip:</strong> You can also point your phone's native <strong style={{ color: '#f8fafc' }}>Camera App</strong> at any card poster or tap with <strong style={{ color: '#39ff14' }}>NFC</strong>!
          </div>
        </div>
      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 4px; opacity: 0.8; }
          50% { top: 200px; opacity: 1; }
          100% { top: 4px; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
