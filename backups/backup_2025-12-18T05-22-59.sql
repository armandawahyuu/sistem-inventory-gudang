--
-- PostgreSQL database dump
--

\restrict CzdrufY6ZS7H7wMTPqv1FG8gqGETFtyBMiWaCBeLuNCwRJPJJ3UTehH9ulyv7NR

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    "clockIn" timestamp(3) without time zone,
    "clockOut" timestamp(3) without time zone,
    status text DEFAULT 'present'::text NOT NULL,
    "overtimeHours" double precision DEFAULT 0,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO armanda;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "userName" text,
    action text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text,
    "dataBefore" jsonb,
    "dataAfter" jsonb,
    "ipAddress" text,
    "userAgent" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO armanda;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO armanda;

--
-- Name: CleanupLog; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."CleanupLog" (
    id text NOT NULL,
    action text NOT NULL,
    type text,
    description text NOT NULL,
    "affectedCount" integer DEFAULT 0 NOT NULL,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


ALTER TABLE public."CleanupLog" OWNER TO armanda;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    nik text NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    department text,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Employee" OWNER TO armanda;

--
-- Name: EquipmentCompatibility; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."EquipmentCompatibility" (
    id text NOT NULL,
    "sparepartId" text NOT NULL,
    "equipmentType" text NOT NULL,
    "equipmentBrand" text,
    "equipmentModel" text
);


ALTER TABLE public."EquipmentCompatibility" OWNER TO armanda;

--
-- Name: HeavyEquipment; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."HeavyEquipment" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer,
    site text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HeavyEquipment" OWNER TO armanda;

--
-- Name: ImportLog; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."ImportLog" (
    id text NOT NULL,
    type text NOT NULL,
    "totalRows" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "failedRows" integer DEFAULT 0 NOT NULL,
    filename text,
    "skippedRows" integer DEFAULT 0 NOT NULL,
    "successRows" integer DEFAULT 0 NOT NULL,
    errors jsonb
);


ALTER TABLE public."ImportLog" OWNER TO armanda;

--
-- Name: LoginAttempt; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."LoginAttempt" (
    id text NOT NULL,
    username text NOT NULL,
    "ipAddress" text NOT NULL,
    "userAgent" text,
    success boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LoginAttempt" OWNER TO armanda;

--
-- Name: PettyCash; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."PettyCash" (
    id text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    "categoryId" text,
    amount double precision NOT NULL,
    description text NOT NULL,
    receipt text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PettyCash" OWNER TO armanda;

--
-- Name: PettyCashCategory; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."PettyCashCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PettyCashCategory" OWNER TO armanda;

--
-- Name: SecurityLog; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."SecurityLog" (
    id text NOT NULL,
    "eventType" text NOT NULL,
    "userId" text,
    "userName" text,
    "ipAddress" text NOT NULL,
    "userAgent" text,
    details jsonb,
    "riskLevel" text DEFAULT 'low'::text NOT NULL,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SecurityLog" OWNER TO armanda;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO armanda;

--
-- Name: Sparepart; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Sparepart" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    brand text,
    unit text NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    "currentStock" integer DEFAULT 0 NOT NULL,
    "rackLocation" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sparepart" OWNER TO armanda;

--
-- Name: StockIn; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."StockIn" (
    id text NOT NULL,
    "sparepartId" text NOT NULL,
    quantity integer NOT NULL,
    "supplierId" text,
    "invoiceNumber" text,
    "purchasePrice" double precision,
    "warrantyExpiry" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockIn" OWNER TO armanda;

--
-- Name: StockOpname; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."StockOpname" (
    id text NOT NULL,
    "opnameDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public."StockOpname" OWNER TO armanda;

--
-- Name: StockOpnameItem; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."StockOpnameItem" (
    id text NOT NULL,
    "opnameId" text NOT NULL,
    "sparepartId" text NOT NULL,
    "systemStock" integer NOT NULL,
    "physicalStock" integer NOT NULL,
    difference integer NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockOpnameItem" OWNER TO armanda;

--
-- Name: StockOut; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."StockOut" (
    id text NOT NULL,
    "sparepartId" text NOT NULL,
    "equipmentId" text,
    "employeeId" text,
    quantity integer NOT NULL,
    purpose text,
    status text DEFAULT 'pending'::text NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectedReason" text,
    "scannedBarcode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StockOut" OWNER TO armanda;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO armanda;

--
-- Name: TokenBlacklist; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."TokenBlacklist" (
    id text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TokenBlacklist" OWNER TO armanda;

--
-- Name: User; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'supervisor'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "lastLoginIp" text,
    "lockedUntil" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO armanda;

--
-- Name: Warranty; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public."Warranty" (
    id text NOT NULL,
    "stockInId" text NOT NULL,
    "sparepartId" text NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "claimStatus" text DEFAULT 'active'::text NOT NULL,
    "claimDate" timestamp(3) without time zone,
    "claimNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Warranty" OWNER TO armanda;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: armanda
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO armanda;

--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Attendance" (id, "employeeId", date, "clockIn", "clockOut", status, "overtimeHours", notes, "createdAt") FROM stdin;
cmj197b1s007mz7p04kapn1lw	cmj197axe004tz7p0yu7z99df	2025-12-04	2025-12-05 01:08:00	2025-12-05 09:13:00	late	1	\N	2025-12-11 09:46:38.128
cmj197b1v007nz7p019o6vq92	cmj197ay50050z7p0yic5t20i	2025-11-20	2025-11-21 00:40:00	2025-11-21 09:38:00	present	0	\N	2025-12-11 09:46:38.131
cmj197b1x007oz7p0ogbvwe2i	cmj197ayb0054z7p021elxljy	2025-11-28	2025-11-29 01:33:00	2025-11-29 10:39:00	late	2	\N	2025-12-11 09:46:38.133
cmj197b1y007pz7p08mzi0bz8	cmj197awj004pz7p048kj1knk	2025-11-27	2025-11-28 01:54:00	2025-11-28 11:22:00	late	1	\N	2025-12-11 09:46:38.134
cmj197b1z007qz7p0h62qsyyp	cmj197axe004tz7p0yu7z99df	2025-11-13	2025-11-14 00:53:00	2025-11-14 09:15:00	present	3	\N	2025-12-11 09:46:38.135
cmj197b21007rz7p0s08g4zxx	cmj197axu004vz7p0on1s4rzj	2025-11-28	2025-11-29 02:25:00	2025-11-29 09:30:00	late	3	\N	2025-12-11 09:46:38.137
cmj197b22007sz7p0je2x8qoj	cmj197axd004sz7p0xngiwr47	2025-11-21	2025-11-22 00:29:00	2025-11-22 09:45:00	present	2	\N	2025-12-11 09:46:38.138
cmj197b23007tz7p0da7nbkcw	cmj197ay70051z7p0oaz10o4d	2025-11-23	2025-11-24 00:20:00	2025-11-24 09:25:00	present	3	\N	2025-12-11 09:46:38.139
cmj197b25007uz7p0elmjxuvc	cmj197avh004nz7p0enqapqbp	2025-11-29	2025-11-30 01:34:00	2025-11-30 10:58:00	late	1	\N	2025-12-11 09:46:38.141
cmj197b27007vz7p04iwd48ow	cmj197ay80052z7p0hmdnv285	2025-11-30	2025-12-01 01:48:00	2025-12-01 10:52:00	late	1	\N	2025-12-11 09:46:38.143
cmj197b29007wz7p0i0wy0wo0	cmj197ay50050z7p0yic5t20i	2025-11-22	2025-11-23 00:51:00	2025-11-23 10:56:00	present	3	\N	2025-12-11 09:46:38.145
cmj197b2a007xz7p0tu6htpuo	cmj197avp004oz7p02d51ksb2	2025-11-26	2025-11-27 01:13:00	2025-11-27 11:02:00	late	3	\N	2025-12-11 09:46:38.146
cmj197b2b007yz7p0xfn35jh7	cmj197avh004nz7p0enqapqbp	2025-11-16	2025-11-17 02:14:00	2025-11-17 10:07:00	late	2	\N	2025-12-11 09:46:38.147
cmj197b2d007zz7p09vuhjc38	cmj197axd004sz7p0xngiwr47	2025-11-29	2025-11-30 00:26:00	2025-11-30 10:03:00	present	0	\N	2025-12-11 09:46:38.149
cmj197b2f0080z7p0i3cx1vyl	cmj197ay80052z7p0hmdnv285	2025-11-17	2025-11-18 01:55:00	2025-11-18 10:19:00	late	1	\N	2025-12-11 09:46:38.151
cmj197b2h0081z7p0p4pzc88v	cmj197awj004pz7p048kj1knk	2025-12-06	2025-12-07 02:29:00	2025-12-07 11:52:00	late	3	\N	2025-12-11 09:46:38.153
cmj197b2i0082z7p0755hciy6	cmj197ay80052z7p0hmdnv285	2025-11-26	2025-11-27 00:04:00	2025-11-27 09:46:00	present	0	\N	2025-12-11 09:46:38.154
cmj197b2j0083z7p0xgig4ut1	cmj197ay1004yz7p0zf4knv42	2025-12-02	2025-12-03 00:29:00	2025-12-03 11:07:00	present	1	\N	2025-12-11 09:46:38.155
cmj197b2l0084z7p0as216vdw	cmj197ayb0054z7p021elxljy	2025-11-14	2025-11-15 00:56:00	2025-11-15 09:37:00	present	0	\N	2025-12-11 09:46:38.157
cmj197b2m0085z7p05e9k0u0x	cmj197axe004tz7p0yu7z99df	2025-11-22	2025-11-23 00:03:00	2025-11-23 10:22:00	present	3	\N	2025-12-11 09:46:38.158
cmj197b2o0086z7p0cboqyhtn	cmj197ay80052z7p0hmdnv285	2025-11-10	2025-11-11 01:09:00	2025-11-11 10:14:00	late	0	\N	2025-12-11 09:46:38.16
cmj197b2p0087z7p0loo7k558	cmj197ay50050z7p0yic5t20i	2025-11-21	2025-11-22 00:09:00	2025-11-22 09:49:00	present	0	\N	2025-12-11 09:46:38.161
cmj197b2q0088z7p0m2tpol92	cmj197ay50050z7p0yic5t20i	2025-11-19	2025-11-20 01:19:00	2025-11-20 11:46:00	late	3	\N	2025-12-11 09:46:38.162
cmj197b2r0089z7p0heloojme	cmj197axk004uz7p0ohqjk7el	2025-11-19	2025-11-20 00:36:00	2025-11-20 10:45:00	present	0	\N	2025-12-11 09:46:38.163
cmj197b2t008az7p0hjwndqse	cmj197ay3004zz7p0mxy17hoi	2025-12-09	2025-12-10 01:42:00	2025-12-10 10:24:00	late	1	\N	2025-12-11 09:46:38.165
cmj197b2u008bz7p03qgrxrl7	cmj197ay70051z7p0oaz10o4d	2025-11-30	2025-12-01 02:53:00	2025-12-01 11:55:00	late	0	\N	2025-12-11 09:46:38.166
cmj197b2w008cz7p0wmopeuti	cmj197axb004rz7p0q43g17eg	2025-11-27	2025-11-28 00:22:00	2025-11-28 10:53:00	present	3	\N	2025-12-11 09:46:38.168
cmj197b2x008dz7p0dsa6v53u	cmj197axe004tz7p0yu7z99df	2025-12-03	2025-12-04 00:56:00	2025-12-04 11:09:00	present	2	\N	2025-12-11 09:46:38.169
cmj197b2y008ez7p0m6npsvlz	cmj197ayd0055z7p005jjyzm1	2025-11-19	2025-11-20 02:00:00	2025-11-20 10:12:00	late	2	\N	2025-12-11 09:46:38.17
cmj197b31008fz7p02xnzd3sg	cmj197ayb0054z7p021elxljy	2025-11-26	2025-11-27 00:08:00	2025-11-27 10:04:00	present	1	\N	2025-12-11 09:46:38.173
cmj197b32008gz7p0hmshzng3	cmj197axb004rz7p0q43g17eg	2025-12-05	2025-12-06 02:18:00	2025-12-06 11:11:00	late	1	\N	2025-12-11 09:46:38.174
cmj197b34008hz7p030unxd4y	cmj197axu004vz7p0on1s4rzj	2025-11-13	2025-11-14 00:34:00	2025-11-14 09:44:00	present	2	\N	2025-12-11 09:46:38.176
cmj197b35008iz7p0o2dn3rx5	cmj197ay70051z7p0oaz10o4d	2025-11-15	2025-11-16 01:51:00	2025-11-16 11:24:00	late	1	\N	2025-12-11 09:46:38.177
cmj197b36008jz7p0lppyxc8f	cmj197ay70051z7p0oaz10o4d	2025-12-01	2025-12-02 00:19:00	2025-12-02 11:34:00	present	3	\N	2025-12-11 09:46:38.178
cmj197b37008kz7p0wja45egc	cmj197av4004mz7p02ml0myd9	2025-12-02	2025-12-03 01:49:00	2025-12-03 09:36:00	late	2	\N	2025-12-11 09:46:38.179
cmj197b38008lz7p0r2uga6j4	cmj197aya0053z7p0dpc5iw7z	2025-11-26	2025-11-27 02:10:00	2025-11-27 11:38:00	late	1	\N	2025-12-11 09:46:38.18
cmj197b39008mz7p06c9vznv4	cmj197ay1004yz7p0zf4knv42	2025-12-09	2025-12-10 00:40:00	2025-12-10 10:00:00	present	2	\N	2025-12-11 09:46:38.181
cmj197b3a008nz7p0q7hdgmsk	cmj197ay3004zz7p0mxy17hoi	2025-12-06	2025-12-07 01:30:00	2025-12-07 10:25:00	late	3	\N	2025-12-11 09:46:38.182
cmj197b3c008oz7p08b2xcvb7	cmj197ay50050z7p0yic5t20i	2025-12-04	2025-12-05 00:38:00	2025-12-05 09:37:00	present	0	\N	2025-12-11 09:46:38.184
cmj197b3e008pz7p0ycore3mw	cmj197axb004rz7p0q43g17eg	2025-11-12	2025-11-13 00:19:00	2025-11-13 10:11:00	present	0	\N	2025-12-11 09:46:38.186
cmj197b3f008qz7p03mtqj0em	cmj197ayb0054z7p021elxljy	2025-11-22	2025-11-23 02:57:00	2025-11-23 11:09:00	late	2	\N	2025-12-11 09:46:38.187
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."AuditLog" (id, "userId", "userName", action, "tableName", "recordId", "dataBefore", "dataAfter", "ipAddress", "userAgent", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Category" (id, name, "createdAt", "updatedAt") FROM stdin;
cmj197alx0001z7p0fecv6o3d	Filter	2025-12-11 09:46:37.555	2025-12-11 09:46:37.555
cmj197am10002z7p0d6mwsy1v	Oli & Pelumas	2025-12-11 09:46:37.56	2025-12-11 09:46:37.56
cmj197am40003z7p0dewd56ka	Bearing	2025-12-11 09:46:37.563	2025-12-11 09:46:37.563
cmj197am60004z7p0zphfd039	Seal & Gasket	2025-12-11 09:46:37.566	2025-12-11 09:46:37.566
cmj197am90005z7p0fq228xbi	Hydraulic	2025-12-11 09:46:37.568	2025-12-11 09:46:37.568
cmj197ama0006z7p0rh5fh7ul	Electrical	2025-12-11 09:46:37.57	2025-12-11 09:46:37.57
cmj197amd0007z7p020z3w57y	Engine Parts	2025-12-11 09:46:37.572	2025-12-11 09:46:37.572
cmj197amf0008z7p0xaa77a4i	Transmission	2025-12-11 09:46:37.574	2025-12-11 09:46:37.574
cmj197amg0009z7p0op18pdd1	Undercarriage	2025-12-11 09:46:37.576	2025-12-11 09:46:37.576
cmj197ami000az7p0alyapfin	Cabin Parts	2025-12-11 09:46:37.578	2025-12-11 09:46:37.578
\.


--
-- Data for Name: CleanupLog; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."CleanupLog" (id, action, type, description, "affectedCount", details, "createdAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Employee" (id, nik, name, "position", department, phone, "isActive", "createdAt", "updatedAt") FROM stdin;
cmj197av4004mz7p02ml0myd9	EMP001	Gilang Pratama	Operator	Gudang	084980954910	t	2025-12-11 09:46:37.883	2025-12-11 09:46:37.883
cmj197avh004nz7p0enqapqbp	EMP002	Gilang Wijaya	Mekanik	Operasional	081347994211	t	2025-12-11 09:46:37.9	2025-12-11 09:46:37.9
cmj197avp004oz7p02d51ksb2	EMP003	Eko Hidayat	Kepala Gudang	Maintenance	082496653309	t	2025-12-11 09:46:37.907	2025-12-11 09:46:37.907
cmj197awj004pz7p048kj1knk	EMP004	Eko Hidayat	Mekanik	Gudang	086766291612	t	2025-12-11 09:46:37.924	2025-12-11 09:46:37.924
cmj197ax8004qz7p0lv5ig0t4	EMP005	Cahyo Saputra	Admin	Administrasi	087272337843	t	2025-12-11 09:46:37.964	2025-12-11 09:46:37.964
cmj197axb004rz7p0q43g17eg	EMP006	Budi Rahman	Kepala Gudang	Gudang	086385407427	t	2025-12-11 09:46:37.966	2025-12-11 09:46:37.966
cmj197axd004sz7p0xngiwr47	EMP007	Cahyo Setiawan	Kepala Gudang	Maintenance	084132779053	t	2025-12-11 09:46:37.968	2025-12-11 09:46:37.968
cmj197axe004tz7p0yu7z99df	EMP008	Eko Wijaya	Mekanik	Administrasi	088633228927	t	2025-12-11 09:46:37.97	2025-12-11 09:46:37.97
cmj197axk004uz7p0ohqjk7el	EMP009	Faisal Pratama	Admin	Gudang	083634053762	t	2025-12-11 09:46:37.972	2025-12-11 09:46:37.972
cmj197axu004vz7p0on1s4rzj	EMP010	Eko Permana	Supervisor	Operasional	086194941036	t	2025-12-11 09:46:37.985	2025-12-11 09:46:37.985
cmj197axx004wz7p0axbon03d	EMP011	Irfan Setiawan	Mekanik	Operasional	085991853815	t	2025-12-11 09:46:37.988	2025-12-11 09:46:37.988
cmj197axy004xz7p0g860i4hk	EMP012	Andi Permana	Kepala Gudang	Operasional	083715873597	t	2025-12-11 09:46:37.99	2025-12-11 09:46:37.99
cmj197ay1004yz7p0zf4knv42	EMP013	Faisal Pratama	Mekanik	Administrasi	086111066410	t	2025-12-11 09:46:37.992	2025-12-11 09:46:37.992
cmj197ay3004zz7p0mxy17hoi	EMP014	Budi Setiawan	Kepala Gudang	Maintenance	083988881642	t	2025-12-11 09:46:37.994	2025-12-11 09:46:37.994
cmj197ay50050z7p0yic5t20i	EMP015	Gilang Nugroho	Admin	Gudang	088589036390	t	2025-12-11 09:46:37.997	2025-12-11 09:46:37.997
cmj197ay70051z7p0oaz10o4d	EMP016	Hendra Setiawan	Admin	Operasional	088570995234	t	2025-12-11 09:46:37.999	2025-12-11 09:46:37.999
cmj197ay80052z7p0hmdnv285	EMP017	Irfan Hidayat	Supervisor	Maintenance	083597397867	t	2025-12-11 09:46:38	2025-12-11 09:46:38
cmj197aya0053z7p0dpc5iw7z	EMP018	Hendra Setiawan	Kepala Gudang	Operasional	088841482534	t	2025-12-11 09:46:38.001	2025-12-11 09:46:38.001
cmj197ayb0054z7p021elxljy	EMP019	Eko Santoso	Supervisor	Administrasi	083706728430	t	2025-12-11 09:46:38.003	2025-12-11 09:46:38.003
cmj197ayd0055z7p005jjyzm1	EMP020	Gilang Setiawan	Kepala Gudang	Operasional	087402178695	t	2025-12-11 09:46:38.005	2025-12-11 09:46:38.005
\.


--
-- Data for Name: EquipmentCompatibility; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."EquipmentCompatibility" (id, "sparepartId", "equipmentType", "equipmentBrand", "equipmentModel") FROM stdin;
\.


--
-- Data for Name: HeavyEquipment; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."HeavyEquipment" (id, code, name, type, brand, model, year, site, status, "createdAt", "updatedAt") FROM stdin;
cmj197amv000gz7p0rseh6avc	AB-001	Dump Truck Kobelco 1	Dump Truck	Kobelco	Model-707	2019	\N	maintenance	2025-12-11 09:46:37.589	2025-12-11 09:46:37.589
cmj197amz000hz7p0hxbizduz	AB-002	Wheel Loader Komatsu 2	Wheel Loader	Komatsu	Model-364	2021	\N	active	2025-12-11 09:46:37.595	2025-12-11 09:46:37.595
cmj197an3000iz7p0a94np2lt	AB-003	Crane Caterpillar 3	Crane	Caterpillar	Model-154	2020	\N	inactive	2025-12-11 09:46:37.599	2025-12-11 09:46:37.599
cmj197an6000jz7p0kvcle4x2	AB-004	Dump Truck Volvo 4	Dump Truck	Volvo	Model-988	2022	\N	active	2025-12-11 09:46:37.601	2025-12-11 09:46:37.601
cmj197an8000kz7p0ue7advbt	AB-005	Wheel Loader Hitachi 5	Wheel Loader	Hitachi	Model-751	2019	\N	active	2025-12-11 09:46:37.603	2025-12-11 09:46:37.603
cmj197anb000lz7p0lww6yq03	AB-006	Bulldozer Kobelco 6	Bulldozer	Kobelco	Model-868	2018	\N	active	2025-12-11 09:46:37.606	2025-12-11 09:46:37.606
cmj197anc000mz7p0rrtvomt1	AB-007	Crane Hitachi 7	Crane	Hitachi	Model-953	2016	\N	active	2025-12-11 09:46:37.608	2025-12-11 09:46:37.608
cmj197ane000nz7p06zpwn73k	AB-008	Wheel Loader Hitachi 8	Wheel Loader	Hitachi	Model-341	2020	\N	active	2025-12-11 09:46:37.61	2025-12-11 09:46:37.61
cmj197ang000oz7p0t5wf5th2	AB-009	Crane Volvo 9	Crane	Volvo	Model-232	2016	\N	active	2025-12-11 09:46:37.612	2025-12-11 09:46:37.612
cmj197anj000pz7p0r3drjn1d	AB-010	Forklift JCB 10	Forklift	JCB	Model-722	2023	\N	maintenance	2025-12-11 09:46:37.614	2025-12-11 09:46:37.614
cmj197anm000qz7p0e2i198gp	AB-011	Crane Komatsu 11	Crane	Komatsu	Model-562	2020	\N	inactive	2025-12-11 09:46:37.617	2025-12-11 09:46:37.617
cmj197ano000rz7p016osocij	AB-012	Dump Truck Doosan 12	Dump Truck	Doosan	Model-415	2019	\N	maintenance	2025-12-11 09:46:37.619	2025-12-11 09:46:37.619
cmj197anq000sz7p0t5d9ev8v	AB-013	Wheel Loader Volvo 13	Wheel Loader	Volvo	Model-517	2015	\N	inactive	2025-12-11 09:46:37.621	2025-12-11 09:46:37.621
cmj197ans000tz7p0xicx1fdt	AB-014	Wheel Loader JCB 14	Wheel Loader	JCB	Model-858	2022	\N	active	2025-12-11 09:46:37.624	2025-12-11 09:46:37.624
cmj197anu000uz7p0u6634s5o	AB-015	Bulldozer JCB 15	Bulldozer	JCB	Model-145	2016	\N	active	2025-12-11 09:46:37.626	2025-12-11 09:46:37.626
cmj197anw000vz7p02kyxqmfa	AB-016	Motor Grader Hitachi 16	Motor Grader	Hitachi	Model-341	2024	\N	maintenance	2025-12-11 09:46:37.628	2025-12-11 09:46:37.628
cmj197any000wz7p0k1715vv5	AB-017	Motor Grader Caterpillar 17	Motor Grader	Caterpillar	Model-612	2019	\N	active	2025-12-11 09:46:37.629	2025-12-11 09:46:37.629
cmj197ao0000xz7p0owr4ci0q	AB-018	Crane Komatsu 18	Crane	Komatsu	Model-427	2023	\N	active	2025-12-11 09:46:37.632	2025-12-11 09:46:37.632
cmj197ao2000yz7p0vigdsxgg	AB-019	Excavator Komatsu 19	Excavator	Komatsu	Model-873	2020	\N	active	2025-12-11 09:46:37.633	2025-12-11 09:46:37.633
cmj197ao4000zz7p0elyu14jy	AB-020	Compactor Komatsu 20	Compactor	Komatsu	Model-468	2015	\N	active	2025-12-11 09:46:37.635	2025-12-11 09:46:37.635
cmj197ao60010z7p0fpc975zk	AB-021	Wheel Loader Caterpillar 21	Wheel Loader	Caterpillar	Model-955	2023	\N	active	2025-12-11 09:46:37.637	2025-12-11 09:46:37.637
cmj197ao80011z7p07yydekdm	AB-022	Crane Hyundai 22	Crane	Hyundai	Model-131	2024	\N	inactive	2025-12-11 09:46:37.639	2025-12-11 09:46:37.639
cmj197ao90012z7p0u65p23pi	AB-023	Compactor Caterpillar 23	Compactor	Caterpillar	Model-313	2023	\N	maintenance	2025-12-11 09:46:37.641	2025-12-11 09:46:37.641
cmj197aob0013z7p06bk79syp	AB-024	Wheel Loader Volvo 24	Wheel Loader	Volvo	Model-472	2023	\N	active	2025-12-11 09:46:37.642	2025-12-11 09:46:37.642
cmj197aoc0014z7p0rgvjt0uf	AB-025	Wheel Loader Hitachi 25	Wheel Loader	Hitachi	Model-492	2023	\N	active	2025-12-11 09:46:37.644	2025-12-11 09:46:37.644
cmj197aoe0015z7p0u1j77vll	AB-026	Dump Truck JCB 26	Dump Truck	JCB	Model-196	2023	\N	active	2025-12-11 09:46:37.646	2025-12-11 09:46:37.646
cmj197aof0016z7p0l4t5gv70	AB-027	Wheel Loader Caterpillar 27	Wheel Loader	Caterpillar	Model-207	2024	\N	inactive	2025-12-11 09:46:37.647	2025-12-11 09:46:37.647
cmj197aoh0017z7p0djtn03h3	AB-028	Crane JCB 28	Crane	JCB	Model-719	2015	\N	active	2025-12-11 09:46:37.648	2025-12-11 09:46:37.648
cmj197aoi0018z7p0vpvi9we2	AB-029	Bulldozer JCB 29	Bulldozer	JCB	Model-864	2016	\N	active	2025-12-11 09:46:37.65	2025-12-11 09:46:37.65
cmj197aok0019z7p0lzue1r6k	AB-030	Excavator Caterpillar 30	Excavator	Caterpillar	Model-418	2016	\N	active	2025-12-11 09:46:37.651	2025-12-11 09:46:37.651
cmj197aol001az7p0c5apes9y	AB-031	Crane Caterpillar 31	Crane	Caterpillar	Model-199	2020	\N	active	2025-12-11 09:46:37.653	2025-12-11 09:46:37.653
cmj197aom001bz7p0s2bwd2h9	AB-032	Dump Truck Hyundai 32	Dump Truck	Hyundai	Model-627	2017	\N	inactive	2025-12-11 09:46:37.654	2025-12-11 09:46:37.654
cmj197aoo001cz7p06vcy4tf8	AB-033	Dump Truck Caterpillar 33	Dump Truck	Caterpillar	Model-511	2016	\N	active	2025-12-11 09:46:37.655	2025-12-11 09:46:37.655
cmj197aop001dz7p0eqegwr7f	AB-034	Dump Truck Kobelco 34	Dump Truck	Kobelco	Model-589	2016	\N	active	2025-12-11 09:46:37.657	2025-12-11 09:46:37.657
cmj197aoy001ez7p0yyrbcxy3	AB-035	Crane Hitachi 35	Crane	Hitachi	Model-156	2024	\N	maintenance	2025-12-11 09:46:37.658	2025-12-11 09:46:37.658
cmj197ap2001fz7p0veq9y0kl	AB-036	Motor Grader Caterpillar 36	Motor Grader	Caterpillar	Model-142	2016	\N	active	2025-12-11 09:46:37.669	2025-12-11 09:46:37.669
cmj197ap4001gz7p0kr1ppcn4	AB-037	Motor Grader Caterpillar 37	Motor Grader	Caterpillar	Model-686	2017	\N	active	2025-12-11 09:46:37.671	2025-12-11 09:46:37.671
cmj197ap6001hz7p0bx1u9zi4	AB-038	Crane Volvo 38	Crane	Volvo	Model-917	2022	\N	active	2025-12-11 09:46:37.673	2025-12-11 09:46:37.673
cmj197ap7001iz7p0pl1gqdm9	AB-039	Forklift Hyundai 39	Forklift	Hyundai	Model-170	2022	\N	maintenance	2025-12-11 09:46:37.675	2025-12-11 09:46:37.675
cmj197ap9001jz7p08sm0pkau	AB-040	Crane Caterpillar 40	Crane	Caterpillar	Model-924	2015	\N	maintenance	2025-12-11 09:46:37.676	2025-12-11 09:46:37.676
cmj197apa001kz7p05b0tnpan	AB-041	Compactor Komatsu 41	Compactor	Komatsu	Model-131	2023	\N	maintenance	2025-12-11 09:46:37.678	2025-12-11 09:46:37.678
cmj197apc001lz7p0d8vbsei9	AB-042	Wheel Loader JCB 42	Wheel Loader	JCB	Model-324	2022	\N	maintenance	2025-12-11 09:46:37.679	2025-12-11 09:46:37.679
cmj197apd001mz7p0vjr9cwmc	AB-043	Wheel Loader Komatsu 43	Wheel Loader	Komatsu	Model-937	2016	\N	active	2025-12-11 09:46:37.681	2025-12-11 09:46:37.681
cmj197apf001nz7p05bbrfdv9	AB-044	Dump Truck Hitachi 44	Dump Truck	Hitachi	Model-488	2015	\N	inactive	2025-12-11 09:46:37.682	2025-12-11 09:46:37.682
cmj197aph001oz7p0kq7o0vnk	AB-045	Crane Kobelco 45	Crane	Kobelco	Model-436	2019	\N	maintenance	2025-12-11 09:46:37.684	2025-12-11 09:46:37.684
cmj197api001pz7p0c9yx7oo3	AB-046	Crane Volvo 46	Crane	Volvo	Model-909	2019	\N	maintenance	2025-12-11 09:46:37.686	2025-12-11 09:46:37.686
cmj197apk001qz7p0p0vxdkmg	AB-047	Wheel Loader Caterpillar 47	Wheel Loader	Caterpillar	Model-577	2017	\N	inactive	2025-12-11 09:46:37.687	2025-12-11 09:46:37.687
cmj197apn001rz7p05987oaa7	AB-048	Dump Truck Doosan 48	Dump Truck	Doosan	Model-128	2018	\N	active	2025-12-11 09:46:37.691	2025-12-11 09:46:37.691
cmj197apo001sz7p0aue4hnqi	AB-049	Forklift Hitachi 49	Forklift	Hitachi	Model-534	2024	\N	active	2025-12-11 09:46:37.692	2025-12-11 09:46:37.692
cmj197apq001tz7p0x6tbbvg4	AB-050	Crane Hitachi 50	Crane	Hitachi	Model-519	2019	\N	active	2025-12-11 09:46:37.693	2025-12-11 09:46:37.693
cmjau0xak0002wrp0h0abqu44	EX-001	Eksa	Excavator	Komatsu	PC200	2012	SBJE	active	2025-12-18 02:39:27.884	2025-12-18 02:39:27.884
\.


--
-- Data for Name: ImportLog; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."ImportLog" (id, type, "totalRows", "createdAt", "createdBy", "failedRows", filename, "skippedRows", "successRows", errors) FROM stdin;
\.


--
-- Data for Name: LoginAttempt; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."LoginAttempt" (id, username, "ipAddress", "userAgent", success, "createdAt") FROM stdin;
cmjata1fu0000wrp03emhp0bq	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	t	2025-12-18 02:18:33.546
cmjata6ds0001wrp0x89lnst7	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	t	2025-12-18 02:18:39.952
\.


--
-- Data for Name: PettyCash; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."PettyCash" (id, date, type, "categoryId", amount, description, receipt, "createdAt") FROM stdin;
cmj197b190072z7p0e2wvuvth	2025-12-01	in	\N	2414354	Pengisian kas kecil #1	\N	2025-12-11 09:46:38.109
cmj197b1b0073z7p0m84uym6y	2025-12-10	in	\N	1483855	Pengisian kas kecil #2	\N	2025-12-11 09:46:38.111
cmj197b1c0074z7p0q6m4tdh4	2025-11-24	in	\N	1777568	Pengisian kas kecil #3	\N	2025-12-11 09:46:38.112
cmj197b1c0075z7p01wr6w2pk	2025-12-08	in	\N	2487331	Pengisian kas kecil #4	\N	2025-12-11 09:46:38.112
cmj197b1d0076z7p0y0gph0if	2025-11-25	in	\N	3934961	Pengisian kas kecil #5	\N	2025-12-11 09:46:38.113
cmj197b1e0077z7p0xxg36622	2025-11-20	out	cmj197ayk0058z7p0jd97185c	415489	Pengeluaran atk #1	\N	2025-12-11 09:46:38.114
cmj197b1f0078z7p0jnwjfj3q	2025-12-10	out	cmj197aym0059z7p0kowfpgl9	354613	Pengeluaran transport #2	\N	2025-12-11 09:46:38.115
cmj197b1f0079z7p0wkx1ow68	2025-11-22	out	cmj197ayg0056z7p0j2sxvbev	353864	Pengeluaran bbm #3	\N	2025-12-11 09:46:38.115
cmj197b1g007az7p05we9s9vy	2025-11-18	out	cmj197aym0059z7p0kowfpgl9	394741	Pengeluaran transport #4	\N	2025-12-11 09:46:38.116
cmj197b1h007bz7p0l2udujtq	2025-11-13	out	cmj197ayg0056z7p0j2sxvbev	169883	Pengeluaran bbm #5	\N	2025-12-11 09:46:38.117
cmj197b1j007cz7p001vd4xxi	2025-11-14	out	cmj197ayi0057z7p01fl7foge	131688	Pengeluaran makan #6	\N	2025-12-11 09:46:38.119
cmj197b1k007dz7p0s0z33djk	2025-11-18	out	cmj197ayk0058z7p0jd97185c	229606	Pengeluaran atk #7	\N	2025-12-11 09:46:38.12
cmj197b1k007ez7p0ct5ols4v	2025-11-15	out	cmj197ayn005az7p0th3sbvxb	407034	Pengeluaran lain-lain #8	\N	2025-12-11 09:46:38.12
cmj197b1l007fz7p08c9rgvu9	2025-11-30	out	cmj197aym0059z7p0kowfpgl9	433933	Pengeluaran transport #9	\N	2025-12-11 09:46:38.121
cmj197b1m007gz7p06jv83ynp	2025-11-12	out	cmj197ayk0058z7p0jd97185c	147135	Pengeluaran atk #10	\N	2025-12-11 09:46:38.122
cmj197b1m007hz7p0kcnrr0up	2025-11-20	out	cmj197ayi0057z7p01fl7foge	86989	Pengeluaran makan #11	\N	2025-12-11 09:46:38.122
cmj197b1n007iz7p06105zbbn	2025-11-29	out	cmj197aym0059z7p0kowfpgl9	375737	Pengeluaran transport #12	\N	2025-12-11 09:46:38.123
cmj197b1n007jz7p0ncgmue1b	2025-11-28	out	cmj197ayk0058z7p0jd97185c	91843	Pengeluaran atk #13	\N	2025-12-11 09:46:38.123
cmj197b1o007kz7p0tx7f5t9n	2025-12-01	out	cmj197ayg0056z7p0j2sxvbev	393412	Pengeluaran bbm #14	\N	2025-12-11 09:46:38.124
cmj197b1p007lz7p0h7ykmdfe	2025-12-08	out	cmj197ayi0057z7p01fl7foge	419500	Pengeluaran makan #15	\N	2025-12-11 09:46:38.125
\.


--
-- Data for Name: PettyCashCategory; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."PettyCashCategory" (id, name, "createdAt", "updatedAt") FROM stdin;
cmj197ayg0056z7p0j2sxvbev	BBM	2025-12-11 09:46:38.006	2025-12-11 09:46:38.006
cmj197ayi0057z7p01fl7foge	Makan	2025-12-11 09:46:38.01	2025-12-11 09:46:38.01
cmj197ayk0058z7p0jd97185c	ATK	2025-12-11 09:46:38.012	2025-12-11 09:46:38.012
cmj197aym0059z7p0kowfpgl9	Transport	2025-12-11 09:46:38.013	2025-12-11 09:46:38.013
cmj197ayn005az7p0th3sbvxb	Lain-lain	2025-12-11 09:46:38.015	2025-12-11 09:46:38.015
\.


--
-- Data for Name: SecurityLog; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."SecurityLog" (id, "eventType", "userId", "userName", "ipAddress", "userAgent", details, "riskLevel", duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Session" (id, "sessionToken", "userId", expires, "createdAt") FROM stdin;
\.


--
-- Data for Name: Sparepart; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Sparepart" (id, code, name, "categoryId", brand, unit, "minStock", "currentStock", "rackLocation", "createdAt", "updatedAt") FROM stdin;
cmj197apt001uz7p0cn4ahpkf	SP-0001	Hydraulic Filter 1	cmj197am90005z7p0fq228xbi	\N	liter	19	43	Rak D-4	2025-12-11 09:46:37.697	2025-12-11 09:46:37.697
cmj197aq1001vz7p0i6bocmqp	SP-0002	Fuel Filter 2	cmj197am10002z7p0d6mwsy1v	\N	pcs	6	20	Rak C-8	2025-12-11 09:46:37.705	2025-12-11 09:46:37.705
cmj197aq4001xz7p06jq0rhe7	SP-0004	Track Link 4	cmj197am60004z7p0zphfd039	\N	pcs	14	1	Rak E-6	2025-12-11 09:46:37.708	2025-12-11 09:46:37.708
cmj197aq7001zz7p0lpd3tytl	SP-0006	Hydraulic Cylinder 6	cmj197amd0007z7p020z3w57y	\N	set	12	40	Rak A-9	2025-12-11 09:46:37.711	2025-12-11 09:46:37.711
cmj197aqb0022z7p07n88ysns	SP-0009	Air Filter 9	cmj197am40003z7p0dewd56ka	\N	liter	5	38	Rak A-8	2025-12-11 09:46:37.715	2025-12-11 09:46:37.715
cmj197aqd0024z7p0bz7ljrvr	SP-0011	Hydraulic Pump 11	cmj197am10002z7p0d6mwsy1v	\N	kg	18	24	Rak C-9	2025-12-11 09:46:37.717	2025-12-11 09:46:37.717
cmj197aqe0025z7p0rddzbd05	SP-0012	V-Belt 12	cmj197amf0008z7p0xaa77a4i	\N	meter	19	15	Rak D-10	2025-12-11 09:46:37.718	2025-12-11 09:46:37.718
cmj197aqg0026z7p0upf16igo	SP-0013	Hydraulic Hose 13	cmj197am90005z7p0fq228xbi	\N	pcs	8	7	Rak B-5	2025-12-11 09:46:37.72	2025-12-11 09:46:37.72
cmj197aqi0028z7p0jkxa65hb	SP-0015	Clutch Plate 15	cmj197am60004z7p0zphfd039	\N	liter	9	50	Rak A-9	2025-12-11 09:46:37.722	2025-12-11 09:46:37.722
cmj197aql002az7p0mv17678k	SP-0017	Idler 17	cmj197am60004z7p0zphfd039	\N	liter	9	20	Rak F-1	2025-12-11 09:46:37.725	2025-12-11 09:46:37.725
cmj197aqm002bz7p0dqf53nb7	SP-0018	Oil Seal 18	cmj197alx0001z7p0fecv6o3d	\N	set	15	29	Rak A-7	2025-12-11 09:46:37.726	2025-12-11 09:46:37.726
cmj197aqn002cz7p0mpkeoxc5	SP-0019	Water Pump 19	cmj197am60004z7p0zphfd039	\N	box	14	32	Rak E-4	2025-12-11 09:46:37.727	2025-12-11 09:46:37.727
cmj197aqp002dz7p0eeh3yj44	SP-0020	Thrust Bearing 20	cmj197amf0008z7p0xaa77a4i	\N	set	18	13	Rak E-7	2025-12-11 09:46:37.729	2025-12-11 09:46:37.729
cmj197aqq002ez7p05k7u4kbi	SP-0021	Connecting Rod 21	cmj197amg0009z7p0op18pdd1	\N	liter	5	43	Rak C-10	2025-12-11 09:46:37.73	2025-12-11 09:46:37.73
cmj197aqr002fz7p0nn3godz9	SP-0022	Brake Disc 22	cmj197amf0008z7p0xaa77a4i	\N	liter	9	26	Rak A-7	2025-12-11 09:46:37.731	2025-12-11 09:46:37.731
cmj197aqu002hz7p0w7er5zqc	SP-0024	Turbocharger 24	cmj197ami000az7p0alyapfin	\N	pcs	11	30	Rak C-4	2025-12-11 09:46:37.734	2025-12-11 09:46:37.734
cmj197aqv002iz7p0sjfw4rq5	SP-0025	Grease 25	cmj197amd0007z7p020z3w57y	\N	pcs	11	35	Rak E-4	2025-12-11 09:46:37.735	2025-12-11 09:46:37.735
cmj197aqx002jz7p0f7bf9s5d	SP-0026	Brake Pad 26	cmj197ami000az7p0alyapfin	\N	meter	12	38	Rak E-7	2025-12-11 09:46:37.737	2025-12-11 09:46:37.737
cmj197ar5002lz7p0b1mfsxqn	SP-0028	Gearbox 28	cmj197ama0006z7p0rh5fh7ul	\N	box	14	15	Rak B-6	2025-12-11 09:46:37.745	2025-12-11 09:46:37.745
cmj197ar8002mz7p0enaxzb7v	SP-0029	Brake Shoe 29	cmj197am40003z7p0dewd56ka	\N	meter	17	5	Rak B-10	2025-12-11 09:46:37.748	2025-12-11 09:46:37.748
cmj197ar9002nz7p08sdeayvp	SP-0030	Water Pump 30	cmj197ama0006z7p0rh5fh7ul	\N	liter	14	35	Rak A-4	2025-12-11 09:46:37.749	2025-12-11 09:46:37.749
cmj197ard002qz7p02qt0uo5n	SP-0033	Track Shoe 33	cmj197ami000az7p0alyapfin	\N	meter	11	50	Rak B-9	2025-12-11 09:46:37.753	2025-12-11 09:46:37.753
cmj197are002rz7p08zzwx7du	SP-0034	Mirror 34	cmj197alx0001z7p0fecv6o3d	\N	kg	15	3	Rak A-6	2025-12-11 09:46:37.754	2025-12-11 09:46:37.754
cmj197arg002sz7p0uic48iht	SP-0035	Hydraulic Pump 35	cmj197am60004z7p0zphfd039	\N	box	8	16	Rak C-3	2025-12-11 09:46:37.756	2025-12-11 09:46:37.756
cmj197arj002uz7p0t7c3kk3x	SP-0037	Idler 37	cmj197amd0007z7p020z3w57y	\N	set	13	42	Rak C-5	2025-12-11 09:46:37.759	2025-12-11 09:46:37.759
cmj197arl002vz7p0fdw9p179	SP-0038	Clutch Plate 38	cmj197am60004z7p0zphfd039	\N	box	10	49	Rak B-9	2025-12-11 09:46:37.761	2025-12-11 09:46:37.761
cmj197aro002yz7p0njvrjkas	SP-0041	Starter Motor 41	cmj197ama0006z7p0rh5fh7ul	\N	kg	7	16	Rak E-10	2025-12-11 09:46:37.764	2025-12-11 09:46:37.764
cmj197arr0030z7p0z3umof40	SP-0043	Relay 43	cmj197amg0009z7p0op18pdd1	\N	meter	15	12	Rak A-6	2025-12-11 09:46:37.767	2025-12-11 09:46:37.767
cmj197aru0031z7p0erhx3a6b	SP-0044	Wiper Blade 44	cmj197amg0009z7p0op18pdd1	\N	liter	5	23	Rak D-3	2025-12-11 09:46:37.77	2025-12-11 09:46:37.77
cmj197as50033z7p0vjlcvfjd	SP-0046	Wiper Blade 46	cmj197amf0008z7p0xaa77a4i	\N	kg	9	6	Rak F-9	2025-12-11 09:46:37.781	2025-12-11 09:46:37.781
cmj197as90036z7p0825zpwjl	SP-0049	Dust Seal 49	cmj197ami000az7p0alyapfin	\N	meter	12	13	Rak D-10	2025-12-11 09:46:37.785	2025-12-11 09:46:37.785
cmj197ase0039z7p0rbxm3bb0	SP-0052	Hydraulic Filter 52	cmj197alx0001z7p0fecv6o3d	\N	liter	12	31	Rak E-3	2025-12-11 09:46:37.79	2025-12-11 09:46:37.79
cmj197asb0037z7p02vcy8zza	SP-0050	Sprocket 50	cmj197amd0007z7p020z3w57y	\N	kg	7	46	Rak B-9	2025-12-11 09:46:37.787	2025-12-11 09:46:38.029
cmj197arm002wz7p03hvj6k9p	SP-0039	Cabin Filter 39	cmj197am40003z7p0dewd56ka	\N	kg	14	20	Rak C-2	2025-12-11 09:46:37.762	2025-12-11 09:46:38.032
cmj197asi003bz7p0it59ghzp	SP-0054	Torque Converter 54	cmj197alx0001z7p0fecv6o3d	\N	set	12	20	Rak A-1	2025-12-11 09:46:37.794	2025-12-11 09:46:38.087
cmj197arp002zz7p0xbuu5us6	SP-0042	Fan Belt 42	cmj197ami000az7p0alyapfin	\N	meter	13	20	Rak E-8	2025-12-11 09:46:37.765	2025-12-11 09:46:38.067
cmj197aqz002kz7p0s3kjgt20	SP-0027	Cabin Filter 27	cmj197amd0007z7p020z3w57y	\N	meter	8	43	Rak F-9	2025-12-11 09:46:37.739	2025-12-11 09:46:38.053
cmj197as30032z7p0n9kwnj8r	SP-0045	Battery 45	cmj197am40003z7p0dewd56ka	\N	box	5	28	Rak F-6	2025-12-11 09:46:37.779	2025-12-11 09:46:38.055
cmj197arb002oz7p0iqwrml8y	SP-0031	Gasket Set 31	cmj197ami000az7p0alyapfin	\N	pcs	17	17	Rak F-3	2025-12-11 09:46:37.751	2025-12-11 09:46:38.057
cmj197asc0038z7p011kbe8tw	SP-0051	O-Ring 51	cmj197am60004z7p0zphfd039	\N	meter	19	23	Rak E-6	2025-12-11 09:46:37.788	2025-12-11 09:46:38.059
cmj197arn002xz7p0236xktfa	SP-0040	Starter Motor 40	cmj197am90005z7p0fq228xbi	\N	set	15	32	Rak B-6	2025-12-11 09:46:37.763	2025-12-11 09:46:38.062
cmj197aqa0021z7p0sddrvm86	SP-0008	Alternator 8	cmj197am60004z7p0zphfd039	\N	pcs	12	31	Rak A-6	2025-12-11 09:46:37.714	2025-12-11 09:46:38.064
cmj197aq6001yz7p0c3cau3bb	SP-0005	Injector 5	cmj197ami000az7p0alyapfin	\N	liter	20	46	Rak F-3	2025-12-11 09:46:37.71	2025-12-11 09:46:38.071
cmj197aq3001wz7p0trfzdi6a	SP-0003	Gearbox 3	cmj197ami000az7p0alyapfin	\N	kg	14	10	Rak C-5	2025-12-11 09:46:37.707	2025-12-11 09:46:38.097
cmj197aqc0023z7p0n4t13yga	SP-0010	Mirror 10	cmj197amd0007z7p020z3w57y	\N	liter	10	30	Rak E-2	2025-12-11 09:46:37.716	2025-12-11 09:46:38.077
cmj197asg003az7p00lkv4h0s	SP-0053	Ball Bearing 53	cmj197amd0007z7p020z3w57y	\N	pcs	8	33	Rak C-10	2025-12-11 09:46:37.792	2025-12-11 09:46:38.082
cmj197aqs002gz7p0yglndir5	SP-0023	Coolant 23	cmj197am10002z7p0d6mwsy1v	\N	pcs	7	21	Rak A-10	2025-12-11 09:46:37.732	2025-12-11 09:46:38.091
cmj197as80035z7p0ef4l13kh	SP-0048	Hydraulic Oil 48	cmj197ami000az7p0alyapfin	\N	liter	17	41	Rak F-9	2025-12-11 09:46:37.784	2025-12-11 09:46:38.093
cmj197arh002tz7p0zhr7b44e	SP-0036	Gearbox 36	cmj197am60004z7p0zphfd039	\N	set	14	19	Rak B-9	2025-12-11 09:46:37.757	2025-12-11 09:46:38.1
cmj197as70034z7p0ow7gupe4	SP-0047	Torque Converter 47	cmj197amd0007z7p020z3w57y	\N	meter	10	29	Rak E-5	2025-12-11 09:46:37.783	2025-12-11 09:46:38.102
cmj197arc002pz7p0px695gyg	SP-0032	Grease 32	cmj197ami000az7p0alyapfin	\N	kg	10	14	Rak D-9	2025-12-11 09:46:37.752	2025-12-11 09:46:38.105
cmj197aqj0029z7p05dyo9saz	SP-0016	Brake Pad 16	cmj197am60004z7p0zphfd039	\N	meter	7	38	Rak C-6	2025-12-11 09:46:37.723	2025-12-11 09:46:38.106
cmj197asj003cz7p0b4qeodz0	SP-0055	Sprocket 55	cmj197am10002z7p0d6mwsy1v	\N	meter	12	46	Rak A-9	2025-12-11 09:46:37.795	2025-12-11 09:46:37.795
cmj197asl003dz7p0wegs3ffn	SP-0056	Dust Seal 56	cmj197amg0009z7p0op18pdd1	\N	meter	5	23	Rak C-7	2025-12-11 09:46:37.797	2025-12-11 09:46:37.797
cmj197asn003ez7p0d3z3ohhl	SP-0057	Gear Oil 57	cmj197am60004z7p0zphfd039	\N	pcs	14	30	Rak E-7	2025-12-11 09:46:37.799	2025-12-11 09:46:37.799
cmj197aso003fz7p0k3q4g1g7	SP-0058	Ball Bearing 58	cmj197am10002z7p0d6mwsy1v	\N	pcs	10	21	Rak F-9	2025-12-11 09:46:37.8	2025-12-11 09:46:37.8
cmj197asp003gz7p0gh7t9pq5	SP-0059	Piston Ring 59	cmj197am40003z7p0dewd56ka	\N	set	18	42	Rak D-1	2025-12-11 09:46:37.801	2025-12-11 09:46:37.801
cmj197ast003iz7p0vvqglfq5	SP-0061	Gearbox 61	cmj197am90005z7p0fq228xbi	\N	kg	17	35	Rak A-5	2025-12-11 09:46:37.805	2025-12-11 09:46:37.805
cmj197asv003kz7p0fc2fsu2b	SP-0063	Wiper Blade 63	cmj197ami000az7p0alyapfin	\N	box	17	48	Rak B-7	2025-12-11 09:46:37.807	2025-12-11 09:46:37.807
cmj197asz003mz7p0wsynxu71	SP-0065	Gear Oil 65	cmj197am10002z7p0d6mwsy1v	\N	kg	20	15	Rak D-2	2025-12-11 09:46:37.811	2025-12-11 09:46:37.811
cmj197at7003oz7p04nfgvt9w	SP-0067	Gearbox 67	cmj197ama0006z7p0rh5fh7ul	\N	liter	20	40	Rak C-6	2025-12-11 09:46:37.819	2025-12-11 09:46:37.819
cmj197ata003pz7p0iie56m0y	SP-0068	Idler 68	cmj197amg0009z7p0op18pdd1	\N	meter	19	38	Rak D-2	2025-12-11 09:46:37.822	2025-12-11 09:46:37.822
cmj197ate003qz7p0yu9afhay	SP-0069	Coolant 69	cmj197ama0006z7p0rh5fh7ul	\N	kg	9	38	Rak F-6	2025-12-11 09:46:37.826	2025-12-11 09:46:37.826
cmj197atg003rz7p0yrehf9rw	SP-0070	Coolant 70	cmj197amd0007z7p020z3w57y	\N	meter	19	43	Rak D-7	2025-12-11 09:46:37.828	2025-12-11 09:46:37.828
cmj197ati003sz7p0epkk30xy	SP-0071	Fuse 71	cmj197am40003z7p0dewd56ka	\N	pcs	12	41	Rak E-5	2025-12-11 09:46:37.83	2025-12-11 09:46:37.83
cmj197atk003tz7p0egyac7zo	SP-0072	Piston 72	cmj197am90005z7p0fq228xbi	\N	pcs	9	42	Rak A-6	2025-12-11 09:46:37.832	2025-12-11 09:46:37.832
cmj197atl003uz7p0q1bg84oy	SP-0073	Roller 73	cmj197ami000az7p0alyapfin	\N	meter	14	32	Rak B-2	2025-12-11 09:46:37.833	2025-12-11 09:46:37.833
cmj197atm003vz7p0hli2ibc4	SP-0074	Engine Oil 74	cmj197am40003z7p0dewd56ka	\N	liter	14	7	Rak C-8	2025-12-11 09:46:37.834	2025-12-11 09:46:37.834
cmj197ato003wz7p013pug90q	SP-0075	Wiper Blade 75	cmj197ami000az7p0alyapfin	\N	liter	17	43	Rak D-4	2025-12-11 09:46:37.836	2025-12-11 09:46:37.836
cmj197atp003xz7p0ne0krj48	SP-0076	Fuel Filter 76	cmj197amg0009z7p0op18pdd1	\N	set	15	38	Rak C-6	2025-12-11 09:46:37.837	2025-12-11 09:46:37.837
cmj197atr003zz7p0t4j2j3cd	SP-0078	Track Link 78	cmj197ami000az7p0alyapfin	\N	kg	20	38	Rak C-6	2025-12-11 09:46:37.839	2025-12-11 09:46:37.839
cmj197att0040z7p0slyg01f2	SP-0079	O-Ring 79	cmj197am10002z7p0d6mwsy1v	\N	meter	15	27	Rak D-7	2025-12-11 09:46:37.841	2025-12-11 09:46:37.841
cmj197atw0043z7p0dmw093ej	SP-0082	Gearbox 82	cmj197alx0001z7p0fecv6o3d	\N	kg	5	32	Rak C-8	2025-12-11 09:46:37.844	2025-12-11 09:46:37.844
cmj197atz0045z7p0n18d40bq	SP-0084	V-Belt 84	cmj197am40003z7p0dewd56ka	\N	pcs	15	15	Rak C-2	2025-12-11 09:46:37.847	2025-12-11 09:46:37.847
cmj197au10046z7p0lioclpo0	SP-0085	Fuel Filter 85	cmj197am10002z7p0d6mwsy1v	\N	box	6	49	Rak F-5	2025-12-11 09:46:37.849	2025-12-11 09:46:37.849
cmj197au20047z7p0a91y0xwx	SP-0086	Water Pump 86	cmj197amg0009z7p0op18pdd1	\N	meter	8	39	Rak F-6	2025-12-11 09:46:37.85	2025-12-11 09:46:37.85
cmj197au50049z7p0gc1h6nop	SP-0088	Coolant 88	cmj197am90005z7p0fq228xbi	\N	kg	12	20	Rak E-9	2025-12-11 09:46:37.853	2025-12-11 09:46:37.853
cmj197au6004az7p0jvdxfjsk	SP-0089	O-Ring 89	cmj197amf0008z7p0xaa77a4i	\N	liter	6	50	Rak B-9	2025-12-11 09:46:37.854	2025-12-11 09:46:37.854
cmj197au7004bz7p0bsh9nz7c	SP-0090	Crankshaft 90	cmj197am40003z7p0dewd56ka	\N	kg	20	40	Rak F-2	2025-12-11 09:46:37.855	2025-12-11 09:46:37.855
cmj197aua004dz7p09vyu31l4	SP-0092	Sprocket 92	cmj197ama0006z7p0rh5fh7ul	\N	kg	17	48	Rak E-10	2025-12-11 09:46:37.858	2025-12-11 09:46:37.858
cmj197auo004iz7p0jletaxzd	SP-0097	Wiper Blade 97	cmj197alx0001z7p0fecv6o3d	\N	kg	5	43	Rak B-8	2025-12-11 09:46:37.872	2025-12-11 09:46:37.872
cmj197aus004jz7p0s7mobozt	SP-0098	Turbocharger 98	cmj197amg0009z7p0op18pdd1	\N	set	12	11	Rak B-4	2025-12-11 09:46:37.876	2025-12-11 09:46:37.876
cmj197auy004lz7p0955vdiay	SP-0100	Seat Cushion 100	cmj197ama0006z7p0rh5fh7ul	\N	pcs	13	27	Rak B-7	2025-12-11 09:46:37.882	2025-12-11 09:46:37.882
cmj197atu0041z7p02lag61ip	SP-0080	Starter Motor 80	cmj197amf0008z7p0xaa77a4i	\N	kg	7	45	Rak C-10	2025-12-11 09:46:37.842	2025-12-11 09:46:38.02
cmj197at4003nz7p0clqeelq4	SP-0066	Cabin Filter 66	cmj197am40003z7p0dewd56ka	\N	box	12	33	Rak F-10	2025-12-11 09:46:37.816	2025-12-11 09:46:38.03
cmj197au9004cz7p0gegex2lw	SP-0091	Thermostat 91	cmj197am90005z7p0fq228xbi	\N	meter	18	30	Rak E-1	2025-12-11 09:46:37.857	2025-12-11 09:46:38.025
cmj197aq90020z7p0g72hcm4j	SP-0007	Wiper Blade 7	cmj197ama0006z7p0rh5fh7ul	\N	kg	20	16	Rak B-1	2025-12-11 09:46:37.713	2025-12-11 09:46:38.027
cmj197aud004fz7p0g6whkvk3	SP-0094	Hydraulic Hose 94	cmj197ami000az7p0alyapfin	\N	liter	11	33	Rak A-8	2025-12-11 09:46:37.861	2025-12-11 09:46:38.043
cmj197aqh0027z7p022uup31r	SP-0014	Hydraulic Filter 14	cmj197amg0009z7p0op18pdd1	\N	pcs	9	57	Rak E-7	2025-12-11 09:46:37.721	2025-12-11 09:46:38.037
cmj197atv0042z7p0apnzkfin	SP-0081	Fuel Filter 81	cmj197ami000az7p0alyapfin	\N	meter	9	46	Rak D-7	2025-12-11 09:46:37.843	2025-12-11 09:46:38.039
cmj197auu004kz7p0exou8zy7	SP-0099	Radiator Hose 99	cmj197alx0001z7p0fecv6o3d	\N	kg	9	38	Rak D-5	2025-12-11 09:46:37.878	2025-12-11 09:46:38.04
cmj197atq003yz7p09oepwrd9	SP-0077	Hydraulic Hose 77	cmj197amg0009z7p0op18pdd1	\N	liter	12	42	Rak C-1	2025-12-11 09:46:37.838	2025-12-11 09:46:38.048
cmj197asr003hz7p0a3tzhztd	SP-0060	Air Filter 60	cmj197am60004z7p0zphfd039	\N	kg	12	63	Rak D-5	2025-12-11 09:46:37.803	2025-12-11 09:46:38.05
cmj197asu003jz7p0btllrp1i	SP-0062	Water Pump 62	cmj197am40003z7p0dewd56ka	\N	set	9	17	Rak E-6	2025-12-11 09:46:37.806	2025-12-11 09:46:38.061
cmj197aub004ez7p0rtk1bj5f	SP-0093	Ball Bearing 93	cmj197am60004z7p0zphfd039	\N	set	14	22	Rak C-8	2025-12-11 09:46:37.859	2025-12-11 09:46:38.069
cmj197aty0044z7p0rsrxtxl7	SP-0083	Radiator 83	cmj197amg0009z7p0op18pdd1	\N	set	20	6	Rak B-7	2025-12-11 09:46:37.846	2025-12-11 09:46:38.075
cmj197au30048z7p0mfve246u	SP-0087	Oil Filter 87	cmj197amf0008z7p0xaa77a4i	\N	box	17	42	Rak F-3	2025-12-11 09:46:37.851	2025-12-11 09:46:38.095
cmj197aue004gz7p01z6lbqgb	SP-0095	Mirror 95	cmj197alx0001z7p0fecv6o3d	\N	box	5	9	Rak D-4	2025-12-11 09:46:37.862	2025-12-11 09:46:38.098
cmj197aui004hz7p0wknz7g0z	SP-0096	Hydraulic Filter 96	cmj197amf0008z7p0xaa77a4i	\N	liter	15	30	Rak D-8	2025-12-11 09:46:37.866	2025-12-11 09:46:38.103
cmj197asx003lz7p0s4xhb1p5	SP-0064	Turbocharger 64	cmj197ami000az7p0alyapfin	\N	pcs	7	17	Rak B-6	2025-12-11 09:46:37.809	2025-12-11 09:46:38.108
\.


--
-- Data for Name: StockIn; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."StockIn" (id, "sparepartId", quantity, "supplierId", "invoiceNumber", "purchasePrice", "warrantyExpiry", notes, "createdAt") FROM stdin;
cmj197ayp005bz7p0m6z9ltwp	cmj197atu0041z7p02lag61ip	12	cmj197amo000cz7p0oy6fru96	\N	3779624	\N	Pembelian rutin	2025-12-11 09:46:38.017
cmj197ayv005dz7p01z62eyhl	cmj197au9004cz7p0gegex2lw	16	cmj197amq000dz7p01ndwovr3	\N	4272125	\N	Pembelian rutin	2025-12-11 09:46:38.023
cmj197ayx005ez7p075uzxjw5	cmj197au9004cz7p0gegex2lw	8	cmj197ams000fz7p0q8awfut0	\N	4272125	\N	Pembelian rutin	2025-12-11 09:46:38.025
cmj197ayy005fz7p0i23myjcg	cmj197aq90020z7p0g72hcm4j	11	cmj197amq000dz7p01ndwovr3	\N	3642970	\N	Pembelian rutin	2025-12-11 09:46:38.026
cmj197az0005hz7p0gy0l8pvh	cmj197asb0037z7p02vcy8zza	18	cmj197amm000bz7p0o4mwjtf9	\N	1230646	\N	Pembelian rutin	2025-12-11 09:46:38.028
cmj197az2005iz7p0kih96igx	cmj197at4003nz7p0clqeelq4	18	cmj197amr000ez7p057whrzqy	\N	4596001	\N	Pembelian rutin	2025-12-11 09:46:38.03
cmj197az3005jz7p0pqfhtqdj	cmj197arm002wz7p03hvj6k9p	12	cmj197amr000ez7p057whrzqy	\N	3076445	\N	Pembelian rutin	2025-12-11 09:46:38.031
cmj197az6005lz7p0tsmrv1i1	cmj197auu004kz7p0exou8zy7	14	cmj197ams000fz7p0q8awfut0	\N	1182506	\N	Pembelian rutin	2025-12-11 09:46:38.034
cmj197az9005nz7p0oewdul3h	cmj197aqh0027z7p022uup31r	19	cmj197ams000fz7p0q8awfut0	\N	1967215	\N	Pembelian rutin	2025-12-11 09:46:38.037
cmj197aza005oz7p0g8gan8fv	cmj197atv0042z7p0apnzkfin	8	cmj197amq000dz7p01ndwovr3	\N	3075525	\N	Pembelian rutin	2025-12-11 09:46:38.038
cmj197azc005pz7p0o963h62h	cmj197auu004kz7p0exou8zy7	14	cmj197amr000ez7p057whrzqy	\N	1182506	\N	Pembelian rutin	2025-12-11 09:46:38.04
cmj197aze005rz7p04a68txt0	cmj197aud004fz7p0g6whkvk3	10	cmj197amq000dz7p01ndwovr3	\N	495878	\N	Pembelian rutin	2025-12-11 09:46:38.042
cmj197azg005tz7p00o09v251	cmj197asg003az7p00lkv4h0s	14	cmj197amq000dz7p01ndwovr3	\N	1103361	\N	Pembelian rutin	2025-12-11 09:46:38.044
cmj197azh005uz7p06kxjji19	cmj197aqj0029z7p05dyo9saz	20	cmj197ams000fz7p0q8awfut0	\N	1174315	\N	Pembelian rutin	2025-12-11 09:46:38.045
cmj197azj005wz7p0muzjf538	cmj197atq003yz7p09oepwrd9	11	cmj197ams000fz7p0q8awfut0	\N	4466394	\N	Pembelian rutin	2025-12-11 09:46:38.047
cmj197azl005yz7p07idvacqt	cmj197asr003hz7p0a3tzhztd	14	cmj197amq000dz7p01ndwovr3	\N	2283364	\N	Pembelian rutin	2025-12-11 09:46:38.049
cmj197azn005zz7p0vdlwwxyt	cmj197aqz002kz7p0s3kjgt20	15	cmj197amr000ez7p057whrzqy	\N	2537155	\N	Pembelian rutin	2025-12-11 09:46:38.051
cmj197azq0060z7p0vf7aetnw	cmj197as30032z7p0n9kwnj8r	19	cmj197ams000fz7p0q8awfut0	\N	3681442	\N	Pembelian rutin	2025-12-11 09:46:38.054
cmj197azt0062z7p04ixkqgoh	cmj197arb002oz7p0iqwrml8y	12	cmj197amr000ez7p057whrzqy	\N	1122208	\N	Pembelian rutin	2025-12-11 09:46:38.057
cmj197azu0063z7p0pasz6395	cmj197asc0038z7p011kbe8tw	11	cmj197amm000bz7p0o4mwjtf9	\N	940749	\N	Pembelian rutin	2025-12-11 09:46:38.058
cmj197azw0064z7p02pzsyl5e	cmj197asu003jz7p0btllrp1i	7	cmj197amr000ez7p057whrzqy	\N	270932	\N	Pembelian rutin	2025-12-11 09:46:38.06
cmj197azy0065z7p0yxjtuugs	cmj197arn002xz7p0236xktfa	9	cmj197amr000ez7p057whrzqy	\N	552298	\N	Pembelian rutin	2025-12-11 09:46:38.062
cmj197azz0066z7p0siipsso3	cmj197aqa0021z7p0sddrvm86	13	cmj197ams000fz7p0q8awfut0	\N	2036932	\N	Pembelian rutin	2025-12-11 09:46:38.063
cmj197b010067z7p0jhgz5yzq	cmj197aqj0029z7p05dyo9saz	18	cmj197amq000dz7p01ndwovr3	\N	1174315	\N	Pembelian rutin	2025-12-11 09:46:38.065
cmj197b020068z7p063jhxri0	cmj197arp002zz7p0xbuu5us6	8	cmj197amq000dz7p01ndwovr3	\N	4402030	\N	Pembelian rutin	2025-12-11 09:46:38.066
cmj197b05006az7p05ai1jamj	cmj197aub004ez7p0rtk1bj5f	18	cmj197amr000ez7p057whrzqy	\N	454055	\N	Pembelian rutin	2025-12-11 09:46:38.069
cmj197b07006cz7p0qkult5ei	cmj197aq6001yz7p0c3cau3bb	9	cmj197amm000bz7p0o4mwjtf9	\N	1300954	\N	Pembelian rutin	2025-12-11 09:46:38.071
cmj197b08006dz7p0sr7sqegv	cmj197as80035z7p0ef4l13kh	5	cmj197amr000ez7p057whrzqy	\N	3644223	\N	Pembelian rutin	2025-12-11 09:46:38.072
cmj197b0a006fz7p02h8ezjph	cmj197aty0044z7p0rsrxtxl7	5	cmj197amq000dz7p01ndwovr3	\N	407278	\N	Pembelian rutin	2025-12-11 09:46:38.074
cmj197b0c006gz7p078ka7bl5	cmj197aqc0023z7p0n4t13yga	18	cmj197ams000fz7p0q8awfut0	\N	4829564	\N	Pembelian rutin	2025-12-11 09:46:38.076
\.


--
-- Data for Name: StockOpname; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."StockOpname" (id, "opnameDate", notes, status, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: StockOpnameItem; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."StockOpnameItem" (id, "opnameId", "sparepartId", "systemStock", "physicalStock", difference, notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: StockOut; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."StockOut" (id, "sparepartId", "equipmentId", "employeeId", quantity, purpose, status, "approvedAt", "approvedBy", "rejectedReason", "scannedBarcode", "createdAt", "updatedAt") FROM stdin;
cmj197b0f006iz7p0qt6ws5ku	cmj197asg003az7p00lkv4h0s	cmj197ao0000xz7p0owr4ci0q	cmj197ax8004qz7p0lv5ig0t4	2	Service berkala	approved	2025-11-27 09:46:38.078	\N	\N	\N	2025-12-11 09:46:38.079	2025-12-11 09:46:38.079
cmj197b0j006jz7p01m05jtsg	cmj197aq6001yz7p0c3cau3bb	cmj197aok0019z7p0lzue1r6k	cmj197axk004uz7p0ohqjk7el	5	Perbaikan rutin	pending	\N	\N	\N	\N	2025-12-11 09:46:38.083	2025-12-11 09:46:38.083
cmj197b0k006kz7p0hfj72tqk	cmj197asx003lz7p0s4xhb1p5	cmj197aof0016z7p0l4t5gv70	cmj197axk004uz7p0ohqjk7el	2	Penggantian komponen rusak	approved	2025-12-02 09:46:38.084	\N	\N	\N	2025-12-11 09:46:38.084	2025-12-11 09:46:38.084
cmj197b0m006lz7p014c65xth	cmj197asi003bz7p0it59ghzp	cmj197anw000vz7p02kyxqmfa	cmj197axy004xz7p0g860i4hk	1	Service berkala	approved	2025-12-02 09:46:38.086	\N	\N	\N	2025-12-11 09:46:38.086	2025-12-11 09:46:38.086
cmj197b0o006mz7p06tz0noke	cmj197au7004bz7p0bsh9nz7c	cmj197apf001nz7p05bbrfdv9	cmj197axx004wz7p0axbon03d	5	Overhaul	rejected	\N	\N	Stok tidak mencukupi	\N	2025-12-11 09:46:38.088	2025-12-11 09:46:38.088
cmj197b0p006nz7p06qzyy2lm	cmj197aqs002gz7p0yglndir5	cmj197anb000lz7p0lww6yq03	cmj197axy004xz7p0g860i4hk	1	Overhaul	rejected	\N	\N	Stok tidak mencukupi	\N	2025-12-11 09:46:38.088	2025-12-11 09:46:38.088
cmj197b0q006oz7p06a4pbb3p	cmj197asi003bz7p0it59ghzp	cmj197aoi0018z7p0vpvi9we2	cmj197avh004nz7p0enqapqbp	2	Overhaul	rejected	\N	\N	Stok tidak mencukupi	\N	2025-12-11 09:46:38.09	2025-12-11 09:46:38.09
cmj197b0r006pz7p0j3b1p6qq	cmj197aqs002gz7p0yglndir5	cmj197amz000hz7p0hxbizduz	cmj197ay80052z7p0hmdnv285	5	Penggantian komponen rusak	approved	2025-11-27 09:46:38.09	\N	\N	\N	2025-12-11 09:46:38.091	2025-12-11 09:46:38.091
cmj197b0s006qz7p03o5len6r	cmj197as80035z7p0ef4l13kh	cmj197an6000jz7p0kvcle4x2	cmj197axb004rz7p0q43g17eg	2	Penggantian komponen rusak	approved	2025-11-21 09:46:38.092	\N	\N	\N	2025-12-11 09:46:38.092	2025-12-11 09:46:38.092
cmj197b0u006rz7p0z9eoft8r	cmj197au30048z7p0mfve246u	cmj197apo001sz7p0aue4hnqi	cmj197av4004mz7p02ml0myd9	1	Overhaul	approved	2025-12-04 09:46:38.094	\N	\N	\N	2025-12-11 09:46:38.094	2025-12-11 09:46:38.094
cmj197b0w006sz7p07drst5y0	cmj197aq3001wz7p0trfzdi6a	cmj197aok0019z7p0lzue1r6k	cmj197axx004wz7p0axbon03d	1	Penggantian komponen rusak	approved	2025-11-24 09:46:38.096	\N	\N	\N	2025-12-11 09:46:38.096	2025-12-11 09:46:38.096
cmj197b0x006tz7p00kxoptai	cmj197aue004gz7p01z6lbqgb	cmj197apa001kz7p05b0tnpan	cmj197ax8004qz7p0lv5ig0t4	1	Perbaikan rutin	approved	2025-11-24 09:46:38.097	\N	\N	\N	2025-12-11 09:46:38.097	2025-12-11 09:46:38.097
cmj197b0z006uz7p06l4zt4dn	cmj197aqm002bz7p0dqf53nb7	cmj197anj000pz7p0r3drjn1d	cmj197ay50050z7p0yic5t20i	4	Penggantian komponen rusak	rejected	\N	\N	Stok tidak mencukupi	\N	2025-12-11 09:46:38.099	2025-12-11 09:46:38.099
cmj197b10006vz7p0e83rfpre	cmj197arh002tz7p0zhr7b44e	cmj197aoh0017z7p0djtn03h3	cmj197ay80052z7p0hmdnv285	3	Penggantian komponen rusak	approved	2025-11-29 09:46:38.099	\N	\N	\N	2025-12-11 09:46:38.1	2025-12-11 09:46:38.1
cmj197b11006wz7p0g9j5eexc	cmj197atz0045z7p0n18d40bq	cmj197apk001qz7p0p0vxdkmg	cmj197ay1004yz7p0zf4knv42	1	Penggantian komponen rusak	pending	\N	\N	\N	\N	2025-12-11 09:46:38.101	2025-12-11 09:46:38.101
cmj197b11006xz7p050jkzwp0	cmj197as70034z7p0ow7gupe4	cmj197anu000uz7p0u6634s5o	cmj197axd004sz7p0xngiwr47	5	Perbaikan rutin	approved	2025-11-16 09:46:38.101	\N	\N	\N	2025-12-11 09:46:38.101	2025-12-11 09:46:38.101
cmj197b13006yz7p0eoxcgnyj	cmj197aui004hz7p0wknz7g0z	cmj197ang000oz7p0t5wf5th2	cmj197axu004vz7p0on1s4rzj	3	Perbaikan rutin	approved	2025-11-29 09:46:38.102	\N	\N	\N	2025-12-11 09:46:38.103	2025-12-11 09:46:38.103
cmj197b14006zz7p0auy0dxs6	cmj197arc002pz7p0px695gyg	cmj197aof0016z7p0l4t5gv70	cmj197ax8004qz7p0lv5ig0t4	3	Perbaikan rutin	approved	2025-11-16 09:46:38.104	\N	\N	\N	2025-12-11 09:46:38.104	2025-12-11 09:46:38.104
cmj197b150070z7p0dijsq8y5	cmj197aqj0029z7p05dyo9saz	cmj197ano000rz7p016osocij	cmj197axb004rz7p0q43g17eg	5	Service berkala	approved	2025-12-10 09:46:38.105	\N	\N	\N	2025-12-11 09:46:38.105	2025-12-11 09:46:38.105
cmj197b160071z7p0y7nuvvax	cmj197asx003lz7p0s4xhb1p5	cmj197apf001nz7p05bbrfdv9	cmj197ax8004qz7p0lv5ig0t4	2	Service berkala	approved	2025-12-10 09:46:38.106	\N	\N	\N	2025-12-11 09:46:38.106	2025-12-11 09:46:38.106
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Supplier" (id, name, phone, email, address, "createdAt", "updatedAt") FROM stdin;
cmj197amm000bz7p0o4mwjtf9	PT. Sparepart Jaya	021-1234567	\N	Jl. Industri No. 1, Jakarta	2025-12-11 09:46:37.582	2025-12-11 09:46:37.582
cmj197amo000cz7p0oy6fru96	CV. Alat Berat Indonesia	031-7654321	\N	Jl. Workshop No. 25, Surabaya	2025-12-11 09:46:37.584	2025-12-11 09:46:37.584
cmj197amq000dz7p01ndwovr3	UD. Mesin Mandiri	022-9876543	\N	Jl. Mekanik No. 10, Bandung	2025-12-11 09:46:37.586	2025-12-11 09:46:37.586
cmj197amr000ez7p057whrzqy	PT. Hydraulic System	024-1112233	\N	Jl. Teknik No. 5, Semarang	2025-12-11 09:46:37.587	2025-12-11 09:46:37.587
cmj197ams000fz7p0q8awfut0	CV. Diesel Parts	061-4455667	\N	Jl. Otomotif No. 88, Medan	2025-12-11 09:46:37.588	2025-12-11 09:46:37.588
\.


--
-- Data for Name: TokenBlacklist; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."TokenBlacklist" (id, token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."User" (id, username, password, name, role, "createdAt", "updatedAt", "failedLoginAttempts", "lastLoginAt", "lastLoginIp", "lockedUntil") FROM stdin;
cmj197aln0000z7p0iotv03cj	admin	$2b$10$eLvCj3RDVaYer.weP9UjveKXfkoFtPfISgi2TGEZL5SkcJb9VIUlm	Administrator	admin	2025-12-11 09:46:37.486	2025-12-18 02:18:39.939	0	2025-12-18 02:18:39.938	::1	\N
\.


--
-- Data for Name: Warranty; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public."Warranty" (id, "stockInId", "sparepartId", "expiryDate", "claimStatus", "claimDate", "claimNotes", "createdAt") FROM stdin;
cmj197ayt005cz7p0dtm2wasj	cmj197ayp005bz7p0m6z9ltwp	cmj197atu0041z7p02lag61ip	2027-08-09 09:46:38.016	active	\N	\N	2025-12-11 09:46:38.021
cmj197az0005gz7p0y96zv2gm	cmj197ayy005fz7p0i23myjcg	cmj197aq90020z7p0g72hcm4j	2026-06-15 09:46:38.026	active	\N	\N	2025-12-11 09:46:38.028
cmj197az5005kz7p0r22920wa	cmj197az3005jz7p0pqfhtqdj	cmj197arm002wz7p03hvj6k9p	2026-08-07 09:46:38.031	active	\N	\N	2025-12-11 09:46:38.033
cmj197az7005mz7p0an9r0t8m	cmj197az6005lz7p0tsmrv1i1	cmj197auu004kz7p0exou8zy7	2027-08-01 09:46:38.034	active	\N	\N	2025-12-11 09:46:38.035
cmj197azd005qz7p0l2ixv8qz	cmj197azc005pz7p0o963h62h	cmj197auu004kz7p0exou8zy7	2026-07-22 09:46:38.039	active	\N	\N	2025-12-11 09:46:38.041
cmj197azf005sz7p0nqkhqpgw	cmj197aze005rz7p04a68txt0	cmj197aud004fz7p0g6whkvk3	2027-05-13 09:46:38.041	active	\N	\N	2025-12-11 09:46:38.043
cmj197azj005vz7p08a89xej1	cmj197azh005uz7p06kxjji19	cmj197aqj0029z7p05dyo9saz	2027-11-23 09:46:38.045	active	\N	\N	2025-12-11 09:46:38.047
cmj197azl005xz7p08osi06ua	cmj197azj005wz7p0muzjf538	cmj197atq003yz7p09oepwrd9	2026-07-07 09:46:38.047	active	\N	\N	2025-12-11 09:46:38.049
cmj197azs0061z7p0amooca29	cmj197azq0060z7p0vf7aetnw	cmj197as30032z7p0n9kwnj8r	2026-10-17 09:46:38.054	active	\N	\N	2025-12-11 09:46:38.056
cmj197b040069z7p0a50jj7z2	cmj197b020068z7p063jhxri0	cmj197arp002zz7p0xbuu5us6	2026-08-06 09:46:38.066	active	\N	\N	2025-12-11 09:46:38.068
cmj197b06006bz7p0n4ua5z2r	cmj197b05006az7p05ai1jamj	cmj197aub004ez7p0rtk1bj5f	2027-03-15 09:46:38.068	active	\N	\N	2025-12-11 09:46:38.07
cmj197b0a006ez7p0cei9epjg	cmj197b08006dz7p0sr7sqegv	cmj197as80035z7p0ef4l13kh	2026-09-26 09:46:38.072	active	\N	\N	2025-12-11 09:46:38.074
cmj197b0e006hz7p0aoymgc32	cmj197b0c006gz7p078ka7bl5	cmj197aqc0023z7p0n4t13yga	2026-10-30 09:46:38.076	active	\N	\N	2025-12-11 09:46:38.078
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: armanda
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
432c0434-d57d-4131-aadf-18a973437744	709d6d1bbe5493a71b1930a633f9049d3fb63adeeeeadbc1d51fe0271236daa7	2025-12-11 16:46:04.469876+07	20251211094604_init	\N	\N	2025-12-11 16:46:04.436589+07	1
\.


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: CleanupLog CleanupLog_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."CleanupLog"
    ADD CONSTRAINT "CleanupLog_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: EquipmentCompatibility EquipmentCompatibility_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."EquipmentCompatibility"
    ADD CONSTRAINT "EquipmentCompatibility_pkey" PRIMARY KEY (id);


--
-- Name: HeavyEquipment HeavyEquipment_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."HeavyEquipment"
    ADD CONSTRAINT "HeavyEquipment_pkey" PRIMARY KEY (id);


--
-- Name: ImportLog ImportLog_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."ImportLog"
    ADD CONSTRAINT "ImportLog_pkey" PRIMARY KEY (id);


--
-- Name: LoginAttempt LoginAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."LoginAttempt"
    ADD CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY (id);


--
-- Name: PettyCashCategory PettyCashCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."PettyCashCategory"
    ADD CONSTRAINT "PettyCashCategory_pkey" PRIMARY KEY (id);


--
-- Name: PettyCash PettyCash_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."PettyCash"
    ADD CONSTRAINT "PettyCash_pkey" PRIMARY KEY (id);


--
-- Name: SecurityLog SecurityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."SecurityLog"
    ADD CONSTRAINT "SecurityLog_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Sparepart Sparepart_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Sparepart"
    ADD CONSTRAINT "Sparepart_pkey" PRIMARY KEY (id);


--
-- Name: StockIn StockIn_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockIn"
    ADD CONSTRAINT "StockIn_pkey" PRIMARY KEY (id);


--
-- Name: StockOpnameItem StockOpnameItem_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOpnameItem"
    ADD CONSTRAINT "StockOpnameItem_pkey" PRIMARY KEY (id);


--
-- Name: StockOpname StockOpname_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOpname"
    ADD CONSTRAINT "StockOpname_pkey" PRIMARY KEY (id);


--
-- Name: StockOut StockOut_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOut"
    ADD CONSTRAINT "StockOut_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: TokenBlacklist TokenBlacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."TokenBlacklist"
    ADD CONSTRAINT "TokenBlacklist_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Warranty Warranty_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Warranty"
    ADD CONSTRAINT "Warranty_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Attendance_date_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Attendance_date_idx" ON public."Attendance" USING btree (date);


--
-- Name: Attendance_employeeId_date_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON public."Attendance" USING btree ("employeeId", date);


--
-- Name: Attendance_status_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Attendance_status_idx" ON public."Attendance" USING btree (status);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_recordId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "AuditLog_recordId_idx" ON public."AuditLog" USING btree ("recordId");


--
-- Name: AuditLog_tableName_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "AuditLog_tableName_idx" ON public."AuditLog" USING btree ("tableName");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: CleanupLog_action_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "CleanupLog_action_idx" ON public."CleanupLog" USING btree (action);


--
-- Name: CleanupLog_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "CleanupLog_createdAt_idx" ON public."CleanupLog" USING btree ("createdAt");


--
-- Name: Employee_name_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Employee_name_idx" ON public."Employee" USING btree (name);


--
-- Name: Employee_nik_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Employee_nik_key" ON public."Employee" USING btree (nik);


--
-- Name: Employee_position_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Employee_position_idx" ON public."Employee" USING btree ("position");


--
-- Name: EquipmentCompatibility_equipmentType_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "EquipmentCompatibility_equipmentType_idx" ON public."EquipmentCompatibility" USING btree ("equipmentType");


--
-- Name: EquipmentCompatibility_sparepartId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "EquipmentCompatibility_sparepartId_idx" ON public."EquipmentCompatibility" USING btree ("sparepartId");


--
-- Name: HeavyEquipment_code_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "HeavyEquipment_code_key" ON public."HeavyEquipment" USING btree (code);


--
-- Name: HeavyEquipment_site_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "HeavyEquipment_site_idx" ON public."HeavyEquipment" USING btree (site);


--
-- Name: HeavyEquipment_status_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "HeavyEquipment_status_idx" ON public."HeavyEquipment" USING btree (status);


--
-- Name: HeavyEquipment_type_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "HeavyEquipment_type_idx" ON public."HeavyEquipment" USING btree (type);


--
-- Name: ImportLog_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "ImportLog_createdAt_idx" ON public."ImportLog" USING btree ("createdAt");


--
-- Name: ImportLog_type_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "ImportLog_type_idx" ON public."ImportLog" USING btree (type);


--
-- Name: LoginAttempt_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "LoginAttempt_createdAt_idx" ON public."LoginAttempt" USING btree ("createdAt");


--
-- Name: LoginAttempt_ipAddress_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "LoginAttempt_ipAddress_idx" ON public."LoginAttempt" USING btree ("ipAddress");


--
-- Name: LoginAttempt_username_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "LoginAttempt_username_idx" ON public."LoginAttempt" USING btree (username);


--
-- Name: PettyCashCategory_name_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "PettyCashCategory_name_key" ON public."PettyCashCategory" USING btree (name);


--
-- Name: PettyCash_categoryId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "PettyCash_categoryId_idx" ON public."PettyCash" USING btree ("categoryId");


--
-- Name: PettyCash_date_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "PettyCash_date_idx" ON public."PettyCash" USING btree (date);


--
-- Name: PettyCash_type_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "PettyCash_type_idx" ON public."PettyCash" USING btree (type);


--
-- Name: SecurityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "SecurityLog_createdAt_idx" ON public."SecurityLog" USING btree ("createdAt");


--
-- Name: SecurityLog_eventType_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "SecurityLog_eventType_idx" ON public."SecurityLog" USING btree ("eventType");


--
-- Name: SecurityLog_ipAddress_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "SecurityLog_ipAddress_idx" ON public."SecurityLog" USING btree ("ipAddress");


--
-- Name: SecurityLog_riskLevel_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "SecurityLog_riskLevel_idx" ON public."SecurityLog" USING btree ("riskLevel");


--
-- Name: SecurityLog_userId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "SecurityLog_userId_idx" ON public."SecurityLog" USING btree ("userId");


--
-- Name: Session_expires_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Session_expires_idx" ON public."Session" USING btree (expires);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Sparepart_categoryId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Sparepart_categoryId_idx" ON public."Sparepart" USING btree ("categoryId");


--
-- Name: Sparepart_code_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Sparepart_code_idx" ON public."Sparepart" USING btree (code);


--
-- Name: Sparepart_code_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Sparepart_code_key" ON public."Sparepart" USING btree (code);


--
-- Name: Sparepart_name_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Sparepart_name_idx" ON public."Sparepart" USING btree (name);


--
-- Name: StockIn_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockIn_createdAt_idx" ON public."StockIn" USING btree ("createdAt");


--
-- Name: StockIn_sparepartId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockIn_sparepartId_idx" ON public."StockIn" USING btree ("sparepartId");


--
-- Name: StockIn_supplierId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockIn_supplierId_idx" ON public."StockIn" USING btree ("supplierId");


--
-- Name: StockOpnameItem_opnameId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOpnameItem_opnameId_idx" ON public."StockOpnameItem" USING btree ("opnameId");


--
-- Name: StockOpnameItem_sparepartId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOpnameItem_sparepartId_idx" ON public."StockOpnameItem" USING btree ("sparepartId");


--
-- Name: StockOpname_opnameDate_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOpname_opnameDate_idx" ON public."StockOpname" USING btree ("opnameDate");


--
-- Name: StockOpname_status_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOpname_status_idx" ON public."StockOpname" USING btree (status);


--
-- Name: StockOut_createdAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOut_createdAt_idx" ON public."StockOut" USING btree ("createdAt");


--
-- Name: StockOut_employeeId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOut_employeeId_idx" ON public."StockOut" USING btree ("employeeId");


--
-- Name: StockOut_equipmentId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOut_equipmentId_idx" ON public."StockOut" USING btree ("equipmentId");


--
-- Name: StockOut_sparepartId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOut_sparepartId_idx" ON public."StockOut" USING btree ("sparepartId");


--
-- Name: StockOut_status_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "StockOut_status_idx" ON public."StockOut" USING btree (status);


--
-- Name: TokenBlacklist_expiresAt_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "TokenBlacklist_expiresAt_idx" ON public."TokenBlacklist" USING btree ("expiresAt");


--
-- Name: TokenBlacklist_token_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "TokenBlacklist_token_idx" ON public."TokenBlacklist" USING btree (token);


--
-- Name: TokenBlacklist_token_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "TokenBlacklist_token_key" ON public."TokenBlacklist" USING btree (token);


--
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Warranty_claimStatus_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Warranty_claimStatus_idx" ON public."Warranty" USING btree ("claimStatus");


--
-- Name: Warranty_expiryDate_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Warranty_expiryDate_idx" ON public."Warranty" USING btree ("expiryDate");


--
-- Name: Warranty_sparepartId_idx; Type: INDEX; Schema: public; Owner: armanda
--

CREATE INDEX "Warranty_sparepartId_idx" ON public."Warranty" USING btree ("sparepartId");


--
-- Name: Warranty_stockInId_key; Type: INDEX; Schema: public; Owner: armanda
--

CREATE UNIQUE INDEX "Warranty_stockInId_key" ON public."Warranty" USING btree ("stockInId");


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EquipmentCompatibility EquipmentCompatibility_sparepartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."EquipmentCompatibility"
    ADD CONSTRAINT "EquipmentCompatibility_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES public."Sparepart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PettyCash PettyCash_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."PettyCash"
    ADD CONSTRAINT "PettyCash_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."PettyCashCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sparepart Sparepart_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Sparepart"
    ADD CONSTRAINT "Sparepart_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockIn StockIn_sparepartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockIn"
    ADD CONSTRAINT "StockIn_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES public."Sparepart"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockIn StockIn_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockIn"
    ADD CONSTRAINT "StockIn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockOpnameItem StockOpnameItem_opnameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOpnameItem"
    ADD CONSTRAINT "StockOpnameItem_opnameId_fkey" FOREIGN KEY ("opnameId") REFERENCES public."StockOpname"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StockOpnameItem StockOpnameItem_sparepartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOpnameItem"
    ADD CONSTRAINT "StockOpnameItem_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES public."Sparepart"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockOut StockOut_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOut"
    ADD CONSTRAINT "StockOut_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockOut StockOut_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOut"
    ADD CONSTRAINT "StockOut_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public."HeavyEquipment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockOut StockOut_sparepartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."StockOut"
    ADD CONSTRAINT "StockOut_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES public."Sparepart"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Warranty Warranty_sparepartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Warranty"
    ADD CONSTRAINT "Warranty_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES public."Sparepart"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Warranty Warranty_stockInId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: armanda
--

ALTER TABLE ONLY public."Warranty"
    ADD CONSTRAINT "Warranty_stockInId_fkey" FOREIGN KEY ("stockInId") REFERENCES public."StockIn"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict CzdrufY6ZS7H7wMTPqv1FG8gqGETFtyBMiWaCBeLuNCwRJPJJ3UTehH9ulyv7NR

