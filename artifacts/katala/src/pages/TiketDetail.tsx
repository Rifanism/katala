import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Users, QrCode, Download, CheckCircle, Clock, XCircle, Star } from "lucide-react";
import { useGetTicket } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const statusConfig = {
  valid: { label: "Valid", icon: CheckCircle, color: "#2E8B57", bg: "#ECFDF5" },
  used: { label: "Sudah Digunakan", icon: CheckCircle, color: "#57534E", bg: "#F5F5F4" },
  expired: { label: "Kedaluwarsa", icon: XCircle, color: "#EF4444", bg: "#FEF2F2" },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-8 h-8"
            fill={(hovered || value) >= star ? "#D4AF37" : "none"}
            stroke={(hovered || value) >= star ? "#D4AF37" : "#d6d3d1"}
          />
        </button>
      ))}
    </div>
  );
}

export default function TiketDetail() {
  const [, params] = useRoute("/profil/tiket-saya/:id");
  const id = parseInt(params?.id ?? "0");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Rating state
  const [canRate, setCanRate] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [existingRating, setExistingRating] = useState<{ rating: number; review: string | null } | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const { data: ticket, isLoading } = useGetTicket(id, {
    query: { enabled: !!id, queryKey: ["ticket", id] },
  });

  useEffect(() => {
    if (ticket?.qrCodeData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, ticket.qrCodeData, {
        width: 220,
        margin: 2,
        color: { dark: "#1C1917", light: "#ffffff" },
      });
      QRCode.toDataURL(ticket.qrCodeData, { width: 220, margin: 2 }).then(setQrUrl);
    }
  }, [ticket?.qrCodeData]);

  // Check can-rate
  useEffect(() => {
    if (!ticket?.reservationId || !user) return;
    const token = localStorage.getItem("katala_token");
    fetch(`/api/ratings/can-rate/${ticket.reservationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setCanRate(data.canRate ?? false);
        setAlreadyRated(data.alreadyRated ?? false);
        setExistingRating(data.existingRating ?? null);
        if (data.existingRating) {
          setRatingValue(data.existingRating.rating);
          setReviewText(data.existingRating.review ?? "");
        }
      })
      .catch(() => {});
  }, [ticket?.reservationId, user]);

  const submitRating = async () => {
    if (!ratingValue || !ticket?.reservationId) return;
    setRatingSubmitting(true);
    try {
      const token = localStorage.getItem("katala_token");
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: ticket.reservationId,
          rating: ratingValue,
          review: reviewText || undefined,
        }),
      });
      if (res.ok) {
        setRatingDone(true);
        setAlreadyRated(true);
        setCanRate(false);
        toast({ title: "Terima kasih atas ulasanmu!" });
      } else {
        const err = await res.json();
        toast({ title: "Gagal mengirim ulasan", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal mengirim ulasan", variant: "destructive" });
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-10">
          <div className="h-96 bg-stone-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-stone-500">Tiket tidak ditemukan</p>
          <Link href="/profil/tiket-saya"><Button className="mt-4" variant="outline">Kembali</Button></Link>
        </div>
      </div>
    );
  }

  const dest = ticket.reservation?.destination;
  const cfg = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.valid;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/profil/tiket-saya" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Tiket Saya
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}
        >
          {/* Top section */}
          {dest && (
            <div className="relative h-40 overflow-hidden">
              <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
              <div className="absolute bottom-4 left-5 text-white">
                <h2 className="font-serif text-2xl font-bold">{dest.name}</h2>
                <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {dest.location}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                </div>
              </div>
            </div>
          )}

          {/* Dashed separator */}
          <div className="relative px-6 py-3 flex items-center gap-3 bg-white" style={{ borderTop: "2px dashed #e7e5e4" }}>
            <div className="w-6 h-6 rounded-full bg-stone-50 border border-stone-200 -ml-9 shrink-0" />
            <div className="flex-1 border-t border-dashed border-stone-200" />
            <div className="w-6 h-6 rounded-full bg-stone-50 border border-stone-200 -mr-9 shrink-0" />
          </div>

          {/* Info */}
          <div className="px-6 pb-4 space-y-3 text-sm">
            {ticket.reservation?.visitDate && (
              <div className="flex justify-between">
                <span className="text-stone-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Kunjungan</span>
                <span className="font-medium text-stone-800">
                  {new Date(ticket.reservation.visitDate).toLocaleDateString("id-ID", { dateStyle: "full" })}
                </span>
              </div>
            )}
            {ticket.reservation?.quantity && (
              <div className="flex justify-between">
                <span className="text-stone-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Jumlah Pengunjung</span>
                <span className="font-medium text-stone-800">{ticket.reservation.quantity} orang</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-400">Kode Tiket</span>
              <span className="font-mono font-medium text-stone-800 text-xs">{ticket.ticketCode}</span>
            </div>
            {ticket.usedAt && (
              <div className="flex justify-between">
                <span className="text-stone-400">Digunakan pada</span>
                <span className="font-medium text-stone-600 text-xs">
                  {new Date(ticket.usedAt).toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-6 px-6 bg-stone-50 border-t border-dashed border-stone-200">
            <p className="text-stone-400 text-xs mb-4 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Tunjukkan QR Code ini kepada petugas
            </p>
            <div className="bg-white rounded-xl p-4 shadow-sm" data-testid="qr-code-container">
              <canvas ref={canvasRef} />
            </div>
            {ticket.status === "valid" && qrUrl && (
              <a
                href={qrUrl}
                download={`tiket-${ticket.ticketCode}.png`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700"
                data-testid="btn-download-qr"
              >
                <Download className="w-4 h-4" /> Unduh QR Code
              </a>
            )}
          </div>
        </motion.div>

        {/* Rating section — shown after ticket is used */}
        {ticket.status === "used" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white rounded-2xl p-6"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.07)" }}
          >
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1 flex items-center gap-2">
              <Star className="w-5 h-5" style={{ color: "#D4AF37" }} />
              Beri Ulasan
            </h3>
            <p className="text-stone-500 text-sm mb-5">Bagaimana pengalaman kunjunganmu ke {dest?.name}?</p>

            {alreadyRated || ratingDone ? (
              <div className="text-center py-4">
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-6 h-6"
                      fill={ratingValue >= star ? "#D4AF37" : "none"}
                      stroke={ratingValue >= star ? "#D4AF37" : "#d6d3d1"}
                    />
                  ))}
                </div>
                <p className="text-emerald-600 text-sm font-medium">Ulasan telah dikirim. Terima kasih!</p>
                {(existingRating?.review || reviewText) && (
                  <p className="text-stone-500 text-sm mt-2 italic">"{existingRating?.review || reviewText}"</p>
                )}
              </div>
            ) : canRate ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <StarRating value={ratingValue} onChange={setRatingValue} />
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tulis ulasanmu di sini (opsional)..."
                  rows={3}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 resize-none"
                />
                <Button
                  onClick={submitRating}
                  disabled={!ratingValue || ratingSubmitting}
                  className="w-full text-white font-medium"
                  style={{ backgroundColor: "#8B0000" }}
                >
                  {ratingSubmitting ? "Mengirim..." : "Kirim Ulasan"}
                </Button>
              </div>
            ) : (
              <p className="text-stone-400 text-sm text-center">Ulasan hanya dapat diberikan setelah tiket divalidasi oleh petugas.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
