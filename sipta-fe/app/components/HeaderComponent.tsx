import { useAuthStore } from '@/src/state/AuthStore'
import {
  AcademicCapIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function HeaderComponent() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [user, setUser] = useState({ fullname: '', degree: '', email: '', photo: '', role: '' })
  const [instance, setInstance] = useState({
    name: '',
    description: '',
    type_institutions: '',
    logo: ''
  })
  const [academicYear, setAcademicYear] = useState({ name: '', periode: '' })
  const { logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        setUser(parsed.state?.user || {})
        setInstance(parsed.state?.instance || {})
        setAcademicYear(parsed.state?.academic_year || {})
      } catch (err) {
        toast.error('Gagal membaca data login.')
      }
    }
  }, [])

  const handleLogoutClick = () => {
    setIsProfileOpen(false)
    setShowLogoutConfirm(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    
    try {
      const resp: any = logout()
      if (resp?.success !== false) {
        toast.success(resp?.message || 'Berhasil keluar dari akun.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 1200)
      } else {
        toast.error('Logout gagal. Coba lagi.')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat logout.')
    }
  }

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const isActiveRoute = (route: string) => {
    return pathname === route
  }

  const getRoleText = (role: string) => {
    const roles = {
      'admin': 'Administrator',
      'teacher': 'Guru',
      'superadmin': 'Super Admin'
    }
    return roles[role as keyof typeof roles] || 'Pengguna'
  }

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Institution Info */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">
                    {instance.type_institutions?.toUpperCase()} {instance.name?.charAt(0).toUpperCase() + instance.name?.slice(1)}
                  </h1>
                  <p className="text-blue-100 text-xs hidden sm:block">
                    {instance.description || 'Sistem Manajemen Pendidikan'}
                  </p>
                  {/* Tahun Ajaran */}
                  {academicYear.name && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-blue-100 text-xs bg-white/20 px-2 py-1 rounded-md">
                        {academicYear.name} - {academicYear.periode}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Navigation Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-1">

              <Link
                href="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  isActiveRoute('/') 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'admin' && (
                <Link
                  href="/teachers"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    isActiveRoute('/teachers') 
                      ? 'bg-white/20 text-white' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Data Guru</span>
                </Link>
              )}

              <Link
                href="/classroom"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  isActiveRoute('/classroom') 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5" />
                <span>Kelas</span>
              </Link>

              <Link
                href="/schedules"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  isActiveRoute('/schedules') 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
                <span>Jadwal</span>
              </Link>

              <Link
                href="/reports"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  isActiveRoute('/reports') 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span>Laporan</span>
              </Link>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <UserCircleIcon className="h-6 w-6 text-white" />
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-sm max-w-32 truncate">
                    {user.fullname} {user.degree}
                  </div>
                  <div className="text-blue-100 text-xs">
                    {getRoleText(user.role)}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-white transition-transform ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-900 truncate">
                      {user.fullname} {user.degree}
                    </div>
                    <div className="text-gray-500 text-sm truncate">{user.email}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      {getRoleText(user.role)}
                    </div>
                    {/* Tahun Ajaran di Dropdown */}
                    {academicYear.name && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500">Tahun Ajaran:</div>
                        <div className="text-sm font-medium text-gray-700">
                          {academicYear.name} - {academicYear.periode}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simple Menu - Only Profile and Logout */}
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Profil Saya</span>
                    </Link>

                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-between mt-4 pt-4 border-t border-white/20">
            

            <Link
              href="/"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActiveRoute('/') 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/teachers"
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActiveRoute('/teachers') 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <UserGroupIcon className="h-5 w-5" />
                <span className="text-xs">Guru</span>
              </Link>
            )}

            <Link
              href="/classroom"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActiveRoute('/classroom') 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <AcademicCapIcon className="h-5 w-5" />
              <span className="text-xs">Kelas</span>
            </Link>

            <Link
              href="/schedules"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActiveRoute('/schedules') 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="text-xs">Jadwal</span>
            </Link>

            <Link
              href="/reports"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActiveRoute('/reports') 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span className="text-xs">Laporan</span>
            </Link>
          </div>
        </div>

        {/* Overlay */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Konfirmasi Keluar
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin keluar dari akun? Anda perlu login kembali untuk mengakses sistem.
              </p>
              
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 justify-end">
                <button
                  onClick={handleCancelLogout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HeaderComponent  