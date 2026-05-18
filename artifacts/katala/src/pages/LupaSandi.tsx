import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LupaSandi() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "#FCFBF8" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Login
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "#8B0000" }}>
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Lupa Password</h1>
          <p className="text-stone-500 text-sm mb-6">Masukkan email Anda dan kami akan mengirimkan instruksi reset password.</p>

          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input type="email" placeholder="email@example.com" className="pl-10 h-11" data-testid="input-email" />
              </div>
            </div>
            <Button
              className="w-full h-11 text-white font-medium"
              style={{ backgroundColor: "#8B0000" }}
              data-testid="btn-reset-password"
            >
              Kirim Instruksi Reset
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
