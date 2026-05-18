import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Ticket, MapPin, Calendar, ChevronRight, Clock, CheckCircle, XCircle, CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Reservation = {
  id: number;
  destinationId: number;
  visitDate: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  destination: { name: string; imageUrl: string; location: string } | null;
  transaction?: {
    orderId: string;
    status: string;
    expiresAt: string;
  } | null;
};

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  pending: { label: "Menunggu Pembayaran", icon: Clock, cls: "bg-amber-100 text-amber-700" },
  paid:    { label: "Terbayar", icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Kedaluwarsa", icon: XCircle, cls: "bg-red-100 text-red-600" },
  failed:  { label: "Gagal", icon: XCircle, cls: "bg-red-100 text-red-600" },
  cancelled: { label: "Dibatalkan", icon: XCircle, cls: "bg-stone-100 text-stone-500" },
};

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === 0) return <span className="text-red-500 text-xs font-medium">Kedaluwarsa</span>;

  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const urgent = remaining < 3 * 60 * 1000;

  return (
    <span className={`font-mono text-xs font-bold flex items-center gap-1 ${urgent ? "text-red-500" : "text-amber-600"}`}>
      <Clock className="w-3 h-3" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function ReservasiSaya() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("katala_token");
        // Load reservations
        const rRes = await fetch("/api/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rList: Reservation[] = await rRes.json();

        const enriched = await Promise.all(
          rList.map(async (r) => {
            if (r.status === "pending") {
              try {
                const tRes = await fetch(`/api/payments/${r.id}/status`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (tRes.ok) {
                  const tx = await tRes.json();
                  return { ...r, transaction: tx };
                }
              } catch { /* no transaction yet */ }
            }
            return { ...r, transaction: null };
          })
        );

        setReservations(enriched);
      } catch {
        toast({ title: "Gagal memuat reservasi", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLanjutkan = (r: Reservation) => {
    sessionStorage.setItem("checkout_reservation", JSON.stringify({
      ...r,
      totalPrice: r.totalPrice,
    }));
    if (r.transaction && r.transaction.status === "pending") {
      const expiresAt = r.transaction.expiresAt;
      if (new Date(expiresAt).getTime() > Date.now()) {
        sessionStorage.setItem("payment_order_id", r.transaction.orderId);
        sessionStorage.setItem("payment_reservation_id", String(r.id));
        sessionStorage.setItem("payment_expires_at", expiresAt);
      }
    }
    setLocation("/pemesanan/checkout");
  };

  const pending = reservations.filter((r) => r.status === "pending");
  const others  = reservations.filter((r) => r.status !== "pending");

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-stone-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Reservasi Saya</h1>
          <p className="text-stone-500 mt-1">Riwayat dan status semua reservasi Anda</p>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-4">Belum ada reservasi</p>
            <Link href="/destinasi">
              <Button style={{ backgroundColor: "#8B0000" }} className="text-white">Jelajahi Destinasi</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending payment section */}
            {pending.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> Menunggu Pembayaran
                </h2>
                <div className="space-y-3">
                  {pending.map((r, i) => {
                    const dest = r.destination;
                    const tx = r.transaction;
                    const hasActiveTx = tx && tx.status === "pending" && new Date(tx.expiresAt).getTime() > Date.now();
                    const cfg = statusConfig["pending"];
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <div className="bg-white border-2 border-amber-100 rounded-xl overflow-hidden"
                          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                          <div className="flex">
                            {dest && (
                              <div className="w-24 flex-shrink-0">
                                <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" style={{ minHeight: 96 }} />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-serif font-semibold text-stone-900">{dest?.name ?? "Destinasi"}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.cls}`}>
                                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 mb-3">
                                {dest && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{dest.location}</span>}
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.visitDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.quantity} orang</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-stone-400">Total</p>
                                  <p className="font-bold text-sm" style={{ color: "#D4AF37" }}>Rp {r.totalPrice.toLocaleString("id-ID")}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {hasActiveTx && (
                                    <div className="text-right">
                                      <p className="text-xs text-stone-400">Sisa waktu</p>
                                      <PaymentCountdown expiresAt={tx!.expiresAt} />
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    className="text-white gap-1.5"
                                    style={{ backgroundColor: "#8B0000" }}
                                    onClick={() => handleLanjutkan(r)}
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    {hasActiveTx ? "Lanjutkan Bayar" : "Bayar Sekarang"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History */}
            {others.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-stone-700 mb-3">Riwayat Reservasi</h2>
                <div className="space-y-3">
                  {others.map((r, i) => {
                    const dest = r.destination;
                    const cfg = statusConfig[r.status] ?? statusConfig["cancelled"];
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden flex"
                          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                          {dest && (
                            <div className="w-20 shrink-0">
                              <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" style={{ minHeight: 80 }} />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-serif font-semibold text-stone-900 text-sm">{dest?.name ?? "Destinasi"}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.cls}`}>
                                <StatusIcon className="w-3 h-3" /> {cfg.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-400 mb-2">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.visitDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.quantity} orang</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm" style={{ color: "#D4AF37" }}>Rp {r.totalPrice.toLocaleString("id-ID")}</p>
                              {r.status === "paid" && (
                                <Link href="/profil/tiket-saya">
                                  <span className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 cursor-pointer">
                                    Lihat Tiket <ChevronRight className="w-3 h-3" />
                                  </span>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
