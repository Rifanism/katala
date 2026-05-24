--
-- PostgreSQL database dump
--

\restrict 56GHnjHF7s1Uvhz8lhyHOWTfEdfdKyfhXPcLNMWn5Gx7QkU0oEKxCywXZyVJfsE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: reservation_status; Type: TYPE; Schema: public; Owner: katala
--

CREATE TYPE public.reservation_status AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'expired'
);


ALTER TYPE public.reservation_status OWNER TO katala;

--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: katala
--

CREATE TYPE public.ticket_status AS ENUM (
    'valid',
    'used',
    'expired'
);


ALTER TYPE public.ticket_status OWNER TO katala;

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: katala
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'expired',
    'refunded'
);


ALTER TYPE public.transaction_status OWNER TO katala;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: katala
--

CREATE TYPE public.user_role AS ENUM (
    'tourist',
    'admin',
    'staff'
);


ALTER TYPE public.user_role OWNER TO katala;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: destinations; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.destinations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    location character varying(255) NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    price numeric(12,2) NOT NULL,
    daily_quota integer DEFAULT 100 NOT NULL,
    category character varying(100) NOT NULL,
    image_url text NOT NULL,
    rating numeric(3,1),
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.destinations OWNER TO katala;

--
-- Name: destinations_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.destinations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.destinations_id_seq OWNER TO katala;

