import React from 'react'


interface ErrorProps {
  setError: (condition: string | null) => void;
  error: string
}
const ErrorComponent: React.FC<ErrorProps> = ({
  setError,
  error
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal memuat data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
  )
}

export default ErrorComponent