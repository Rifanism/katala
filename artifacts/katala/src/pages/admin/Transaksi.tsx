import { useState } from "react";
import { useListAllTransactions } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: "Lunas", class: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Menunggu", class: "bg-yellow-100 text-yellow-700" },
  failed: { label: "Gagal", class: "bg-red-100 text-red-700" },
  expired: { label: "Kedaluwarsa", class: "bg-stone-100 text-stone-500" },
  refunded: { label: "Refund", class: "bg-blue-100 text-blue-700" },
};

export default function AdminTransaksi() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useListAllTransactions(
    { page, status: status || undefined },
    { query: { queryKey: ["admin-transactions", page, status] } }
  );

  const totalPages = data ? Math.ceil(data.length / 15) : 0;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-stone-900">History Transaksi</h1>
          <p className="text-stone-500 text-sm mt-0.5">{data?.length ?? 0} transaksi tercatat</p>
        </div>

        {/* Filter by status */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "paid", "pending", "failed", "expired"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === s ? "text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              style={status === s ? { backgroundColor: "#8B0000" } : {}}
              data-testid={`filter-status-${s || "all"}`}
            >
              {s ? (STATUS_CONFIG[s]?.label ?? s) : "Semua"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Order ID</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Destinasi</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Jumlah</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Metode</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && data?.map((tx) => {
                  const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
                  const dest = tx.reservation?.destination;
                  return (
                    <tr key={tx.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-stone-600">{tx.orderId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-stone-800">{dest?.name ?? "—"}</p>
                        {tx.reservation?.quantity && (
                          <p className="text-xs text-stone-400">{tx.reservation.quantity} tiket</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "#D4AF37" }}>
                        Rp {tx.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-stone-500">
                        {tx.paymentType ? (
                          <span className="capitalize">{tx.paymentType.replace(/_/g, " ")}</span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-stone-400 text-xs">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID", {
                          dateStyle: "short", timeStyle: "short"
                        }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !data?.length && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-stone-400">Tidak ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Sebelumnya
            </Button>
            <span className="flex items-center text-sm text-stone-500 px-2">
              Hal {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