--
-- Name: destinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.destinations_id_seq OWNED BY public.destinations.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    destination_id integer NOT NULL,
    reservation_id integer NOT NULL,
    rating integer NOT NULL,
    review text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO katala;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO katala;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    destination_id integer NOT NULL,
    visit_date date NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(12,2) NOT NULL,
    status public.reservation_status DEFAULT 'pending'::public.reservation_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reservations OWNER TO katala;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO katala;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.sessions (
    token character varying(64) NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO katala;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    reservation_id integer NOT NULL,
    ticket_code character varying(64) NOT NULL,
    qr_code_data text NOT NULL,
    status public.ticket_status DEFAULT 'valid'::public.ticket_status NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tickets OWNER TO katala;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO katala;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    reservation_id integer NOT NULL,
    order_id character varying(128) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status NOT NULL,
    payment_type character varying(64),
    midtrans_transaction_id character varying(128),
    snap_token text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO katala;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO katala;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: katala
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'tourist'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO katala;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: katala
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO katala;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: katala
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: destinations id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.destinations ALTER COLUMN id SET DEFAULT nextval('public.destinations_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: destinations; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.destinations (id, name, description, location, latitude, longitude, price, daily_quota, category, image_url, rating, featured, created_at) FROM stdin;
1	Pantai Mutun	Pantai Mutun adalah salah satu destinasi wisata pantai yang indah di Lampung. Terletak di Pesawaran, pantai ini menawarkan pasir putih yang bersih, air laut yang jernih, dan pemandangan matahari terbenam yang memukau. Tersedia berbagai wahana air dan fasilitas lengkap untuk kenyamanan wisatawan.	Pesawaran, Lampung	-5.5068000	105.2340000	25000.00	500	Pantai	https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800	4.5	t	2026-05-15 18:20:27.081707
3	Danau Ranau	Danau Ranau adalah danau terbesar kedua di Sumatera yang terletak di perbatasan Lampung Barat dan Sumatera Selatan. Dikelilingi oleh Gunung Seminung yang megah, danau ini menawarkan pemandangan alam yang spektakuler dengan udara sejuk dan segar. Cocok untuk wisata keluarga dan fotografi.	Lampung Barat, Lampung	-4.8740000	103.9300000	20000.00	400	Danau	https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800	4.6	t	2026-05-15 18:20:27.115872
5	Way Kambas National Park	Taman Nasional Way Kambas adalah salah satu kawasan konservasi gajah sumatera tertua di Indonesia. Di sini pengunjung dapat melihat gajah sumatera, badak, harimau, dan berbagai satwa liar lainnya. Pusat Latihan Gajah menjadi atraksi utama yang sangat populer bagi wisatawan.	Lampung Timur, Lampung	-5.0540000	105.6450000	30000.00	350	Ekowisata	https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800	4.7	f	2026-05-15 18:20:27.125559
6	Curup Terjun Putri Malu	Air Terjun Putri Malu merupakan salah satu air terjun tersembunyi yang indah di Lampung Barat. Dengan ketinggian sekitar 40 meter, air terjun ini dikelilingi hutan tropis yang lebat dan udara yang sejuk. Perjalanan menuju air terjun menawarkan pengalaman trekking yang menyenangkan.	Lampung Barat, Lampung	-5.0800000	104.0200000	15000.00	150	Air Terjun	https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800	4.4	f	2026-05-15 18:20:27.132043
7	Museum Lampung	Museum Lampung Ruwa Jurai merupakan museum negeri yang menyimpan koleksi artefak dan warisan budaya Lampung. Pengunjung dapat mempelajari sejarah, adat istiadat, dan kebudayaan masyarakat Lampung melalui berbagai pameran yang informatif. Lokasi yang strategis di pusat kota membuatnya mudah dikunjungi.	Bandar Lampung, Lampung	-5.3971000	105.2664000	10000.00	600	Budaya	https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800	4.2	f	2026-05-15 18:20:27.139879
2	Pahawang Island	Pulau Pahawang merupakan surga bawah laut di Lampung dengan terumbu karang yang masih terjaga dan ikan-ikan berwarna-warni. Aktivitas snorkeling dan diving menjadi daya tarik utama pulau ini. Air lautnya yang jernih memungkinkan pengunjung melihat keindahan bawah laut dengan jelas.	Pesawaran, Lampung	-5.6200000	105.1800000	75000.00	300	Bahari	https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800	4.0	t	2026-05-15 18:20:27.1102
8	Tanjung Setia Beach	Pantai Tanjung Setia dikenal sebagai salah satu destinasi selancar terbaik di Asia Tenggara. Ombaknya yang konsisten dan tinggi mencapai 4-7 meter menarik peselancar dari seluruh dunia. Selain surfing, pantai ini juga menawarkan keindahan sunset yang luar biasa dan suasana yang tenang.	Pesisir Barat, Lampung	-5.7320000	104.0480000	20000.00	250	Pantai	https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800	2.0	f	2026-05-15 18:20:27.16259
4	Teluk Kiluan	Teluk Kiluan terkenal sebagai surga lumba-lumba di Lampung. Setiap pagi, ratusan lumba-lumba hidung botol bermain di perairan teluk ini. Selain lumba-lumba, pengunjung bisa menikmati keindahan pantai, snorkeling, dan mengunjungi pulau-pulau kecil di sekitarnya.	Tanggamus, Lampung	-5.6890000	104.9170000	50000.00	200	Bahari	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800	5.0	t	2026-05-15 18:20:27.121177
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.ratings (id, user_id, destination_id, reservation_id, rating, review, created_at) FROM stdin;
1	4	4	5	5	Bagusss	2026-05-16 20:18:43.634813
2	4	2	1	5	Anjayy	2026-05-17 19:47:04.767249
3	1	2	6	3	pas ujan jelek	2026-05-17 19:52:45.215621
4	4	8	8	2	jelek anjg	2026-05-17 21:15:28.501272
5	4	4	12	5	Bagus bangettt	2026-05-22 21:07:34.296749
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.reservations (id, user_id, destination_id, visit_date, quantity, total_price, status, created_at) FROM stdin;
1	4	2	2026-05-15	4	300000.00	paid	2026-05-15 19:04:26.753284
4	1	5	2026-05-20	7	210000.00	paid	2026-05-16 10:20:09.697852
5	4	4	2026-05-21	6	300000.00	paid	2026-05-16 19:57:20.802803
6	1	2	2026-05-18	12	900000.00	paid	2026-05-17 19:48:00.683118
7	1	3	2026-05-18	2	40000.00	pending	2026-05-17 19:56:13.00972
8	4	8	2026-05-19	3	60000.00	paid	2026-05-17 20:06:46.085116
3	4	3	2026-05-23	1	20000.00	expired	2026-05-15 19:58:40.081711
2	4	3	2026-05-23	2	40000.00	expired	2026-05-15 19:57:21.737457
12	4	4	2026-05-20	3	150000.00	paid	2026-05-18 14:21:29.894239
11	4	5	2026-05-20	1	30000.00	expired	2026-05-17 21:14:04.078434
10	4	7	2026-05-18	1	10000.00	expired	2026-05-17 21:02:25.339009
9	4	1	2026-05-18	2	50000.00	expired	2026-05-17 20:48:34.540507
13	4	2	2026-05-22	1	75000.00	paid	2026-05-22 21:09:05.631075
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.sessions (token, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.tickets (id, reservation_id, ticket_code, qr_code_data, status, used_at, created_at) FROM stdin;
5	4	KTL-MP7S3TOK-CAA9DE22	{"ticketCode" : "KTL-MP7S3TOK-CAA9DE22", "reservationId" : 4, "destinationId" : 5, "visitDate" : "2026-05-20", "quantity" : 7, "issuer" : "KATALA"}	valid	\N	2026-05-16 10:20:39.42892
12	5	KTL-MP8D9UWK-39EDD5EA	{"ticketCode" : "KTL-MP8D9UWK-39EDD5EA", "reservationId" : 5, "destinationId" : 4, "visitDate" : "2026-05-21", "quantity" : 6, "issuer" : "KATALA"}	used	2026-05-16 13:17:24.944	2026-05-16 20:13:12.885657
1	1	KTL-MP6WCI65-55EAA6DD	{"ticketCode" : "KTL-MP6WCI65-55EAA6DD", "reservationId" : 1, "destinationId" : 2, "visitDate" : "2026-05-15", "quantity" : 4, "issuer" : "KATALA"}	used	2026-05-17 12:45:51.541	2026-05-15 19:31:36.701554
13	6	KTL-MP9RVXAE-50EE97AC	{"ticketCode" : "KTL-MP9RVXAE-50EE97AC", "reservationId" : 6, "destinationId" : 2, "visitDate" : "2026-05-18", "quantity" : 12, "issuer" : "KATALA"}	used	2026-05-17 12:52:12.437	2026-05-17 19:50:03.207317
14	8	KTL-MP9SK0TL-83CC7B95	{"ticketCode" : "KTL-MP9SK0TL-83CC7B95", "reservationId" : 8, "destinationId" : 8, "visitDate" : "2026-05-19", "quantity" : 3, "issuer" : "KATALA"}	used	2026-05-17 14:14:53.977	2026-05-17 20:08:47.530173
15	12	KTL-MPAVLF1T-8425C457	{"ticketCode":"KTL-MPAVLF1T-8425C457","reservationId":12,"destinationId":4,"visitDate":"2026-05-20","quantity":3,"issuer":"KATALA"}	used	2026-05-18 07:27:02.572	2026-05-18 14:21:37.650361
16	13	KTL-MPGZXZVP-E22DDEFD	{"ticketCode":"KTL-MPGZXZVP-E22DDEFD","reservationId":13,"destinationId":2,"visitDate":"2026-05-22","quantity":1,"issuer":"KATALA"}	used	2026-05-22 14:15:05.299	2026-05-22 21:10:00.038343
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.transactions (id, reservation_id, order_id, amount, status, payment_type, midtrans_transaction_id, snap_token, created_at, updated_at, expires_at) FROM stdin;
1	1	KATALA-MP6VE1K6-9AF82F	300000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MP6VE1K6-9AF82F	2026-05-15 19:04:48.871394	2026-05-15 12:31:36.689	2026-05-15 19:19:48.871394
4	4	KATALA-MP7S3PKV-603709	210000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MP7S3PKV-603709	2026-05-16 10:20:34.113193	2026-05-16 03:20:39.411	2026-05-16 10:35:34.113193
5	5	KATALA-MP8CPKJ7-9BE479	300000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MP8CPKJ7-9BE479	2026-05-16 19:57:26.323981	2026-05-16 13:13:12.867	2026-05-16 20:12:26.323981
6	6	KATALA-MP9RTI6J-F5BAA3	900000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MP9RTI6J-F5BAA3	2026-05-17 19:48:10.316611	2026-05-17 12:50:03.191	2026-05-17 20:03:10.316611
7	7	KATALA-MP9S3XGY-CDA00C	40000.00	pending	\N	\N	DEMO_TOKEN_KATALA-MP9S3XGY-CDA00C	2026-05-17 19:56:16.691511	2026-05-17 12:56:16.69	2026-05-17 20:11:16.691511
8	8	KATALA-MP9SIZQP-4301A6	60000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MP9SIZQP-4301A6	2026-05-17 20:07:59.47353	2026-05-17 13:08:47.515	2026-05-17 20:22:59.47353
3	3	KATALA-MP6XBH44-EA9A35	20000.00	expired	\N	\N	DEMO_TOKEN_KATALA-MP6XBH44-EA9A35	2026-05-15 19:58:48.293198	2026-05-17 14:02:33.165	2026-05-15 20:13:48.293198
2	2	KATALA-MP6XAR6S-2A8E25	40000.00	expired	\N	\N	DEMO_TOKEN_KATALA-MP6XAR6S-2A8E25	2026-05-15 19:58:14.693189	2026-05-17 14:02:33.17	2026-05-15 20:13:14.693189
12	12	KATALA-MPAVLBWW-024532	150000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MPAVLBWW-024532	2026-05-18 14:21:33.587105	2026-05-18 07:21:37.627	2026-05-18 07:36:33.583
11	11	KATALA-MP9UW015-18B3A6	30000.00	expired	\N	\N	DEMO_TOKEN_KATALA-MP9UW015-18B3A6	2026-05-17 21:14:05.610482	2026-05-18 07:22:09.799	2026-05-17 14:29:05.609
10	10	KATALA-MP9UH13F-87BD62	10000.00	expired	\N	\N	DEMO_TOKEN_KATALA-MP9UH13F-87BD62	2026-05-17 21:02:27.148111	2026-05-18 07:22:09.831	2026-05-17 21:17:27.148111
9	9	KATALA-MP9TZA3M-D6E298	50000.00	expired	\N	\N	DEMO_TOKEN_KATALA-MP9TZA3M-D6E298	2026-05-17 20:48:39.011846	2026-05-18 07:22:09.834	2026-05-17 21:03:39.011846
13	13	KATALA-MPGZXLH1-2AF3BE	75000.00	paid	\N	\N	DEMO_TOKEN_KATALA-MPGZXLH1-2AF3BE	2026-05-22 21:09:41.366284	2026-05-22 14:10:00.031	2026-05-22 14:24:41.365
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: katala
--

COPY public.users (id, name, email, password_hash, role, created_at) FROM stdin;
1	Budi Santoso	budi@example.com	$2b$10$3sa1XWeGqiuP/qUKr6dCtei588d89sU/bfTjKawqvIBkwdKz7Jt8e	tourist	2026-05-15 18:20:26.930313
2	Admin KATALA	admin@katala.id	$2b$10$EGP7m.85wA7kc5aAK9.VWubn80CNJeRxmmIdgyFoVEJSBI7ikkL1G	admin	2026-05-15 18:20:27.000883
3	Petugas Scanner	petugas@katala.id	$2b$10$ttDG8nXYxWseNIT.ksLAMureaw7l5fv8MToWSBy8m3DuTcnEFlwqO	staff	2026-05-15 18:20:27.069493
4	Agnes Pusvita Sari	agnesajja@gmail.com	$2b$10$Dwml7rwRRV2ZqKBaDJXjVekVULPc0wEkzPjPJH1bjt.CppzicrWLy	tourist	2026-05-15 18:54:58.39838
\.


--
-- Name: destinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.destinations_id_seq', 10, true);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.ratings_id_seq', 5, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.reservations_id_seq', 13, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.tickets_id_seq', 16, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.transactions_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: katala
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: destinations destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_code_unique; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_code_unique UNIQUE (ticket_code);


--
-- Name: transactions transactions_order_id_unique; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_unique UNIQUE (order_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: katala
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: ratings_destination_id_idx; Type: INDEX; Schema: public; Owner: katala
--

CREATE INDEX ratings_destination_id_idx ON public.ratings USING btree (destination_id);


--
-- Name: ratings_user_reservation_unique; Type: INDEX; Schema: public; Owner: katala
--

CREATE UNIQUE INDEX ratings_user_reservation_unique ON public.ratings USING btree (user_id, reservation_id);


--
-- Name: ratings ratings_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id);


--
-- Name: ratings ratings_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);


--
-- Name: ratings ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reservations reservations_destination_id_destinations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_destination_id_destinations_id_fk FOREIGN KEY (destination_id) REFERENCES public.destinations(id);


--
-- Name: reservations reservations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_reservation_id_reservations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_reservation_id_reservations_id_fk FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);


--
-- Name: transactions transactions_reservation_id_reservations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: katala
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_reservation_id_reservations_id_fk FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 56GHnjHF7s1Uvhz8lhyHOWTfEdfdKyfhXPcLNMWn5Gx7QkU0oEKxCywXZyVJfsE

