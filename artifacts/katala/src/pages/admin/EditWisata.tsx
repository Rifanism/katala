import { useState, useCallback, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MapPin } from "lucide-react";
import { useGetDestination, useUpdateDestination } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const CATEGORIES = ["Pantai", "Ekowisata", "Bahari", "Budaya", "Air Terjun", "Danau", "Pegunungan", "Lainnya"];

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  location: z.string().min(3),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  price: z.coerce.number().int().min(0),
  dailyQuota: z.coerce.number().int().min(1),
  category: z.string().min(1),
  imageUrl: z.string().url(),
  rating: z.coerce.number().min(0).max(5).optional(),
  featured: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function AdminEditWisata() {
  const [, params] = useRoute("/admin/wisata/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = parseInt(params?.id ?? "0");
  const updateDestination = useUpdateDestination();
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  const { data: dest, isLoading } = useGetDestination(id, {
    query: { enabled: !!id, queryKey: ["destination-edit", id] },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", description: "", location: "",
      category: "", imageUrl: "",
      latitude: 0, longitude: 0,
      price: 0, dailyQuota: 1,
      rating: undefined, featured: false,
    },
  });

  useEffect(() => {
    if (dest) {
      form.reset({
        name: dest.name,
        description: dest.description,
        location: dest.location,
        latitude: dest.latitude,
        longitude: dest.longitude,
        price: dest.price,
        dailyQuota: dest.dailyQuota,
        category: dest.category,
        imageUrl: dest.imageUrl,
        rating: dest.rating ?? undefined,
        featured: dest.featured ?? false,
      });
      setMarkerPos([dest.latitude, dest.longitude]);
    }
  }, [dest]);

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    form.setValue("latitude", parseFloat(lat.toFixed(6)));
    form.setValue("longitude", parseFloat(lng.toFixed(6)));
  }, [form]);

  const onSubmit = (values: FormValues) => {
    updateDestination.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-destinations"] });
          queryClient.invalidateQueries({ queryKey: ["destination", id] });
          toast({ title: "Destinasi berhasil diperbarui!" });
          setLocation("/admin/wisata");
        },
        onError: (err: any) => {
          toast({ title: "Gagal memperbarui", description: err?.data?.error, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 max-w-3xl">
          <div className="h-6 bg-stone-100 rounded w-32 animate-pulse mb-4" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-11 bg-stone-100 rounded animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <Link href="/admin/wisata" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-8">Edit Destinasi Wisata</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nama Destinasi</FormLabel>
                  <FormControl><Input {...field} className="h-11" data-testid="input-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl><Textarea {...field} rows={4} data-testid="input-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input {...field} className="pl-10 h-11" data-testid="input-location" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Tiket (Rp)</FormLabel>
                  <FormControl><Input {...field} type="number" min={0} className="h-11" data-testid="input-price" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dailyQuota" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kuota Harian</FormLabel>
                  <FormControl><Input {...field} type="number" min={1} className="h-11" data-testid="input-quota" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>URL Gambar</FormLabel>
                  <FormControl><Input {...field} className="h-11" data-testid="input-image-url" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (0-5)</FormLabel>
                  <FormControl><Input {...field} type="number" min={0} max={5} step={0.1} className="h-11" data-testid="input-rating" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="featured" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                  <FormLabel className="cursor-pointer">Tampilkan sebagai Unggulan</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* Map */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Koordinat Lokasi (klik peta untuk ubah)
              </label>
              <div className="rounded-xl overflow-hidden border border-stone-200 h-52 mb-2">
                {dest && (
                  <MapContainer center={[dest.latitude, dest.longitude]} zoom={11} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <LocationPicker onPick={handleMapPick} />
                    {markerPos && <Marker position={markerPos} />}
                  </MapContainer>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Latitude</FormLabel>
                    <FormControl><Input {...field} type="number" step={0.000001} className="h-9 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Longitude</FormLabel>
                    <FormControl><Input {...field} type="number" step={0.000001} className="h-9 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="text-white" style={{ backgroundColor: "#8B0000" }} disabled={updateDestination.isPending} data-testid="btn-simpan">
                {updateDestination.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Link href="/admin/wisata"><Button variant="outline" type="button">Batal</Button></Link>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
