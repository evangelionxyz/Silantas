-- Seed Users
-- Password for all seed users is 'password123'
-- Argon2 hash for 'password123' generated
INSERT INTO silantas.users (id, full_name, username, email, password_hash, role, is_active, phone_number, agency)
VALUES 
	('e1000000-0000-0000-0000-000000000001', 'drh. Sarah Wonda, M.Sc.', 'drh_sarah', 'sarah.wonda@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$741vYlQ2X7B8Z8v2$mE8tG7H4Z9r2T0q1L5f8S6m1k2P4o7N9w3V2b1X4z5A', 'dokter_hewan', true, '081248001001', 'Bidang Kesehatan Hewan Kab. Mimika'),
	('e1000000-0000-0000-0000-000000000002', 'Budi Santoso, S.Pt.', 'petugas_budi', 'budi.santoso@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$741vYlQ2X7B8Z8v2$mE8tG7H4Z9r2T0q1L5f8S6m1k2P4o7N9w3V2b1X4z5A', 'petugas', true, '081248001002', 'Pos Pengawasan Lalu Lintas Pomako'),
	('e1000000-0000-0000-0000-000000000003', 'Drs. Yohanis Maturbongs', 'pimpinan_yohanis', 'yohanis.maturbongs@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$741vYlQ2X7B8Z8v2$mE8tG7H4Z9r2T0q1L5f8S6m1k2P4o7N9w3V2b1X4z5A', 'pimpinan', true, '081248001003', 'Kepala Dinas Peternakan & Keswan')
ON CONFLICT (email) DO NOTHING;

-- Seed Traffic Records
INSERT INTO silantas.traffic_records 
(id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, transport_type, applicant_name, health_certificate_no, inspection_status, notes, traffic_date)
VALUES
	('f1000000-0000-0000-0000-000000000001', 'SKKH/MMK/2026/0101', 'IMPORT', 'HEWAN_HIDUP', 'Sapi Bali Bakalan', 45.0, 'ekor', 'Pelabuhan Tanjung Perak, Surabaya', 'Distrik Kuala Kencana, Mimika', 'LAUT', 'CV Papua Mandiri Ternak', 'KH-11/2026/08912', 'INSPECTED_PASS', 'Pemeriksaan fisik normal, suhu rektal 38.5C, bebas gejala PMK dan antraks.', '2026-11-01'),
	('f1000000-0000-0000-0000-000000000002', 'SKKH/MMK/2026/0102', 'IMPORT', 'PRODUK_HEWAN', 'Telur Ayam Ras', 600.0, 'rak', 'Surabaya, Jawa Timur', 'Pasar Sentral Timika', 'LAUT', 'UD Berkah Telur Papua', 'KH-12/2026/04412', 'INSPECTED_PASS', 'Cangkang bersih utuh, desinfeksi kemasan rak kardus selesai.', '2026-11-02'),
	('f1000000-0000-0000-0000-000000000003', 'SKKH/MMK/2026/0103', 'EXPORT', 'HEWAN_HIDUP', 'Sapi Bali Bibit', 15.0, 'ekor', 'Distrik Wania, Mimika', 'Pelabuhan Asmat, Papua Selatan', 'LAUT', 'Koperasi Peternak Amamapare', 'SKKH-EXP/2026/0014', 'INSPECTED_PASS', 'Vaksinasi lengkap, uji serologis negatif.', '2026-11-03'),
	('f1000000-0000-0000-0000-000000000004', 'SKKH/MMK/2026/0104', 'IMPORT', 'PRODUK_HEWAN', 'Daging Sapi Beku', 2500.0, 'kg', 'RPH Surabaya', 'Cold Storage Distrik Mimika Timur', 'LAUT', 'PT Carstensz Boga Sejahtera', 'KH-12/2026/05120', 'INSPECTED_PASS', 'Suhu kontainer -18C terpelihara, sertifikat halal LPPOM MUI valid.', '2026-11-04'),
	('f1000000-0000-0000-0000-000000000005', 'SKKH/MMK/2026/0105', 'IMPORT', 'OLAHAN_PRODUK_HEWAN', 'Sosis Daging Sapi & Ayam', 80.0, 'karton', 'Sidoarjo, Jawa Timur', 'Distrik Mimika Baru', 'UDARA', 'CV Sumber Ritel Timika', 'MD-50123/BPOM/2025', 'INSPECTED_PASS', 'Izin edar BPOM valid, rantai dingin terjaga selama penerbangan kargo.', '2026-11-05'),
	('f1000000-0000-0000-0000-000000000006', 'SKKH/MMK/2026/0106', 'EXPORT', 'PRODUK_HEWAN', 'Telur Ayam Ras', 150.0, 'rak', 'Peternakan Ayam SP 3 Timika', 'Distrik Agats, Asmat', 'LAUT', 'UD Berkah Telur Papua', 'SKKH-EXP/2026/0021', 'INSPECTED_PASS', 'Pemeriksaan sanitasi kemasan rak lulus inspeksi pos Pomako.', '2026-11-06'),
	('f1000000-0000-0000-0000-000000000007', 'SKKH/MMK/2026/0107', 'IMPORT', 'HEWAN_HIDUP', 'Kambing Kacang Betina', 30.0, 'ekor', 'Jeneponto, Sulawesi Selatan', 'Distrik Iwaka, Mimika', 'LAUT', 'Kelompok Tani Harapan Jaya', 'KH-11/2026/09110', 'PENDING', 'Sedang menunggu pengujian sampel darah di laboratorium karantina Pos Pomako.', '2026-11-07')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Audit Logs
INSERT INTO silantas.audit_logs (id, username, user_role, action, entity_type, entity_id, description, metadata)
VALUES
	('a1000000-0000-0000-0000-000000000001', 'evangelionxyz', 'admin', 'CREATE', 'TRAFFIC_RECORD', 'f1000000-0000-0000-0000-000000000001', 'Inisialisasi pencatatan impor Sapi Bali 45 ekor dari Surabaya', '{"source": "system_init"}'::jsonb),
	('a1000000-0000-0000-0000-000000000002', 'drh_sarah', 'dokter_hewan', 'UPDATE', 'TRAFFIC_RECORD', 'f1000000-0000-0000-0000-000000000001', 'Verifikasi pemeriksaan klinis hewan lulus inspeksi fisik di Pos Pomako', '{"status": "INSPECTED_PASS"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
