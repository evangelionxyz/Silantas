import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createUser, deleteUser, fetchUsers, updateUser, type User } from '../../services/api';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'petugas',
    phoneNumber: '',
    agency: 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',
    isActive: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      email: '',
      password: '',
      role: 'petugas',
      phoneNumber: '',
      agency: 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      phoneNumber: u.phoneNumber || '',
      agency: u.agency || 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',
      isActive: u.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus akun ${u.fullName} (${u.username})?`)) {
      return;
    }
    try {
      await deleteUser(u.id);
      loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pengguna');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          phoneNumber: formData.phoneNumber,
          agency: formData.agency,
          password: formData.password.trim() ? formData.password : undefined,
        });
      } else {
        await createUser({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          agency: formData.agency,
        });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Gagal memproses data');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white border border-[#d0d7de] rounded-md">
        <h2 className="text-base font-semibold text-[#d1242f] mb-1">Akses Terbatas</h2>
        <p className="text-xs text-[#656d76]">
          Manajemen Pengguna hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1f2328] tracking-tight">
            Manajemen Pengguna & Hak Akses (RBAC)
          </h1>
          <p className="text-xs text-[#656d76] mt-0.5">
            Kelola seluruh akun petugas, dokter hewan, dan pimpinan secara terpusat.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded-md transition-colors shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="p-4 rounded-md border border-[#d0d7de] bg-[#f6f8fa]">
        <h3 className="font-semibold text-xs text-[#1f2328] uppercase tracking-wide mb-2">
          Matriks Hak Akses & Peran (Role Permission Matrix)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-[#1f2328]">
            <thead className="border-b border-[#d0d7de] text-[#656d76]">
              <tr>
                <th className="py-1.5 px-2">Fitur / Hak Akses</th>
                <th className="py-1.5 px-2 text-center">Admin</th>
                <th className="py-1.5 px-2 text-center">Petugas (Operator)</th>
                <th className="py-1.5 px-2 text-center">Dokter Hewan (Inspector)</th>
                <th className="py-1.5 px-2 text-center">Pimpinan (Viewer)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/50">
              <tr>
                <td className="py-1.5 px-2 font-medium">Input & Hapus Data Lalu Lintas</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Ya</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-medium">Verifikasi Kesehatan & SKKH</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Terbatas</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Khusus</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Baca-Saja</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-medium">Kalkulasi Otomatis & Rekapitulasi</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-medium">Log Audit Perubahan</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Baca-Saja</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-medium">Manajemen Pengguna & WhatsApp</td>
                <td className="py-1.5 px-2 text-center text-[#1a7f37] font-bold">&#10003; Penuh</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
                <td className="py-1.5 px-2 text-center text-[#656d76]">&#10005; Tidak</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Table */}
      <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
              <tr>
                <th className="py-2.5 px-3">Nama Lengkap & Username</th>
                <th className="py-2.5 px-3">Email & Kontak</th>
                <th className="py-2.5 px-3">Peran (Role)</th>
                <th className="py-2.5 px-3">Status Akun</th>
                <th className="py-2.5 px-3">Instansi / Unit</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#656d76]">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#656d76]">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f6f8fa]/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#1f2328]">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-[#656d76]">@{u.username}</div>
                    </td>

                    <td className="py-2.5 px-3 text-[11px]">
                      <div>{u.email}</div>
                      <div className="text-[#656d76]">{u.phoneNumber || '-'}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#f6f8fa] border border-[#d0d7de] text-[#1f2328]">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a7f37]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1a7f37]"></span>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d1242f]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d1242f]"></span>
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-[#656d76] truncate max-w-[180px]">
                      {u.agency || '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="text-xs text-[#0969da] hover:underline font-medium"
                      >
                        Ubah
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="text-xs text-[#d1242f] hover:underline font-medium"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#d0d7de] shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <h3 className="font-semibold text-sm text-[#1f2328]">
                {editingUser ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#656d76] hover:text-[#1f2328] text-base leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 rounded bg-[#ffebe9] border border-[#ff8182]/40 text-[#d1242f]">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="misal: drh. Sarah Wonda"
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="misal: sarah_wonda"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Email Resmi</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="misal: sarah@mimikakab.go.id"
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan bila tidak diubah)' : 'Kata Sandi Awal'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan' : 'Minimal 6 karakter'}
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Peran (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded bg-white text-[#1f2328]"
                >
                  <option value="petugas">Petugas Lapangan / Operator</option>
                  <option value="dokter_hewan">Dokter Hewan Berwenang (Inspector)</option>
                  <option value="pimpinan">Pimpinan / Auditor (Viewer)</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="misal: 081248000000"
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Instansi / Unit Kerja</label>
                <input
                  type="text"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded"
                />
              </div>

              {editingUser && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-[#d0d7de]"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs text-[#1f2328] font-medium">
                    Akun Aktif (Dapat masuk ke sistem)
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-[#d0d7de] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#d0d7de] rounded text-[#1f2328] hover:bg-[#f6f8fa]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
