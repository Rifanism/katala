import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Users, ArrowLeft, MapPin, ChevronRight } from "lucide-react";
import { useCreateReservation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const today = new Date().toISOString().split("T")[0];

const schema = z.object({
  visitDate: z.string().min(1, "Pilih tanggal kunjungan"),
  quantity: z.coerce.number().int().min(1, "Minimal 1 tiket").max(20, "Maksimal 20 tiket"),
});
type FormValues = z.infer<typeof schema>;

export default function FormReservasi() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createReservation = useCreateReservation();

  const destJson = sessionStorage.getItem("reservasi_destination");
  const dest = destJson ? JSON.parse(destJson) : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visitDate: today, quantity: 1 },
  });

  const quantity = form.watch("quantity") || 1;
  const total = dest ? dest.price * quantity : 0;

  const onSubmit = (values: FormValues) => {
    if (!dest) return;
    createReservation.mutate(
      { data: { destinationId: dest.id, visitDate: values.visitDate, quantity: values.quantity } },
      {
        onSuccess: (reservation) => {
          sessionStorage.setItem("checkout_reservation", JSON.stringify(reservation));
          setLocation("/pemesanan/checkout");
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Gagal membuat reservasi";
          toast({ title: "Reservasi gagal", description: msg, variant: "destructive" });
        },
      }
    );
  };

  if (!dest) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-stone-500">Tidak ada destinasi yang dipilih</p>
          <Link href="/destinasi"><Button className="mt-4" variant="outline">Pilih Destinasi</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href={`/destinasi/${dest.id}`} className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Form Reservasi</h1>

          {/* Destination summary */}
          <div className="bg-stone-50 rounded-xl p-4 flex gap-4 mb-8">
            <img src={dest.imageUrl} alt={dest.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            <div>
              <h3 className="font-serif font-semibold text-stone-900 text-lg">{dest.name}</h3>
              <div className="flex items-center gap-1 text-stone-500 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{dest.location}</span>
              </div>
              <p className="text-sm font-semibold mt-2" style={{ color: "#D4AF37" }}>
                Rp {dest.price.toLocaleString("id-ID")} / orang
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="visitDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Tanggal Kunjungan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} type="date" min={today} className="pl-10 h-11" data-testid="input-visit-date" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Jumlah Tiket</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} type="number" min={1} max={20} className="pl-10 h-11" data-testid="input-quantity" />
                    </div>
                  </FormControl>
                  <p className="text-sm text-stone-400">Kuota harian: {dest.dailyQuota} orang</p>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Total */}
              <div className="bg-white border border-stone-100 rounded-xl p-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div className="flex justify-between items-center text-sm text-stone-500 mb-2">
                  <span>Harga tiket × {quantity} orang</span>
                  <span>Rp {(dest.price * quantity).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-stone-900 text-lg border-t border-stone-100 pt-3 mt-3">
                  <span className="font-serif">Total Pembayaran</span>
                  <span style={{ color: "#D4AF37" }}>Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-white font-medium rounded-lg gap-2"
                style={{ backgroundColor: "#8B0000" }}
                disabled={createReservation.isPending}
                data-testid="btn-lanjut-checkout"
              >
                {createReservation.isPending ? "Memproses..." : <>Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
