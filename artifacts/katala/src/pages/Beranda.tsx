import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowRight, Leaf, Waves, Mountain, Camera } from "lucide-react";
import { useListFeaturedDestinations, useListDestinations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import { Link } from "wouter";

const CATEGORIES = [
  { label: "Semua", value: "" },
  { label: "Pantai", value: "Pantai", icon: Waves },
  { label: "Ekowisata", value: "Ekowisata", icon: Leaf },
  { label: "Bahari", value: "Bahari", icon: Waves },
  { label: "Budaya", value: "Budaya", icon: Camera },
  { label: "Air Terjun", value: "Air Terjun", icon: Mountain },
];

export default function Beranda() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedDestinations();
  const { data: allData } = useListDestinations({ limit: 8, page: 1 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) setLocation(`/destinasi?search=${encodeURIComponent(search)}`);
    else setLocation("/destinasi");
  };

console.log("Isi featured:", featured);
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
            alt="Lampung landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/50 to-transparent" />
        </div>

        {/* Decorative siger silhouette */}
        <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5">
          <svg viewBox="0 0 200 200" fill="white">
            <path d="M100 10 L120 60 L180 60 L135 95 L155 145 L100 115 L45 145 L65 95 L20 60 L80 60 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <MapPin className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-white/90 text-sm">Pesona Lampung</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Temukan Keajaiban<br />
              <span style={{ color: "#D4AF37" }}>Bumi Ruwa Jurai</span>
            </h1>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Jelajahi ratusan destinasi wisata terbaik Lampung — dari pantai eksotis
              hingga hutan tropis dan warisan budaya yang memukau.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari destinasi wisata..."
                  className="pl-10 bg-white/95 border-0 h-12 text-stone-900 placeholder:text-stone-400 rounded-full"
                  data-testid="input-hero-search"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6 rounded-full text-white font-medium"
                style={{ backgroundColor: "#8B0000" }}
                data-testid="btn-hero-search"
              >
                Cari
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="bg-stone-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { label: "Destinasi Wisata", value: `${allData?.total ?? 0}+` },
              { label: "Wisatawan Puas", value: "10,000+" },
              { label: "Kategori Wisata", value: "8+" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-serif font-bold" style={{ color: "#D4AF37" }}>{stat.value}</p>
                <p className="text-stone-400 text-sm mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured destinations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "#8B0000" }}>Pilihan Terbaik</p>
              <h2 className="font-serif text-3xl font-bold text-stone-900">Destinasi Unggulan</h2>
            </div>
            <Link href="/destinasi">
              <Button variant="outline" className="gap-2" data-testid="btn-lihat-semua">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured?.map((dest, i) => (
                <DestinationCard key={dest.id} dest={dest as any} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map CTA */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #8B0000 0%, #5a0000 100%)" }}>
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <pattern id="tapis" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="white" />
                </pattern>
                <rect width="400" height="200" fill="url(#tapis)" />
              </svg>
            </div>
            <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-serif text-3xl font-bold text-white mb-3">
                  Jelajahi Lampung dengan Peta Interaktif
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  Temukan destinasi wisata tersembunyi di seluruh pelosok Lampung melalui peta interaktif kami.
                </p>
                <Link href="/destinasi">
                  <Button className="bg-white font-medium gap-2" style={{ color: "#8B0000" }} data-testid="btn-cta-map">
                    Jelajahi Sekarang <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-24 h-24 text-white/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-medium mb-2" style={{ color: "#8B0000" }}>Kategori Wisata</p>
            <h2 className="font-serif text-3xl font-bold text-stone-900">Temukan Pengalaman Unik</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pantai", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", count: 3 },
              { label: "Ekowisata", image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&q=80", count: 2 },
              { label: "Bahari", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80", count: 2 },
              { label: "Budaya", image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80", count: 1 },
            ].map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/destinasi?category=${cat.label}`}>
                  <div className="relative h-40 rounded-xl overflow-hidden cursor-pointer group" data-testid={`cat-${cat.label}`}>
                    <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="font-serif font-semibold">{cat.label}</p>
                      <p className="text-xs text-white/70">{cat.count} destinasi</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8B0000" }}>
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-white">KATALA</span>
          </div>
          <p className="text-stone-400 text-sm">Katalog dan Reservasi Wisata Lampung</p>
          <p className="text-stone-600 text-xs mt-6">© 2026 KATALA. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
