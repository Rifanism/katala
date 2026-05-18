import { Link } from "wouter";
import { motion } from "framer-motion";
import { Ticket, MapPin, Calendar, ChevronRight, QrCode, Users } from "lucide-react";
import { useListMyTickets } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  valid: { label: "Valid", class: "bg-emerald-100 text-emerald-700" },
  used: { label: "Sudah Digunakan", class: "bg-stone-100 text-stone-500" },
  expired: { label: "Kedaluwarsa", class: "bg-red-100 text-red-700" },
};

export default function TiketSaya() {
  const { data: tickets, isLoading } = useListMyTickets();

  const uniqueTickets = tickets
    ? Object.values(
        tickets.reduce((acc: Record<number, typeof tickets[0]>, ticket) => {
          if (!acc[ticket.reservationId]) {
            acc[ticket.reservationId] = ticket;
          }
          return acc;
        }, {})
      )
    : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Tiket Saya</h1>
          <p className="text-stone-500 mt-1">Kelola semua tiket wisata Anda</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !uniqueTickets.length ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Ticket className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-stone-700 mb-2">Belum ada tiket</h3>
            <p className="text-stone-400 mb-6">Tiket Anda akan muncul di sini setelah pembayaran berhasil</p>
            <Link href="/destinasi">
              <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium" style={{ backgroundColor: "#8B0000" }}>
                Jelajahi Destinasi
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {uniqueTickets.map((ticket, i) => {
              const dest = ticket.reservation?.destination;
              const cfg = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.valid;
              const quantity = ticket.reservation?.quantity ?? 1;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/profil/tiket-saya/${ticket.id}`}>
                    <div
                      className="bg-white rounded-xl border border-stone-100 overflow-hidden cursor-pointer hover:border-stone-200 transition-colors group flex"
                      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
                      data-testid={`ticket-${ticket.id}`}
                    >
                      {/* Left: destination image */}
                      {dest && (
                        <div className="w-32 shrink-0">
                          <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" style={{ minHeight: 120 }} />
                        </div>
                      )}

                      {/* Middle: info */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif font-semibold text-stone-900 group-hover:text-[#8B0000] transition-colors">
                            {dest?.name ?? "Destinasi"}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm text-stone-500">
                          {dest && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> {dest.location}
                            </div>
                          )}
                          {ticket.reservation?.visitDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(ticket.reservation.visitDate).toLocaleDateString("id-ID", { dateStyle: "long" })}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{quantity} orang</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-mono text-xs text-stone-400">{ticket.ticketCode}</span>
                          <div className="flex items-center gap-1 text-stone-400 group-hover:text-stone-600 transition-colors">
                            <QrCode className="w-4 h-4" />
                            <span className="text-xs">Lihat QR</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
