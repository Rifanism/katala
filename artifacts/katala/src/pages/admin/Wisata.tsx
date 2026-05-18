import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, MapPin, Star, Search } from "lucide-react";
import { useListDestinations, useDeleteDestination, getListDestinationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminWisata() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListDestinations(
    { search: search || undefined, page, limit: 10 },
    { query: { queryKey: ["admin-destinations", search, page] } }
  );
  const deleteDestination = useDeleteDestination();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number, name: string) => {
    deleteDestination.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-destinations"] });
          toast({ title: `${name} berhasil dihapus` });
        },
        onError: () => toast({ title: "Gagal menghapus destinasi", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Manajemen Wisata</h1>
            <p className="text-stone-500 text-sm mt-0.5">{data?.total ?? 0} destinasi terdaftar</p>
          </div>
          <Link href="/admin/wisata/tambah">
            <Button style={{ backgroundColor: "#8B0000" }} className="text-white gap-2" data-testid="btn-tambah-wisata">
              <Plus className="w-4 h-4" /> Tambah Destinasi
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari destinasi..."
            className="pl-10"
            data-testid="input-search-wisata"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Destinasi</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Kategori</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Harga</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Kuota</th>
                  <th className="text-left px-5 py-3.5 text-stone-500 font-medium">Rating</th>
                  <th className="text-right px-5 py-3.5 text-stone-500 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-stone-50">
                      <td colSpan={6} className="px-5 py-4"><div className="h-4 bg-stone-100 rounded animate-pulse" /></td>
                    </tr>
                  ))
                )}
                {!isLoading && data?.data.map((dest) => (
                  <tr key={dest.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={dest.imageUrl} alt={dest.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-stone-900">{dest.name}</p>
                          <p className="text-xs text-stone-400 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3" /> {dest.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">{dest.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-stone-800">
                      Rp {dest.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">{dest.dailyQuota}/hari</td>
                    <td className="px-5 py-3.5">
                      {dest.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{dest.rating}</span>
                        </div>
                      ) : <span className="text-stone-300">-</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/wisata/${dest.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5" data-testid={`btn-edit-${dest.id}`}>
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" data-testid={`btn-delete-${dest.id}`}>
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Destinasi</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus "{dest.name}"? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(dest.id, dest.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && !data?.data.length && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-stone-400">Tidak ada destinasi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.total > 10 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= data.total}>
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
