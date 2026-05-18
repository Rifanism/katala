import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Users, CreditCard, Clock, QrCode } from "lucide-react";
import { useCreatePayment, useGetPaymentStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import QRCode from "qrcode";

function CountdownTimer({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(diff);
      if (diff === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpired();
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const urgent = remaining < 3 * 60 * 1000;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${urgent ? "text-red-500" : "text-amber-600"}`}>
      <Clock className="w-5 h-5" />
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const createPayment = useCreatePayment();

  const reservationJson = sessionStorage.getItem("checkout_reservation");
  const reservation = reservationJson ? JSON.parse(reservationJson) : null;
  const dest = reservation?.destination;

  const [paymentData, setPaymentData] = useState<{
    orderId: string;
    snapToken: string | null;
    expiresAt: string;
    demoMode: boolean;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expired, setExpired] = useState(false);

  const reservationId = reservation?.id ?? 0;
  const { data: txStatus } = useGetPaymentStatus(reservationId, {
    query: {
      enabled: !!paymentData && !expired,
      queryKey: ["payment-status-checkout", reservationId],
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (txStatus?.status === "paid") {
      sessionStorage.removeItem("checkout_reservation");
      setLocation("/pemesanan/status-pembayaran?status=paid");
    }
  }, [txStatus?.status, setLocation]);

  useEffect(() => {
    if (!reservation) return;
    if (["expired", "failed", "cancelled"].includes(reservation.status)) {
      sessionStorage.removeItem("checkout_reservation");
      toast({ title: "Reservasi tidak valid", description: "Silakan buat reservasi baru.", variant: "destructive" });
      setLocation("/destinasi");
    }
  }, []);

  useEffect(() => {
    if (!reservation?.id) return;
    const savedOrderId = sessionStorage.getItem("payment_order_id");
    const savedExpiry = sessionStorage.getItem("payment_expires_at");
    const savedResvId = sessionStorage.getItem("payment_reservation_id");
    if (
      savedOrderId && savedExpiry && savedResvId &&
      parseInt(savedResvId) === reservation.id &&
      new Date(savedExpiry).getTime() > Date.now()
    ) {
      const pd = {
        orderId: savedOrderId,
        snapToken: null,
        expiresAt: savedExpiry,
        demoMode: true,
      };
      setPaymentData(pd);
      QRCode.toDataURL(
        JSON.stringify({ type: "KATALA_PAYMENT", orderId: savedOrderId, amount: reservation.totalPrice, expiresAt: savedExpiry }),
        { width: 240, margin: 2, color: { dark: "#1C1917", light: "#ffffff" } }
      ).then(setQrDataUrl);
    }
  }, []);

  useEffect(() => {
    if (paymentData?.orderId) {
      QRCode.toDataURL(
        JSON.stringify({ type: "KATALA_PAYMENT", orderId: paymentData.orderId, amount: reservation?.totalPrice, expiresAt: paymentData.expiresAt }),
        { width: 240, margin: 2, color: { dark: "#1C1917", light: "#ffffff" } }
      ).then(setQrDataUrl);
    }
  }, [paymentData?.orderId]);

  const handleExpired = () => {
    setExpired(true);
    sessionStorage.removeItem("payment_order_id");
    sessionStorage.removeItem("payment_expires_at");
    sessionStorage.removeItem("payment_reservation_id");
    sessionStorage.removeItem("checkout_reservation");
    toast({ title: "Waktu pembayaran habis!", description: "Reservasi dibatalkan. Silakan buat reservasi baru.", variant: "destructive" });
    setTimeout(() => setLocation("/destinasi"), 2000);
  };

  const handlePay = () => {
    if (!reservation) return;
    createPayment.mutate(
      { data: { reservationId: reservation.id } },
      {
        onSuccess: (data: any) => {
          if (data.error) {
            // Expired transaction response
            sessionStorage.removeItem("checkout_reservation");
            toast({ title: "Reservasi kedaluwarsa", description: data.error, variant: "destructive" });
            setLocation("/destinasi");
            return;
          }
          const pd = {
            orderId: data.orderId,
            snapToken: data.snapToken ?? null,
            expiresAt: data.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            demoMode: data.demoMode ?? (!data.snapToken || !!(data.snapToken?.startsWith("DEMO_"))),
          };
          sessionStorage.setItem("payment_order_id", pd.orderId);
          sessionStorage.setItem("payment_reservation_id", String(reservation.id));
          sessionStorage.setItem("payment_expires_at", pd.expiresAt);

          const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
          if (clientKey && pd.snapToken && !pd.demoMode) {
            const script = document.createElement("script");
            script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
            script.setAttribute("data-client-key", clientKey);
            script.onload = () => {
              (window as any).snap.pay(pd.snapToken, {
                onSuccess: () => { sessionStorage.removeItem("checkout_reservation"); setLocation("/pemesanan/status-pembayaran?status=paid"); },
                onPending: () => setLocation("/pemesanan/status-pembayaran?status=pending"),
                onError: () => { sessionStorage.removeItem("checkout_reservation"); setLocation("/pemesanan/status-pembayaran?status=failed"); },
                onClose: () => toast({ title: "Pembayaran dibatalkan" }),
              });
            };
            document.body.appendChild(script);
          } else {
            setPaymentData(pd);
          }
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Gagal membuat transaksi";
          if (msg.toLowerCase().includes("kadaluwarsa") || msg.toLowerCase().includes("expired")) {
            sessionStorage.removeItem("checkout_reservation");
            setLocation("/destinasi");
          }
          toast({ title: "Pembayaran gagal", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleSimulateSuccess = async () => {
    if (!paymentData?.orderId) return;
    try {
      const token = localStorage.getItem("katala_token");
      const res = await fetch("/api/payments/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: paymentData.orderId }),
      });
      if (res.ok) {
        sessionStorage.removeItem("checkout_reservation");
        sessionStorage.removeItem("payment_order_id");
        sessionStorage.removeItem("payment_expires_at");
        sessionStorage.removeItem("payment_reservation_id");
        setLocation("/pemesanan/status-pembayaran?status=paid");
      } else {
        toast({ title: "Gagal simulasi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal simulasi", variant: "destructive" });
    }
  };

  if (!reservation || !dest) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-stone-500">Tidak ada reservasi yang aktif</p>
          <Link href="/destinasi"><Button className="mt-4" variant="outline">Cari Destinasi</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {!paymentData && (
          <Link href="/pemesanan/form-reservasi" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Konfirmasi Pembayaran</h1>

          {/* Order summary */}
          <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden mb-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div className="flex gap-4 p-5 border-b border-stone-100">
              <img src={dest.imageUrl} alt={dest.name} className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <h3 className="font-serif font-semibold text-stone-900 text-lg">{dest.name}</h3>
                <div className="flex items-center gap-1 text-stone-500 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {dest.location}
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-500"><Calendar className="w-4 h-4" /> Tanggal Kunjungan</div>
                <span className="font-medium text-stone-800">{new Date(reservation.visitDate).toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-500"><Users className="w-4 h-4" /> Jumlah Tiket</div>
                <span className="font-medium text-stone-800">{reservation.quantity} orang</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Harga/tiket</span>
                <span className="font-medium text-stone-800">Rp {dest.price.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                <span className="font-serif font-semibold text-stone-900">Total</span>
                <span className="text-xl font-bold" style={{ color: "#D4AF37" }}>Rp {reservation.totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* QR Payment panel */}
          {paymentData && qrDataUrl && !expired && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-amber-200 rounded-2xl p-6 mb-6 text-center"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-stone-800">Scan QR untuk Membayar</p>
                  <p className="text-xs text-stone-400 mt-0.5">Mode Demo</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 mb-1">Batas waktu:</p>
                  <CountdownTimer expiresAt={paymentData.expiresAt} onExpired={handleExpired} />
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-stone-100 inline-block">
                  <img src={qrDataUrl} alt="QR Pembayaran" className="w-48 h-48" />
                </div>
              </div>
              <p className="text-stone-500 text-sm mb-1">Total: <strong className="text-stone-800">Rp {reservation.totalPrice.toLocaleString("id-ID")}</strong></p>
              <p className="text-xs text-stone-400 mb-5 font-mono">{paymentData.orderId}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                <p className="text-sm text-amber-700 font-medium mb-2">Mode Demo — klik untuk simulasi pembayaran berhasil</p>
                <Button onClick={handleSimulateSuccess} className="gap-2 text-white w-full" style={{ backgroundColor: "#2E8B57" }} data-testid="btn-simulate-payment">
                  ✓ Simulasi Pembayaran Berhasil
                </Button>
              </div>
            </motion.div>
          )}

          {!paymentData && (
            <>
              <div className="bg-stone-50 rounded-xl p-5 mb-6">
                <h3 className="font-medium text-stone-800 mb-3">Informasi Pemesan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nama</span>
                    <span className="font-medium text-stone-800">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Email</span>
                    <span className="font-medium text-stone-800">{user?.email}</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-700">
                <p className="font-medium mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Catatan Pembayaran</p>
                <p>QR pembayaran aktif selama <strong>15 menit</strong>. Jika tidak dibayar, reservasi otomatis dibatalkan.</p>
              </div>
              <Button
                onClick={handlePay}
                className="w-full h-12 text-white font-medium rounded-lg gap-2"
                style={{ backgroundColor: "#8B0000" }}
                disabled={createPayment.isPending}
                data-testid="btn-bayar"
              >
                <CreditCard className="w-5 h-5" />
                {createPayment.isPending ? "Memproses..." : "Bayar Sekarang"}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
