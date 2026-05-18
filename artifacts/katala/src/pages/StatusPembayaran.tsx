import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, Ticket, Home, RefreshCw } from "lucide-react";
import { useGetPaymentStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

export default function StatusPembayaran() {
  const urlParams = new URLSearchParams(window.location.search);
  const statusParam = urlParams.get("status");
  const [polling, setPolling] = useState(true);

  const reservationIdStr = sessionStorage.getItem("payment_reservation_id");
  const reservationId = reservationIdStr ? parseInt(reservationIdStr) : 0;

  const { data: transaction } = useGetPaymentStatus(reservationId, {
    query: {
      enabled: !!reservationId && !statusParam,
      queryKey: ["payment-status", reservationId],
      refetchInterval: polling ? 3000 : false,
    },
  });

  useEffect(() => {
    if (transaction?.status && ["paid", "failed", "expired"].includes(transaction.status)) {
      setPolling(false);
    }
  }, [transaction?.status]);

  const status = statusParam ?? transaction?.status ?? "pending";

  const statusConfig = {
    paid: {
      icon: CheckCircle, color: "#2E8B57", bg: "#ECFDF5",
      title: "Pembayaran Berhasil!",
      desc: "Tiket digital Anda telah diterbitkan. Silakan cek di menu Tiket Saya.",
    },
    pending: {
      icon: Clock, color: "#F59E0B", bg: "#FFFBEB",
      title: "Menunggu Pembayaran",
      desc: "Pembayaran Anda sedang diproses. Halaman ini akan diperbarui otomatis.",
    },
    failed: {
      icon: XCircle, color: "#EF4444", bg: "#FEF2F2",
      title: "Pembayaran Gagal",
      desc: "Terjadi kesalahan dalam pembayaran. Silakan coba kembali.",
    },
    expired: {
      icon: XCircle, color: "#EF4444", bg: "#FEF2F2",
      title: "Pembayaran Kedaluwarsa",
      desc: "Waktu pembayaran telah habis. Reservasi Anda dibatalkan otomatis.",
    },
  };

  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: cfg.bg }}>
            <Icon className="w-12 h-12" style={{ color: cfg.color }} />
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-3">{cfg.title}</h1>
          <p className="text-stone-500 mb-8">{cfg.desc}</p>

          {status === "pending" && polling && (
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm mb-6">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Memeriksa status pembayaran...
            </div>
          )}

          {/* Expiry info */}
          {(transaction as any)?.expiresAt && status === "pending" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-700">
              <p className="font-medium">Batas waktu pembayaran:</p>
              <p>{new Date((transaction as any)?.expiresAt).toLocaleString("id-ID")}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {status === "paid" && (
              <Link href="/profil/tiket-saya">
                <Button className="text-white gap-2" style={{ backgroundColor: "#8B0000" }} data-testid="btn-lihat-tiket">
                  <Ticket className="w-4 h-4" /> Lihat Tiket Saya
                </Button>
              </Link>
            )}
            {(status === "failed" || status === "expired") && (
              <Link href="/destinasi">
                <Button className="text-white gap-2" style={{ backgroundColor: "#8B0000" }}>
                  Pesan Lagi
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="btn-kembali-beranda">
                <Home className="w-4 h-4" /> Beranda
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
