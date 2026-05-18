import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Star, Users, ArrowLeft, Calendar, ChevronRight, MessageSquare } from "lucide-react";
import { useGetDestination } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "@/context/AuthContext";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className="w-4 h-4" fill={value >= s ? "#D4AF37" : "none"} stroke={value >= s ? "#D4AF37" : "#d6d3d1"} />
      ))}
    </div>
  );
}

function ReviewsSection({ destinationId, destinationName }: { destinationId: number; destinationName: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ratings/destination/${destinationId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch { setReviews([]); }
    setLoaded(true);
    setLoading(false);
  };

  useState(() => { load(); });

  const preview = reviews.slice(0, 5);
  const hasMore = reviews.length > 5;

  if (!loaded && loading) {
    return <div className="h-20 bg-stone-50 rounded-xl animate-pulse" />;
  }

  if (loaded && reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-stone-50 rounded-xl">
        <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-stone-400 text-sm">Belum ada ulasan untuk destinasi ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preview.map((r) => (
        <div key={r.id} className="flex gap-3 p-4 bg-stone-50 rounded-xl">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: "#8B0000" }}
          >
            {(r.userName ?? r.userId ?? "U").toString().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-stone-800 text-sm truncate">{r.userName ?? `Pengunjung #${r.userId}`}</span>
              <span className="text-xs text-stone-400 flex-shrink-0">
                {new Date(r.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
              </span>
            </div>
            <RatingStars value={r.rating} />
            {r.review && <p className="text-stone-600 text-sm mt-2 leading-relaxed">{r.review}</p>}
          </div>
        </div>
      ))}
      {hasMore && (
        <Link href={`/destinasi/${destinationId}/ulasan`}>
          <Button variant="outline" className="w-full gap-2 text-stone-600">
            <MessageSquare className="w-4 h-4" />
            Tampilkan semua {reviews.length} ulasan
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function DestinationDetail() {
  const [, params] = useRoute("/destinasi/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const id = parseInt(params?.id ?? "0");

  const { data: dest, isLoading } = useGetDestination(id, {
    query: { enabled: !!id, queryKey: ["destination", id] },
  });

  const handleReserve = () => {
    if (!user) { setLocation("/auth/login"); return; }
    sessionStorage.setItem("reservasi_destination_id", String(dest!.id));
    sessionStorage.setItem("reservasi_destination", JSON.stringify(dest));
    setLocation("/pemesanan/form-reservasi");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-80 bg-stone-100 rounded-2xl animate-pulse mb-8" />
          <div className="h-6 bg-stone-100 rounded w-1/3 animate-pulse mb-4" />
          <div className="h-4 bg-stone-100 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-stone-500">Destinasi tidak ditemukan</p>
          <Link href="/destinasi"><Button className="mt-4" variant="outline">Kembali</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="relative h-80 md:h-[480px] overflow-hidden">
        <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/destinasi" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Destinasi
            </Link>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full mb-3 inline-block">{dest.category}</span>
                <h1 className="font-serif text-4xl font-bold text-white">{dest.name}</h1>
                <div className="flex items-center gap-2 text-white/80 mt-2">
                  <MapPin className="w-4 h-4" /><span>{dest.location}</span>
                </div>
              </div>
              {dest.rating && (
                <div className="flex items-center gap-1 text-white">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{dest.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-4">Tentang Destinasi</h2>
              <p className="text-stone-600 leading-relaxed">{dest.description}</p>
            </motion.div>

            {/* Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-400 mb-1">Kategori</p>
                <p className="font-semibold text-stone-800">{dest.category}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-400 mb-1">Kuota Harian</p>
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-stone-500" />
                  <p className="font-semibold text-stone-800">{dest.dailyQuota} orang</p>
                </div>
              </div>
              {dest.rating && (
                <div className="bg-stone-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-stone-400 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <p className="font-semibold text-stone-800">{dest.rating}/5</p>
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-4">Lokasi</h2>
              <div className="rounded-xl overflow-hidden border border-stone-100 h-64">
                <MapContainer center={[dest.latitude, dest.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <Marker position={[dest.latitude, dest.longitude]}>
                    <Popup><p className="font-semibold">{dest.name}</p><p className="text-xs text-stone-500">{dest.location}</p></Popup>
                  </Marker>
                </MapContainer>
              </div>
              <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {dest.location} • {dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}
              </p>
            </div>

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-2xl font-semibold text-stone-900">Ulasan Pengunjung</h2>
                {dest.rating && (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-700">{dest.rating}</span>
                    <span className="text-amber-600 text-sm">/5</span>
                  </div>
                )}
              </div>
              <ReviewsSection destinationId={dest.id} destinationName={dest.name} />
            </motion.div>
          </div>

          {/* Booking card */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-24"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            >
              <div className="mb-5">
                <p className="text-stone-400 text-sm">Harga tiket masuk</p>
                <p className="font-serif text-3xl font-bold mt-1" style={{ color: "#D4AF37" }}>Rp {dest.price.toLocaleString("id-ID")}</p>
                <p className="text-stone-400 text-sm">per orang</p>
              </div>
              <div className="space-y-3 mb-6 text-sm text-stone-600">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-stone-400" /><span>Reservasi online tersedia</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-stone-400" /><span>Kuota harian: {dest.dailyQuota} orang</span></div>
              </div>
              <Button className="w-full h-11 text-white font-medium rounded-lg gap-2" style={{ backgroundColor: "#8B0000" }} onClick={handleReserve} data-testid="btn-reservasi">
                Reservasi Sekarang <ChevronRight className="w-4 h-4" />
              </Button>
              {!user && (
                <p className="text-xs text-stone-400 text-center mt-3">
                  <Link href="/auth/login" className="underline" style={{ color: "#8B0000" }}>Masuk</Link> untuk reservasi
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
