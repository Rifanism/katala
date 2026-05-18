import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, MapPin, Ticket, LogOut, User, LayoutDashboard, ScanLine, Settings, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/destinasi", label: "Destinasi" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8B0000" }}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-katala text-xl font-bold text-stone-900">Katala</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user.name.split(" ")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => setLocation("/admin/dashboard")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard Admin
                    </DropdownMenuItem>
                  )}
                  {user.role === "staff" && (
                    <DropdownMenuItem onClick={() => setLocation("/petugas/scanner")}>
                      <ScanLine className="w-4 h-4 mr-2" />
                      Scanner Tiket
                    </DropdownMenuItem>
                  )}
                  {user.role === "tourist" && (
                    <>
                      <DropdownMenuItem onClick={() => setLocation("/profil")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Profil Saya
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/profil/reservasi")}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Reservasi Saya
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/profil/tiket-saya")}>
                        <Ticket className="w-4 h-4 mr-2" />
                        Tiket Saya
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" data-testid="btn-login">Masuk</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" data-testid="btn-register" style={{ backgroundColor: "#8B0000" }} className="text-white hover:opacity-90">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-stone-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="btn-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-stone-100 bg-white"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-medium text-stone-700 py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  {user.role === "tourist" && (
                    <>
                      <Link href="/profil" className="block text-sm font-medium text-stone-700 py-1" onClick={() => setMobileOpen(false)}>
                        Profil Saya
                      </Link>
                      <Link href="/profil/reservasi" className="block text-sm font-medium text-stone-700 py-1" onClick={() => setMobileOpen(false)}>
                        Reservasi Saya
                      </Link>
                      <Link href="/profil/tiket-saya" className="block text-sm font-medium text-stone-700 py-1" onClick={() => setMobileOpen(false)}>
                        Tiket Saya
                      </Link>
                    </>
                  )}
                  <button onClick={handleLogout} className="block text-sm font-medium text-red-600 py-1">
                    Keluar
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm">Masuk</Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" style={{ backgroundColor: "#8B0000" }} className="text-white">Daftar</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
