import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, CheckCircle, XCircle, RotateCcw, MapPin, Calendar, Users, Camera, CameraOff } from "lucide-react";
import { useValidateTicket } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ScanResult = {
  valid: boolean;
  message: string;
  ticket?: any;
};

export default function PetugasScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const validateTicket = useValidateTicket();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const processingRef = useRef(false);

  const handleValidate = useCallback(
    (qrData: string) => {
      let ticketCode = qrData.trim();
      try {
        const parsed = JSON.parse(qrData);
        if (parsed?.ticketCode) ticketCode = parsed.ticketCode;
      } catch {
        // raw string
      }
      validateTicket.mutate(
        { data: { ticketCode } },
        {
          onSuccess: (result) => {
            setScanResult({
              valid: result.valid,
              message: result.message,
              ticket: result.ticket,
            });
          },
          onError: (err: any) => {
            setScanResult({
              valid: false,
              message: err?.data?.error ?? "Tiket tidak valid atau tidak ditemukan",
            });
          },
        },
      );
    },
    [validateTicket],
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // jsQR-based scan loop
  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.readyState || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (!processingRef.current) {
      // Dynamically import jsQR to keep bundle light
      try {
        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          processingRef.current = true;
          stopCamera();
          handleValidate(code.data);
          return;
        }
      } catch {
        // jsQR not available, continue
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }, [handleValidate, stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanResult(null);
    processingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser Anda."
          : err?.name === "NotFoundError"
          ? "Kamera tidak ditemukan di perangkat ini."
          : "Gagal mengakses kamera: " + (err?.message ?? "Unknown error");
      setCameraError(msg);
      toast({ title: "Kamera tidak dapat diakses", description: msg, variant: "destructive" });
    }
  }, [tick, toast]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleReset = () => {
    setScanResult(null);
    setCameraError(null);
    processingRef.current = false;
    setManualInput("");
    stopCamera();
  };

  const handleManualValidate = () => {
    if (manualInput.trim()) {
      handleValidate(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8B0000" }}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-white">KATALA Scanner</p>
            <p className="text-xs text-stone-400">Validasi Tiket Wisata</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-stone-300">{user?.name}</p>
          <Link href="/">
            <span className="text-xs text-stone-500 hover:text-stone-400 cursor-pointer">Keluar</span>
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {scanResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: scanResult.valid ? "rgba(46,139,87,0.2)" : "rgba(239,68,68,0.2)" }}
              >
                {scanResult.valid ? (
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                ) : (
                  <XCircle className="w-14 h-14 text-red-400" />
                )}
              </div>

              <h2 className={`font-serif text-3xl font-bold mb-2 ${scanResult.valid ? "text-emerald-400" : "text-red-400"}`}>
                {scanResult.valid ? "Tiket Valid!" : "Tiket Tidak Valid"}
              </h2>
              <p className="text-stone-400 mb-8">{scanResult.message}</p>

              {scanResult.valid && scanResult.ticket && (
                <div className="bg-stone-800 rounded-xl p-5 text-left mb-8 space-y-3">
                  {scanResult.ticket.reservation?.destination && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <div>
                        <p className="text-stone-200 font-medium">{scanResult.ticket.reservation.destination.name}</p>
                        <p className="text-stone-400 text-xs">{scanResult.ticket.reservation.destination.location}</p>
                      </div>
                    </div>
                  )}
                  {scanResult.ticket.reservation?.visitDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-200">
                        {new Date(scanResult.ticket.reservation.visitDate).toLocaleDateString("id-ID", { dateStyle: "full" })}
                      </span>
                    </div>
                  )}
                  {scanResult.ticket.reservation?.quantity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-200">{scanResult.ticket.reservation.quantity} orang</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-700">
                    <p className="text-xs text-stone-500">Kode Tiket</p>
                    <p className="font-mono text-stone-300 text-sm">{scanResult.ticket.ticketCode}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleReset}
                className="gap-2 px-8"
                style={{ backgroundColor: "#8B0000" }}
                data-testid="btn-scan-lagi"
              >
                <RotateCcw className="w-4 h-4" /> Scan Tiket Lagi
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="w-8 h-8 text-stone-300" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-white mb-2">Scan QR Tiket</h1>
                <p className="text-stone-400 text-sm">Arahkan kamera ke QR code pada tiket wisatawan</p>
              </div>

              {/* Camera area */}
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  className={`w-full rounded-xl object-cover bg-stone-800 ${isScanning ? "block" : "hidden"}`}
                  style={{ height: 300 }}
                  playsInline
                  muted
                  data-testid="scanner-video"
                />
                {/* Scan frame overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/60 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#8B0000] rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#8B0000] rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#8B0000] rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#8B0000] rounded-br" />
                      {/* Animated scan line */}
                      <div className="absolute inset-x-0 h-0.5 bg-[#8B0000]/80 animate-bounce" style={{ top: "50%" }} />
                    </div>
                  </div>
                )}
                {/* Hidden canvas for jsQR processing */}
                <canvas ref={canvasRef} className="hidden" />

                {!isScanning && (
                  <div
                    className="w-full h-64 bg-stone-800 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-stone-700 cursor-pointer hover:border-stone-500 transition-colors"
                    onClick={startCamera}
                    data-testid="scanner-preview"
                  >
                    {cameraError ? (
                      <>
                        <CameraOff className="w-12 h-12 text-red-400 mb-3" />
                        <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
                        <p className="text-stone-500 text-xs mt-2">Klik untuk coba lagi</p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-stone-600 mb-3" />
                        <p className="text-stone-500 text-sm">Klik untuk mulai scan kamera</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isScanning ? (
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="w-full border-stone-700 text-stone-300 hover:bg-stone-800"
                  data-testid="btn-stop-scanner"
                >
                  Hentikan Scanner
                </Button>
              ) : (
                <Button
                  onClick={startCamera}
                  className="w-full h-12 text-white font-medium gap-2"
                  style={{ backgroundColor: "#8B0000" }}
                  data-testid="btn-mulai-scan"
                >
                  <Camera className="w-5 h-5" /> Mulai Scan QR Code
                </Button>
              )}

              {/* Manual entry fallback */}
              <div className="mt-8 p-4 bg-stone-800 rounded-xl">
                <p className="text-stone-400 text-xs mb-3 text-center">Atau masukkan kode tiket secara manual:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan kode tiket / data QR..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleManualValidate();
                    }}
                    data-testid="input-manual-qr"
                  />
                  <Button
                    size="sm"
                    style={{ backgroundColor: "#8B0000" }}
                    className="text-white"
                    onClick={handleManualValidate}
                    data-testid="btn-validate-manual"
                  >
                    Cek
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
