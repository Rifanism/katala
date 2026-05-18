import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import bcrypt from "bcrypt";
import {
  usersTable,
  destinationsTable,
} from "./schema/index.js";

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run with --env-file=../../.env");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const SALT_ROUNDS = 10;

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { name: "Budi Santoso", email: "budi@example.com", password: "tourist123", role: "tourist" as const },
    { name: "Admin KATALA", email: "admin@katala.id", password: "admin123", role: "admin" as const },
    { name: "Petugas Scanner", email: "petugas@katala.id", password: "staff123", role: "staff" as const },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await db.insert(usersTable).values({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
    }).onConflictDoNothing();
    console.log(`  ✓ User: ${u.email}`);
  }

  // ── Destinations ───────────────────────────────────────────────────────────
  const destinations = [
    {
      name: "Pantai Mutun",
      description: "Pantai Mutun adalah salah satu destinasi wisata pantai yang indah di Lampung. Terletak di Pesawaran, pantai ini menawarkan pasir putih yang bersih, air laut yang jernih, dan pemandangan matahari terbenam yang memukau. Tersedia berbagai wahana air dan fasilitas lengkap untuk kenyamanan wisatawan.",
      location: "Pesawaran, Lampung",
      latitude: "-5.5068",
      longitude: "105.2340",
      price: "25000",
      dailyQuota: 500,
      category: "Pantai",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      rating: "4.5",
      featured: true,
    },
    {
      name: "Pahawang Island",
      description: "Pulau Pahawang merupakan surga bawah laut di Lampung dengan terumbu karang yang masih terjaga dan ikan-ikan berwarna-warni. Aktivitas snorkeling dan diving menjadi daya tarik utama pulau ini. Air lautnya yang jernih memungkinkan pengunjung melihat keindahan bawah laut dengan jelas.",
      location: "Pesawaran, Lampung",
      latitude: "-5.6200",
      longitude: "105.1800",
      price: "75000",
      dailyQuota: 300,
      category: "Bahari",
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
      rating: "4.8",
      featured: true,
    },
    {
      name: "Danau Ranau",
      description: "Danau Ranau adalah danau terbesar kedua di Sumatera yang terletak di perbatasan Lampung Barat dan Sumatera Selatan. Dikelilingi oleh Gunung Seminung yang megah, danau ini menawarkan pemandangan alam yang spektakuler dengan udara sejuk dan segar. Cocok untuk wisata keluarga dan fotografi.",
      location: "Lampung Barat, Lampung",
      latitude: "-4.8740",
      longitude: "103.9300",
      price: "20000",
      dailyQuota: 400,
      category: "Danau",
      imageUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800",
      rating: "4.6",
      featured: true,
    },
    {
      name: "Teluk Kiluan",
      description: "Teluk Kiluan terkenal sebagai surga lumba-lumba di Lampung. Setiap pagi, ratusan lumba-lumba hidung botol bermain di perairan teluk ini. Selain lumba-lumba, pengunjung bisa menikmati keindahan pantai, snorkeling, dan mengunjungi pulau-pulau kecil di sekitarnya.",
      location: "Tanggamus, Lampung",
      latitude: "-5.6890",
      longitude: "104.9170",
      price: "50000",
      dailyQuota: 200,
      category: "Bahari",
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      rating: "4.7",
      featured: true,
    },
    {
      name: "Way Kambas National Park",
      description: "Taman Nasional Way Kambas adalah salah satu kawasan konservasi gajah sumatera tertua di Indonesia. Di sini pengunjung dapat melihat gajah sumatera, badak, harimau, dan berbagai satwa liar lainnya. Pusat Latihan Gajah menjadi atraksi utama yang sangat populer bagi wisatawan.",
      location: "Lampung Timur, Lampung",
      latitude: "-5.0540",
      longitude: "105.6450",
      price: "30000",
      dailyQuota: 350,
      category: "Ekowisata",
      imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800",
      rating: "4.7",
      featured: false,
    },
    {
      name: "Curup Terjun Putri Malu",
      description: "Air Terjun Putri Malu merupakan salah satu air terjun tersembunyi yang indah di Lampung Barat. Dengan ketinggian sekitar 40 meter, air terjun ini dikelilingi hutan tropis yang lebat dan udara yang sejuk. Perjalanan menuju air terjun menawarkan pengalaman trekking yang menyenangkan.",
      location: "Lampung Barat, Lampung",
      latitude: "-5.0800",
      longitude: "104.0200",
      price: "15000",
      dailyQuota: 150,
      category: "Air Terjun",
      imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800",
      rating: "4.4",
      featured: false,
    },
    {
      name: "Museum Lampung",
      description: "Museum Lampung Ruwa Jurai merupakan museum negeri yang menyimpan koleksi artefak dan warisan budaya Lampung. Pengunjung dapat mempelajari sejarah, adat istiadat, dan kebudayaan masyarakat Lampung melalui berbagai pameran yang informatif. Lokasi yang strategis di pusat kota membuatnya mudah dikunjungi.",
      location: "Bandar Lampung, Lampung",
      latitude: "-5.3971",
      longitude: "105.2664",
      price: "10000",
      dailyQuota: 600,
      category: "Budaya",
      imageUrl: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800",
      rating: "4.2",
      featured: false,
    },
    {
      name: "Tanjung Setia Beach",
      description: "Pantai Tanjung Setia dikenal sebagai salah satu destinasi selancar terbaik di Asia Tenggara. Ombaknya yang konsisten dan tinggi mencapai 4-7 meter menarik peselancar dari seluruh dunia. Selain surfing, pantai ini juga menawarkan keindahan sunset yang luar biasa dan suasana yang tenang.",
      location: "Pesisir Barat, Lampung",
      latitude: "-5.7320",
      longitude: "104.0480",
      price: "20000",
      dailyQuota: 250,
      category: "Pantai",
      imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800",
      rating: "4.9",
      featured: false,
    },
  ];

  for (const dest of destinations) {
    await db.insert(destinationsTable).values(dest as any).onConflictDoNothing();
    console.log(`  ✓ Destination: ${dest.name}`);
  }

  console.log("\n✅ Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Tourist : budi@example.com    / tourist123");
  console.log("  Admin   : admin@katala.id      / admin123");
  console.log("  Staff   : petugas@katala.id   / staff123");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
