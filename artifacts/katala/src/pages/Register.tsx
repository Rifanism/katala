import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { MapPin, Eye, EyeOff, User, Lock, Mail } from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: FormValues) => {
    registerMutation.mutate(
      { data: { name: values.name, email: values.email, password: values.password } },
      {
        onSuccess: (data) => {
          login(data.user as any, data.token);
          toast({ title: "Akun berhasil dibuat!", description: `Selamat datang, ${data.user.name}` });
          setLocation("/");
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Gagal membuat akun";
          toast({ title: "Pendaftaran gagal", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#FCFBF8" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"
          alt="Lampung"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.85) 0%, rgba(90,0,0,0.7) 100%)" }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl font-bold">KATALA</span>
          </Link>
          <div>
            <h2 className="font-serif text-4xl font-bold mb-4">Mulai Petualangan<br />Anda di Lampung</h2>
            <p className="text-white/80 text-lg">Daftar gratis dan akses semua destinasi wisata terbaik Lampung.</p>
          </div>
          <div className="space-y-3 text-sm">
            {["Reservasi tiket online", "Tiket digital dengan QR code", "Pantau status reservasi real-time"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-white/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link href="/">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8B0000" }}>
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-serif text-lg font-bold text-stone-900">KATALA</span>
              </div>
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Buat Akun</h1>
          <p className="text-stone-500 mb-8">Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#8B0000" }}>
              Masuk sekarang
            </Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} placeholder="Budi Santoso" className="pl-10 h-11" data-testid="input-name" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} type="email" placeholder="email@example.com" className="pl-10 h-11" data-testid="input-email" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-11" data-testid="input-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 h-11" data-testid="input-confirm-password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full h-11 text-white font-medium rounded-lg mt-2"
                style={{ backgroundColor: "#8B0000" }}
                disabled={registerMutation.isPending}
                data-testid="btn-submit-register"
              >
                {registerMutation.isPending ? "Memproses..." : "Buat Akun"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
