export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'admin' | 'petugas' | 'dokter_hewan' | 'pimpinan';
  isActive: boolean;
  phoneNumber?: string;
  agency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TrafficAttachment {
  id: string;
  trafficId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface WhatsappAttachment {
  id: string;
  recapId?: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface WhatsappRecapBackend {
  id: string;
  reporterName: string;
  reporterPhone?: string;
  address: string;
  serviceType: 'INFORMASI' | 'BANTUAN';
  description: string;
  status: 'BARU' | 'DIPROSES' | 'SELESAI';
  recordedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: WhatsappAttachment[];
}

export interface TrafficRecord {
  id: string;
  recordNumber: string;
  trafficType: 'IMPORT' | 'EXPORT';
  category: 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN';
  itemName: string;
  quantity: number;
  unit: string;
  origin: string;
  destination: string;
  transportType: 'UDARA' | 'LAUT' | 'DARAT';
  applicantName: string;
  healthCertificateNo?: string;
  inspectionStatus: 'PENDING' | 'INSPECTED_PASS' | 'INSPECTED_REJECT';
  notes?: string;
  trafficDate: string;
  createdAt: string;
  updatedAt: string;
  attachments?: TrafficAttachment[];
}

export interface TrafficSummaryItem {
  itemName: string;
  category: string;
  unit: string;
  totalImport: number;
  totalExport: number;
  totalVolume: number;
  currentStorage?: number;
  recordCount: number;
}

export interface TrafficRouteSummaryItem {
  trafficType: 'IMPORT' | 'EXPORT';
  origin: string;
  destination: string;
  itemName: string;
  category: string;
  unit: string;
  transportType: 'UDARA' | 'LAUT' | 'DARAT';
  totalQuantity: number;
  recordCount: number;
}

export interface TrafficSummaryResponse {
  items: TrafficSummaryItem[];
  routes?: TrafficRouteSummaryItem[];
  overall: {
    totalRecords: number;
    totalImportQty: number;
    totalExportQty: number;
    totalCombinedQty: number;
    totalStorageQty?: number;
    pendingRecords?: number;
    rejectedRecords?: number;
  };
}

export interface AuditLogRecord {
  id: string;
  userId?: string;
  username: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WhatsappConfig {
  whatsappNumber: string;
  whatsappMessage: string;
  agencyName: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('silantas_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWhatsappConfig(): Promise<WhatsappConfig> {
  const res = await fetch(`${API_BASE}/api/settings/whatsapp`);
  if (!res.ok) throw new Error('Gagal mengambil konfigurasi kontak');
  return res.json();
}

export async function updateWhatsappConfig(payload: { whatsappNumber: string; whatsappMessage?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/whatsapp`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menyimpan nomor WhatsApp');
  }
}

export async function loginUser(identifier: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal masuk akun');
  return data;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Sesi kedaluwarsa');
  return res.json();
}

export async function fetchTrafficRecords(params?: {
  search?: string;
  category?: string;
  trafficType?: string;
  inspectionStatus?: string;
  page?: number;
  perPage?: number;
}): Promise<{ data: TrafficRecord[]; meta: { total: number; page: number; totalPages: number } }> {
  const url = new URL(`${API_BASE}/api/traffic`);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.trafficType) url.searchParams.set('traffic_type', params.trafficType);
  if (params?.inspectionStatus) url.searchParams.set('inspection_status', params.inspectionStatus);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.perPage) url.searchParams.set('per_page', params.perPage.toString());

  const res = await fetch(url.toString(), { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Gagal mengambil data lalu lintas');
  return res.json();
}

export async function fetchTrafficSummary(): Promise<TrafficSummaryResponse> {
  const res = await fetch(`${API_BASE}/api/traffic/summary`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Gagal mengambil rekapitulasi');
  return res.json();
}

export async function createTrafficRecord(record: Partial<TrafficRecord>): Promise<TrafficRecord> {
  const res = await fetch(`${API_BASE}/api/traffic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal menambahkan data');
  return data;
}

export async function updateTrafficRecord(id: string, record: Partial<TrafficRecord>): Promise<TrafficRecord> {
  const res = await fetch(`${API_BASE}/api/traffic/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memperbarui data');
  return data;
}

export async function deleteTrafficRecord(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/traffic/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus data');
  }
}

export async function uploadTrafficAttachments(
  trafficId: string,
  files: File[]
): Promise<TrafficAttachment[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${API_BASE}/api/traffic/${trafficId}/attachments`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal mengunggah berkas lampiran');
  return data;
}

export async function deleteTrafficAttachment(attachmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/traffic/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus berkas lampiran');
  }
}

export function getAttachmentFileUrl(attachmentId: string, download = false): string {
  const token = localStorage.getItem('silantas_token');
  const params = new URLSearchParams();
  if (download) params.set('download', 'true');
  if (token) params.set('token', token);
  const qs = params.toString();
  return `${API_BASE}/api/traffic/attachments/${attachmentId}${qs ? `?${qs}` : ''}`;
}

export async function uploadWhatsappAttachments(
  files: File[]
): Promise<WhatsappAttachment[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${API_BASE}/api/whatsapp/attachments`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal mengunggah berkas lampiran WhatsApp');
  return data;
}

export async function deleteWhatsappAttachment(attachmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/whatsapp/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus berkas lampiran WhatsApp');
  }
}

export function getWhatsappAttachmentUrl(attachmentId: string, download = false): string {
  const token = localStorage.getItem('silantas_token');
  const params = new URLSearchParams();
  if (download) params.set('download', 'true');
  if (token) params.set('token', token);
  const qs = params.toString();
  return `${API_BASE}/api/whatsapp/attachments/${attachmentId}${qs ? `?${qs}` : ''}`;
}

export async function fetchWhatsappRecaps(params?: {
  search?: string;
  serviceType?: string;
  status?: string;
}): Promise<WhatsappRecapBackend[]> {
  const url = new URL(`${API_BASE}/api/whatsapp/recaps`);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.serviceType) url.searchParams.set('service_type', params.serviceType);
  if (params?.status) url.searchParams.set('status', params.status);

  const res = await fetch(url.toString(), { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Gagal mengambil data rekapan WhatsApp');
  const json = await res.json();
  return json.data || [];
}

export async function createWhatsappRecap(
  recap: Partial<WhatsappRecapBackend>,
  attachmentIds?: string[]
): Promise<WhatsappRecapBackend> {
  const res = await fetch(`${API_BASE}/api/whatsapp/recaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ ...recap, attachmentIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal menambahkan rekapan WhatsApp');
  return data;
}

export async function updateWhatsappRecap(
  id: string,
  recap: Partial<WhatsappRecapBackend>
): Promise<WhatsappRecapBackend> {
  const res = await fetch(`${API_BASE}/api/whatsapp/recaps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(recap),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memperbarui rekapan WhatsApp');
  return data;
}

export async function deleteWhatsappRecap(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/whatsapp/recaps/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus rekapan WhatsApp');
  }
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Gagal mengambil daftar pengguna');
  return res.json();
}

export async function createUser(payload: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: string;
  agency?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal menambahkan pengguna');
  return data;
}

export async function updateUser(id: string, payload: {
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  phoneNumber?: string;
  agency?: string;
  password?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memperbarui pengguna');
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus pengguna');
  }
}

export async function fetchAuditLogs(params?: {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
}): Promise<{ data: AuditLogRecord[]; meta: { total: number; page: number; totalPages: number } }> {
  const url = new URL(`${API_BASE}/api/audit-logs`);
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.action) url.searchParams.set('action', params.action);
  if (params?.entityType) url.searchParams.set('entity_type', params.entityType);
  if (params?.page) url.searchParams.set('page', params.page.toString());

  const res = await fetch(url.toString(), { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Gagal mengambil data log audit');
  return res.json();
}

export interface BackupConfig {
  intervalDays: number;
  autoEnabled: boolean;
  retentionCount: number;
  lastRun?: string;
  lastStatus?: string;
  nextRun?: string;
}

export interface BackupFileItem {
  filename: string;
  sizeBytes: number;
  sizeDisplay: string;
  createdAt: string;
  triggerType: 'AUTO' | 'MANUAL';
  checksumSha256: string;
}

export interface TableStatItem {
  tableName: string;
  estimatedRows: number;
  totalSize: string;
  tableSize: string;
  indexSize: string;
}

export interface DatabaseStatusResponse {
  databaseName: string;
  databaseVersion: string;
  databaseSize: string;
  databaseSizeBytes: number;
  activeConnections: number;
  config: BackupConfig;
  tables: TableStatItem[];
  totalBackups: number;
  totalBackupBytes: number;
  totalBackupSizeDisplay: string;
}

export async function fetchBackupStatus(): Promise<DatabaseStatusResponse> {
  const res = await fetch(`${API_BASE}/api/backup/status`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal memuat status basis data');
  }
  return res.json();
}

export async function fetchBackupList(): Promise<BackupFileItem[]> {
  const res = await fetch(`${API_BASE}/api/backup/list`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengambil arsip berkas cadangan');
  }
  return res.json();
}

export async function createManualBackup(): Promise<{ message: string; file: BackupFileItem }> {
  const res = await fetch(`${API_BASE}/api/backup/create`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal membuat cadangan basis data');
  return data;
}

export async function updateBackupConfig(payload: {
  intervalDays?: number;
  autoEnabled?: boolean;
  retentionCount?: number;
}): Promise<{ message: string; config: BackupConfig }> {
  const res = await fetch(`${API_BASE}/api/backup/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal memperbarui konfigurasi cadangan');
  return data;
}

export async function deleteBackupFile(filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/backup/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus berkas cadangan');
  }
}

export async function downloadBackupFile(filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/backup/download/${encodeURIComponent(filename)}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengunduh berkas cadangan');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
