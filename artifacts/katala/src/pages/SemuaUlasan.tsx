import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className="w-4 h-4" fill={value >= s ? "#D4AF37" : "none"} stroke={value >= s ? "#D4AF37" : "#d6d3d1"} />
      ))}
    </div>
  );
}

export default function SemuaUlasan() {
  const [, params] = useRoute("/destinasi/:id/ulasan");
  const id = parseInt(params?.id ?? "0");
  const [reviews, setReviews] = useState<any[]>([]);
  const [destName, setDestName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/ratings/destination/${id}`).then((r) => r.json()),
      fetch(`/api/destinations/${id}`).then((r) => r.json()),
    ]).then(([rList, dest]) => {
      setReviews(Array.isArray(rList) ? rList : []);
      setDestName(dest?.name ?? "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/destinasi/${id}`} className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> {destName || "Destinasi"}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-bold text-stone-900">Semua Ulasan</h1>
          {avg && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-700">{avg}</span>
              <span className="text-amber-600 text-sm">({reviews.length})</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400">Belum ada ulasan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 p-4 bg-white rounded-xl border border-stone-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: "#8B0000" }}>
                  {(r.userName ?? r.userId ?? "U").toString().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-stone-800 text-sm">{r.userName ?? `Pengunjung #${r.userId}`}</span>
                    <span className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                  </div>
                  <RatingStars value={r.rating} />
                  {r.review && <p className="text-stone-600 text-sm mt-2 leading-relaxed">{r.review}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
