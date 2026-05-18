import { Settings, Bell, Shield, Globe, MapPin } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function AdminPengaturan() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900">Pengaturan</h1>
          <p className="text-stone-500 text-sm mt-0.5">Konfigurasi platform KATALA</p>
        </div>

        {/* General settings */}
        <div className="bg-white rounded-xl border border-stone-100 p-6 mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-stone-400" />
            <h2 className="font-medium text-stone-900">Informasi Platform</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nama Platform</Label>
              <Input defaultValue="KATALA" className="mt-1 h-10" readOnly />
            </div>
            <div>
              <Label className="text-sm">Deskripsi</Label>
              <Input defaultValue="Katalog & Reservasi Wisata Lampung" className="mt-1 h-10" readOnly />
            </div>
            <div>
              <Label className="text-sm">Email Kontak</Label>
              <Input defaultValue="admin@katala.id" className="mt-1 h-10" />
            </div>
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-white rounded-xl border border-stone-100 p-6 mb-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-stone-400" />
            <h2 className="font-medium text-stone-900">Notifikasi</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Notifikasi reservasi baru", desc: "Terima notifikasi setiap ada reservasi baru" },
              { label: "Notifikasi pembayaran", desc: "Terima notifikasi saat pembayaran berhasil" },
              { label: "Laporan harian", desc: "Kirim ringkasan harian via email" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.label.includes("pembayaran")} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-stone-100 p-6 mb-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-stone-400" />
            <h2 className="font-medium text-stone-900">Keamanan</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Durasi Sesi (jam)</Label>
              <Input type="number" defaultValue={24} className="mt-1 h-10 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-800">Verifikasi dua langkah</p>
                <p className="text-xs text-stone-400">Tambahan keamanan saat login</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button style={{ backgroundColor: "#8B0000" }} className="text-white" data-testid="btn-simpan-pengaturan">
            Simpan Pengaturan
          </Button>
          <Button variant="outline">Batal</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
