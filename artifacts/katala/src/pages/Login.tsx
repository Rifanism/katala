import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { MapPin, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: FormValues) => {
    loginMutation.mutate(
      { data: { email: values.email, password: values.password } },
      {
        onSuccess: (data) => {
          login(data.user as any, data.token);
          toast({ title: "Berhasil masuk!", description: `Selamat datang, ${data.user.name}` });
          if (data.user.role === "admin") setLocation("/admin/dashboard");
          else if (data.user.role === "staff") setLocation("/petugas/scanner");
          else setLocation("/");
        },
        onError: () => {
          toast({ title: "Gagal masuk", description: "Email atau password salah", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#FCFBF8" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"
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
            <h2 className="font-serif text-4xl font-bold mb-4">Selamat Datang<br />Kembali</h2>
            <p className="text-white/80 text-lg">Masuk dan lanjutkan petualangan wisata Lampung Anda.</p>
          </div>
          <div className="flex gap-3">
            {[
              "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=80&q=80",
              "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=80&q=80",
              "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=80&q=80",
            ].map((src, i) => (
              <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/30">
                <img src={src} alt="" className="w-full h-full object-cover" />
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
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8B0000" }}>
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-serif text-lg font-bold text-stone-900">KATALA</span>
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Masuk</h1>
          <p className="text-stone-500 mb-8">Belum punya akun?{" "}
            <Link href="/auth/register" className="font-medium hover:underline" style={{ color: "#8B0000" }}>
              Daftar sekarang
            </Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
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
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link href="/auth/lupa-sandi" className="text-sm text-stone-500 hover:text-stone-700">
                  Lupa password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-white font-medium rounded-lg"
                style={{ backgroundColor: "#8B0000" }}
                disabled={loginMutation.isPending}
                data-testid="btn-submit-login"
              >
                {loginMutation.isPending ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
