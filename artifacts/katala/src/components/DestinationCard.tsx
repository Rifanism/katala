import { Link } from "wouter";
import { MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

interface Destination {
  id: number;
  name: string;
  location: string;
  price: number;
  imageUrl: string;
  rating?: number | null;
  category: string;
}

export default function DestinationCard({ dest, index = 0 }: { dest: Destination; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link href={`/destinasi/${dest.id}`}>
        <div
          className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          data-testid={`card-destination-${dest.id}`}
        >
          <div className="relative overflow-hidden h-52">
            <img
              src={dest.imageUrl}
              alt={dest.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-700 rounded-full">
                {dest.category}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-serif font-semibold text-stone-900 text-lg leading-tight mb-1 group-hover:text-[#8B0000] transition-colors">
              {dest.name}
            </h3>
            <div className="flex items-center gap-1 text-stone-500 text-sm mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>{dest.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400">Mulai dari</span>
                <p className="font-semibold text-stone-900" style={{ color: "#D4AF37" }}>
                  Rp {dest.price.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-stone-400">/orang</span>
                </p>
              </div>
              {dest.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-stone-700">{dest.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
