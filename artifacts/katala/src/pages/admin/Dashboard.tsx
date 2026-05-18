import { motion } from "framer-motion";
import { MapPin, Users, CreditCard, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { useGetAdminStats, useGetRevenueChart, useListAllTransactions } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 border border-stone-100"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-400 mb-1">{label}</p>
          <p className="font-serif text-2xl font-bold text-stone-900">{value}</p>
          {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useGetAdminStats();
  const { data: revenueChart } = useGetRevenueChart();
  const { data: transactions } = useListAllTransactions({ page: 1 });

  const chartData = revenueChart?.map((point) => ({
    month: MONTHS[parseInt(point.month ?? "1") - 1],
    revenue: point.revenue ?? 0,
    count: point.reservations ?? 0,
  })) ?? [];

  const statusConfig: Record<string, { label: string; class: string }> = {
    paid: { label: "Lunas", class: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Menunggu", class: "bg-yellow-100 text-yellow-700" },
    failed: { label: "Gagal", class: "bg-red-100 text-red-700" },
    expired: { label: "Kedaluwarsa", class: "bg-stone-100 text-stone-500" },
    refunded: { label: "Refund", class: "bg-blue-100 text-blue-700" },
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-0.5">Selamat datang di panel admin KATALA</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Destinasi"
            value={stats?.totalDestinations ?? 0}
            icon={MapPin}
            color="#8B0000"
          />
          <StatCard
            label="Total Pengguna"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="#2E8B57"
          />
          <StatCard
            label="Total Reservasi"
            value={stats?.totalReservations ?? 0}
            icon={Calendar}
            color="#D4AF37"
            sub={`${stats?.todayReservations ?? 0} hari ini`}
          />
          <StatCard
            label="Total Pendapatan"
            value={`Rp ${((stats?.totalRevenue ?? 0) / 1000000).toFixed(1)}jt`}
            icon={CreditCard}
            color="#D4AF37"
            sub={`${stats?.pendingReservations ?? 0} pending`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div
            className="lg:col-span-2 bg-white rounded-xl border border-stone-100 p-6"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif font-semibold text-stone-900">Pendapatan Bulanan</h2>
                <p className="text-xs text-stone-400 mt-0.5">Tahun 2026</p>
              </div>
              <TrendingUp className="w-5 h-5 text-stone-300" />
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}rb`} />
                  <Tooltip
                    formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Pendapatan"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#8B0000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-stone-300">
                <p className="text-sm">Belum ada data pendapatan</p>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div
            className="bg-white rounded-xl border border-stone-100 p-6"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
          >
            <h2 className="font-serif font-semibold text-stone-900 mb-4">Ringkasan</h2>
            <div className="space-y-4">
              {[
                { label: "Reservasi Pending", value: stats?.pendingReservations ?? 0, color: "#F59E0B" },
                { label: "Reservasi Hari Ini", value: stats?.todayReservations ?? 0, color: "#8B0000" },
                { label: "Total Destinasi Aktif", value: stats?.totalDestinations ?? 0, color: "#2E8B57" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">{label}</span>
                  <span className="font-serif font-bold text-xl" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div
          className="mt-6 bg-white rounded-xl border border-stone-100"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-50">
            <h2 className="font-serif font-semibold text-stone-900">Transaksi Terbaru</h2>
            <a href="/admin/transaksi" className="flex items-center gap-1 text-sm hover:underline" style={{ color: "#8B0000" }}>
              Lihat semua <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50">
                  <th className="text-left px-6 py-3 text-stone-400 font-medium">Order ID</th>
                  <th className="text-left px-6 py-3 text-stone-400 font-medium">Jumlah</th>
                  <th className="text-left px-6 py-3 text-stone-400 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-stone-400 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx) => {
                  const cfg = statusConfig[tx.status] ?? statusConfig.pending;
                  return (
                    <tr key={tx.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-stone-600">{tx.orderId}</td>
                      <td className="px-6 py-3 font-semibold" style={{ color: "#D4AF37" }}>
                        Rp {tx.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>{cfg.label}</span>
                      </td>
                      <td className="px-6 py-3 text-stone-400">
                        {new Date(tx.createdAt!).toLocaleDateString("id-ID", { dateStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
                {!transactions?.length && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">Belum ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
