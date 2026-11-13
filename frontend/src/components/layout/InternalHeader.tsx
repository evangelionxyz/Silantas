import React from 'react';
import { Link } from 'react-router-dom';
import { SUANGGI_BRAND } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';

interface InternalHeaderProps {
    onToggleMobileSidebar: () => void;
}

export const InternalHeader: React.FC<InternalHeaderProps> = ({ onToggleMobileSidebar }) => {
    const { user, logout } = useAuth();

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case 'admin':
                return 'bg-[#ffebe9] text-[#cf222e] border-[#ff8182]/50';
            case 'dokter_hewan':
                return 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b]/50';
            case 'pimpinan':
                return 'bg-[#ddf4ff] text-[#0969da] border-[#54aeff]/50';
            default:
                return 'bg-[#fff8c5] text-[#9a6700] border-[#d4a72c]/50';
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b border-[#d8dbd2] bg-white select-none shadow-[0_2px_8px_rgba(24,45,27,0.06)]">
            <div className="hidden min-h-7 items-center justify-between bg-[#173d22] px-6 text-[14px] font-semibold text-[#f3f1e8] lg:flex xl:px-10">
                <span>{SUANGGI_BRAND.agency}</span>
                <span className="text-[#f4d16b]">{SUANGGI_BRAND.region}</span>
            </div>

            <div className="flex min-h-[5rem] w-full items-center justify-between gap-3 px-3 sm:px-6 xl:px-10">
                {/* Left: Mobile hamburger & Internal Branding */}
                <div className="flex shrink-0 items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onToggleMobileSidebar}
                        className="inline-flex min-h-11 items-center gap-2 border border-[#b9c0b4] px-3 text-sm font-semibold text-[#203b25] hover:bg-[#f2f4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174b2b] lg:hidden"
                        title="Buka Menu Manajemen SUANGGI"
                        aria-label="Buka menu navigasi"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="hidden sm:inline">Menu</span>
                    </button>

                    <Link to="/dashboard" className="flex items-center gap-2.5 text-[#1d2b1f]">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#174b2b] text-sm font-extrabold tracking-tight text-white">
                            {SUANGGI_BRAND.initials}
                        </span>
                        <span className="min-w-0">
                            <span className="block text-base font-extrabold leading-tight tracking-tight text-[#173d22] sm:text-[18px]">{SUANGGI_BRAND.name}</span>
                                            <span className="hidden text-[12px] font-semibold leading-tight text-[#566056] xl:block">SISTEM UPDATE ARUS NIAGA DAN GERAK HEWAN, PRODUK HEWAN, DAN OLAHANNYA</span>
                                            <span className="hidden text-[12px] font-semibold leading-tight text-[#566056] xl:block">CATATAN ARUS, REKAPITULASI, DAN INFORMASI KOMODITAS</span>
                        </span>
                    </Link>
                </div>

                {/* Right Action Controls: Staff Profile + Return to Public Portal + Logout */}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="inline-flex min-h-11 shrink-0 items-center bg-[#174b2b] px-3 text-xs font-bold text-white hover:bg-[#10391f] sm:px-4 sm:text-sm"
                            title="Kunjungi Halaman Panduan Layanan Publik SUANGGI"
                        >
                            Portal Publik
                        </Link>

                        {user && (
                            <div className="hidden sm:flex items-center gap-2.5 border-l border-[#d8dbd2] pr-3 ml-2">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#173d22] text-xs font-extrabold text-white">
                                    {user.fullName.charAt(0)}
                                </div>
                                <div className="hidden md:flex flex-col min-w-0">
                                    <span className="truncate max-w-[160px] text-xs font-bold leading-tight text-[#1d2b1f]">
                                        {user.fullName}
                                    </span>
                                    <span
                                        className={`mt-0.5 inline-block w-fit border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider leading-tight ${getRoleBadgeColor(
                                            user.role
                                        )}`}
                                    >
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {user && (
                            <button
                                type="button"
                                onClick={logout}
                                className="min-h-11 shrink-0 px-2 text-xs font-semibold text-[#8d2723] underline-offset-4 hover:underline sm:text-sm"
                                title="Keluar dari sesi petugas"
                            >
                                Keluar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
