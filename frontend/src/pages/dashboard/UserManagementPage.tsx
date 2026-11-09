import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
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

  // Lock background scroll when modal is open
  useBodyScrollLock(isModalOpen);

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
    if (!window.confirm(`Yakin ingin menonaktifkan/menghapus pengguna ${u.fullName} (@${u.username})?`)) {
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
        const payload: Partial<typeof formData> = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(formData);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white border border-[#d0d7de]">
        <h2 className="text-base font-semibold text-[#cf222e] mb-1">Akses Terbatas</h2>
        <p className="text-sm text-[#57606a]">
          Manajemen Pengguna hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1f2328] tracking-tight">
            Manajemen Pengguna & Staf Petugas
          </h1>
          <p className="text-sm text-[#57606a] mt-1">
            Pengelolaan akun internal, penugasan peran dokter hewan, petugas pos, dan pimpinan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 transition-colors shadow-2xs self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="p-4 sm:p-5 border border-[#d0d7de] bg-[#f6f8fa]">
        <h3 className="font-semibold text-xs sm:text-sm text-[#1f2328] uppercase tracking-wider mb-3">
          Matriks Hak Akses & Peran (Role Permission Matrix)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs sm:text-sm text-[#1f2328]">
            <thead className="border-b border-[#d0d7de] text-[#57606a] font-semibold">
              <tr>
                <th className="py-2 px-2.5">Fitur / Hak Akses</th>
                <th className="py-2 px-2.5 text-center">Admin</th>
                <th className="py-2 px-2.5 text-center">Petugas (Operator)</th>
                <th className="py-2 px-2.5 text-center">Dokter Hewan (Inspector)</th>
                <th className="py-2 px-2.5 text-center">Pimpinan (Viewer)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/50">
              <tr>
                <td className="py-2 px-2.5 font-medium">Input & Hapus Data Lalu Lintas</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Ya</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium">Verifikasi Kesehatan & SKKH</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Terbatas</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Khusus</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Baca-Saja</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium">Kalkulasi Otomatis & Rekapitulasi</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium">Log Audit Perubahan</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Baca-Saja</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium">Manajemen Pengguna & WhatsApp</td>
                <td className="py-2 px-2.5 text-center text-[#1a7f37] font-semibold">&#10003; Penuh</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
                <td className="py-2 px-2.5 text-center text-[#57606a]">&#10005; Tidak</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Table */}
      <div className="border border-[#d0d7de] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Nama Lengkap & Username</th>
                <th className="py-3 px-3.5">Email & Kontak</th>
                <th className="py-3 px-3.5">Peran (Role)</th>
                <th className="py-3 px-3.5">Status Akun</th>
                <th className="py-3 px-3.5">Instansi / Unit</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#57606a]">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1a7f37] rounded rounded-full  border-t-transparent animate-spin"></div>
                      <span>Memuat daftar pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#57606a]">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f6f8fa]/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-[#1f2328]">{u.fullName}</div>
                      <div className="text-xs font-mono text-[#57606a]">@{u.username}</div>
                    </td>

                    <td className="py-3 px-3.5 text-xs sm:text-sm">
                      <div className="text-[#1f2328]">{u.email}</div>
                      <div className="text-[#57606a]">{u.phoneNumber || '-'}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-mono text-xs uppercase font-semibold px-2.5 py-0.5 bg-[#f6f8fa] border border-[#d0d7de] text-[#1f2328]">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-[#1a7f37] bg-[#dafbe1]">
                          <span className="w-1.5 h-1.5 bg-[#1a7f37]"></span>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-[#cf222e] bg-[#ffebe9]">
                          <span className="w-1.5 h-1.5 bg-[#cf222e]"></span>
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-xs text-[#57606a] truncate max-w-[200px]">
                      {u.agency || '-'}
                    </td>

                    <td className="py-3 px-3.5 text-right space-x-2.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="text-xs text-[#0969da] hover:underline font-semibold cursor-pointer"
                      >
                        Ubah
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="text-xs text-[#cf222e] hover:underline font-semibold cursor-pointer"
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

      {/* User Create/Edit Modal with Fast Framer Motion (< 250ms) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#d0d7de] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <h3 className="font-semibold text-base text-[#1f2328]">
                  {editingUser ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#57606a] hover:text-[#1f2328] text-xl leading-none cursor-pointer"
                  aria-label="Tutup"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm">
                {modalError && (
                  <div className="p-3.5 bg-[#ffebe9] border border-[#ff8182]/40 text-sm text-[#cf222e]">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="misal: drh. Sarah Wonda"
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="misal: sarah_wonda"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Email Resmi</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="misal: sarah@mimikakab.go.id"
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                    {editingUser ? 'Kata Sandi Baru (Kosongkan bila tidak diubah)' : 'Kata Sandi Awal'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan' : 'Minimal 6 karakter'}
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Peran (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  >
                    <option value="petugas">Petugas Lapangan / Operator</option>
                    <option value="dokter_hewan">Dokter Hewan Berwenang (Inspector)</option>
                    <option value="pimpinan">Pimpinan / Auditor (Viewer)</option>
                    <option value="admin">Administrator Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="misal: 081248000000"
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Instansi / Unit Kerja</label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                  />
                </div>

                {editingUser && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isActiveCheck"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 border-[#d0d7de] text-[#1a7f37] focus:ring-[#1a7f37]"
                    />
                    <label htmlFor="isActiveCheck" className="text-sm text-[#1f2328] font-medium cursor-pointer">
                      Akun Aktif (Dapat masuk ke sistem)
                    </label>
                  </div>
                )}

                <div className="pt-4 border-t border-[#d0d7de] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#d0d7de] text-sm font-semibold text-[#1f2328] hover:bg-[#f6f8fa] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold text-sm text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
