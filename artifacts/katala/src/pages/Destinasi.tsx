import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Filter, MapPin } from "lucide-react";
import { useListDestinations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Link } from "wouter";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const CATEGORIES = ["Pantai", "Ekowisata", "Bahari", "Budaya", "Air Terjun", "Danau"];

export default function Destinasi() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState(urlParams.get("search") ?? "");
  const [category, setCategory] = useState(urlParams.get("category") ?? "");
  const [page, setPage] = useState(1);
  const [showMap, setShowMap] = useState(false);

  const { data, isLoading } = useListDestinations(
    { search: search || undefined, category: category || undefined, page, limit: 9 },
    { query: { queryKey: ["destinations", search, category, page] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 9) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="py-12 bg-stone-50 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-4xl font-bold text-stone-900 mb-2">Destinasi Wisata</h1>
            <p className="text-stone-500 mb-6">Temukan dan pesan destinasi wisata terbaik di Lampung</p>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari destinasi..."
                  className="pl-10 h-11"
                  data-testid="input-search"
                />
              </div>
              <Button type="submit" style={{ backgroundColor: "#8B0000" }} className="text-white h-11" data-testid="btn-search">
                Cari
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2"
                onClick={() => setShowMap(!showMap)}
                data-testid="btn-toggle-map"
              >
                <MapPin className="w-4 h-4" />
                {showMap ? "Grid" : "Peta"}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === "" ? "text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            style={category === "" ? { backgroundColor: "#8B0000" } : {}}
            data-testid="filter-semua"
          >
            Semua
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat ? "text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              style={category === cat ? { backgroundColor: "#8B0000" } : {}}
              data-testid={`filter-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Map view */}
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 420 }}
            className="mb-8 rounded-xl overflow-hidden border border-stone-200"
          >
            <MapContainer
              center={[-5.2, 105.2]}
              zoom={9}
              style={{ height: "420px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {data?.data.map((dest) => (
                <Marker key={dest.id} position={[dest.latitude, dest.longitude]}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-semibold text-sm">{dest.name}</p>
                      <p className="text-xs text-stone-500">{dest.location}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: "#D4AF37" }}>
                        Rp {dest.price.toLocaleString("id-ID")}
                      </p>
                      <Link href={`/destinasi/${dest.id}`}>
                        <span className="text-xs underline mt-1 block" style={{ color: "#8B0000" }}>Lihat detail</span>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </motion.div>
        )}

        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-stone-500 text-sm">
            {isLoading ? "Memuat..." : `${data?.total ?? 0} destinasi ditemukan`}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-80 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-stone-700 mb-2">Tidak ada destinasi</h3>
            <p className="text-stone-500">Coba kata kunci atau kategori yang berbeda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((dest, i) => (
              <DestinationCard key={dest.id} dest={dest as any} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="btn-prev-page"
            >
              Sebelumnya
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                onClick={() => setPage(i + 1)}
                style={page === i + 1 ? { backgroundColor: "#8B0000" } : {}}
                className={page === i + 1 ? "text-white" : ""}
                data-testid={`btn-page-${i + 1}`}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              data-testid="btn-next-page"
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
