"use client";
import { 
  AcademicCapIcon,
  UserGroupIcon 
} from "@heroicons/react/24/outline";

interface MasukKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  jadwal: any;
  onMasukKelas: (jadwal: any) => void;
}

const MasukKelasModal: React.FC<MasukKelasModalProps> = ({
  isOpen,
  onClose,
  jadwal,
  onMasukKelas
}) => {
  if (!isOpen || !jadwal) return null;

  const formatTime = (timeString: string) => {
    if (!timeString) return "--:--";
    return timeString.substring(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <AcademicCapIcon className="h-7 w-7 text-white" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Mulai Kelas
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Anda akan memulai kelas untuk:
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <p className="font-bold text-blue-800">{jadwal.subject.name}</p>
            <p className="text-sm text-blue-600 mt-1">
              {jadwal.classroom.name}
            </p>
            <p className="text-xs text-blue-500">
              {formatTime(jadwal.start_time)} - {formatTime(jadwal.end_time)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onMasukKelas(jadwal)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all duration-300"
            >
              <UserGroupIcon className="h-4 w-4" />
              Mulai Kelas
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasukKelasModal;