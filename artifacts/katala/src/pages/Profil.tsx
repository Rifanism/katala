import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { User, Lock, Ticket, ChevronRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Profil() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();

  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [editPass, setEditPass] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  if (!user) return null;

  const avatar = user.name.charAt(0).toUpperCase();

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user.name) { setEditName(false); return; }
    setSavingName(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("katala_token")}` },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, token!);
        toast({ title: "Nama berhasil diperbarui" });
        setEditName(false);
      } else {
        const e = await res.json();
        toast({ title: "Gagal", description: e.error, variant: "destructive" });
      }
    } catch { toast({ title: "Gagal memperbarui nama", variant: "destructive" }); }
    setSavingName(false);
  };

  const handleSavePass = async () => {
    if (!oldPass || !newPass) return;
    if (newPass !== confirmPass) { toast({ title: "Konfirmasi password tidak cocok", variant: "destructive" }); return; }
    if (newPass.length < 6) { toast({ title: "Password minimal 6 karakter", variant: "destructive" }); return; }
    setSavingPass(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("katala_token")}` },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });
      if (res.ok) {
        toast({ title: "Password berhasil diperbarui" });
        setEditPass(false);
        setOldPass(""); setNewPass(""); setConfirmPass("");
      } else {
        const e = await res.json();
        toast({ title: "Gagal", description: e.error, variant: "destructive" });
      }
    } catch { toast({ title: "Gagal memperbarui password", variant: "destructive" }); }
    setSavingPass(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Profil Saya</h1>

        {/* Avatar & info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 mb-5 flex items-center gap-5"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: "#8B0000" }}>
            {avatar}
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-stone-900">{user.name}</p>
            <p className="text-stone-400 text-sm">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500 capitalize">{user.role}</span>
          </div>
        </motion.div>

        {/* Edit nama */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 mb-4"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-medium text-stone-800">
              <User className="w-4 h-4 text-stone-400" /> Nama
            </div>
            {!editName && (
              <button onClick={() => { setEditName(true); setNewName(user.name); }}
                className="text-sm font-medium" style={{ color: "#8B0000" }}>
                Edit
              </button>
            )}
          </div>
          {editName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                placeholder="Nama baru"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveName} disabled={savingName} className="text-white" style={{ backgroundColor: "#8B0000" }}>
                  {savingName ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditName(false)}>Batal</Button>
              </div>
            </div>
          ) : (
            <p className="text-stone-600 text-sm">{user.name}</p>
          )}
        </motion.div>

        {/* Edit password */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 mb-4"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-medium text-stone-800">
              <Lock className="w-4 h-4 text-stone-400" /> Password
            </div>
            {!editPass && (
              <button onClick={() => setEditPass(true)} className="text-sm font-medium" style={{ color: "#8B0000" }}>
                Ubah
              </button>
            )}
          </div>
          {editPass ? (
            <div className="space-y-3">
              {[
                { label: "Password lama", val: oldPass, set: setOldPass },
                { label: "Password baru", val: newPass, set: setNewPass },
                { label: "Konfirmasi password baru", val: confirmPass, set: setConfirmPass },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-xs text-stone-400 mb-1 block">{label}</label>
                  <input
                    type="password"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePass} disabled={savingPass} className="text-white" style={{ backgroundColor: "#8B0000" }}>
                  {savingPass ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditPass(false); setOldPass(""); setNewPass(""); setConfirmPass(""); }}>Batal</Button>
              </div>
            </div>
          ) : (
            <p className="text-stone-400 text-sm">••••••••</p>
          )}
        </motion.div>

        {/* Shortcuts */}
        {user.role === "tourist" && (
          <div className="space-y-3">
            {[
              { href: "/profil/reservasi", icon: CreditCard, label: "Reservasi Saya" },
              { href: "/profil/tiket-saya", icon: Ticket, label: "Tiket Saya" },
            ].map(({ href, icon: Icon, label }, i) => (
              <motion.div key={href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <Link href={href}>
                  <div className="bg-white rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-stone-200 border border-stone-100 transition-colors"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <Icon className="w-4 h-4 text-stone-400" /> {label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
