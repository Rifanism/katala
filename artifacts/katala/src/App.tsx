import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Beranda from "@/pages/Beranda";
import Destinasi from "@/pages/Destinasi";
import DestinationDetail from "@/pages/DestinationDetail";
import FormReservasi from "@/pages/FormReservasi";
import Checkout from "@/pages/Checkout";
import StatusPembayaran from "@/pages/StatusPembayaran";
import TiketSaya from "@/pages/TiketSaya";
import TiketDetail from "@/pages/TiketDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import LupaSandi from "@/pages/LupaSandi";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminWisata from "@/pages/admin/Wisata";
import AdminTambahWisata from "@/pages/admin/TambahWisata";
import AdminEditWisata from "@/pages/admin/EditWisata";
import AdminTransaksi from "@/pages/admin/Transaksi";
import AdminPengaturan from "@/pages/admin/Pengaturan";
import PetugasScanner from "@/pages/staff/Scanner";
import Profil from "@/pages/Profil";
import ReservasiSaya from "@/pages/ReservasiSaya";
import SemuaUlasan from "@/pages/SemuaUlasan";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/auth/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Beranda} />
      <Route path="/destinasi" component={Destinasi} />
      <Route path="/destinasi/:id" component={DestinationDetail} />
      <Route path="/pemesanan/form-reservasi" component={() => <ProtectedRoute><FormReservasi /></ProtectedRoute>} />
      <Route path="/pemesanan/checkout" component={() => <ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/pemesanan/status-pembayaran" component={() => <ProtectedRoute><StatusPembayaran /></ProtectedRoute>} />
      <Route path="/profil/tiket-saya" component={() => <ProtectedRoute><TiketSaya /></ProtectedRoute>} />
      <Route path="/profil/tiket-saya/:id" component={() => <ProtectedRoute><TiketDetail /></ProtectedRoute>} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/lupa-sandi" component={LupaSandi} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/wisata/tambah" component={() => <ProtectedRoute roles={["admin"]}><AdminTambahWisata /></ProtectedRoute>} />
      <Route path="/admin/wisata/:id" component={() => <ProtectedRoute roles={["admin"]}><AdminEditWisata /></ProtectedRoute>} />
      <Route path="/admin/wisata" component={() => <ProtectedRoute roles={["admin"]}><AdminWisata /></ProtectedRoute>} />
      <Route path="/admin/transaksi" component={() => <ProtectedRoute roles={["admin"]}><AdminTransaksi /></ProtectedRoute>} />
      <Route path="/admin/pengaturan" component={() => <ProtectedRoute roles={["admin"]}><AdminPengaturan /></ProtectedRoute>} />
      <Route path="/petugas/scanner" component={() => <ProtectedRoute roles={["staff", "admin"]}><PetugasScanner /></ProtectedRoute>} />
      <Route path="/profil" component={() => <ProtectedRoute><Profil /></ProtectedRoute>} />
      <Route path="/profil/reservasi" component={() => <ProtectedRoute><ReservasiSaya /></ProtectedRoute>} />
      <Route path="/destinasi/:id/ulasan" component={SemuaUlasan} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
