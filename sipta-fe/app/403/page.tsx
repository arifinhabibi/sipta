import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-8">
          Maaf, sumber daya yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow transition-all"
        >
          <HomeIcon className="w-5 h-5" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
