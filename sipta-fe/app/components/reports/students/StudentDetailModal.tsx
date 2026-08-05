import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Accomplishment, AccomplishmentType, AttendanceStatus, Student, StudentTabData } from "./StudentTab";
import { AcademicCapIcon, ArrowPathIcon, CheckCircleIcon, DocumentArrowDownIcon, ExclamationTriangleIcon, InformationCircleIcon, PencilIcon, UserIcon, XCircleIcon, XMarkIcon, FireIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { formatDateDDMMYYYY } from "@/src/utils/date";
import { useConfirmDialog } from "@/app/components/ui";

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  studentData: StudentTabData | null;
  onUpdateScore: (accomplishmentStudentId: string, accomplishmentName: string, newScore: number, attendanceId: string, type: AccomplishmentType, isCapable?: boolean) => Promise<void>;
  onGenerateReport: (studentId: string) => void;
}

interface EditingScoreState {
  accomplishmentId: string;
  accomplishmentName: string;
  attendanceId: string;
  currentScore: number;
  type: AccomplishmentType;
  subject: string;
  date: string;
  isCapable?: boolean;
}

interface AccomplishmentWithMetadata extends Accomplishment {
  date: string;
  subject: string;
  attendanceId: string;
  scheduleId: string;
  canUpdate: boolean;
}

interface UpdateMessage {
  type: 'success' | 'error';
  text: string;
}

interface AttendanceStats {
  totalAttendances: number;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  permissionCount: number;
  presentPercentage: number;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  studentData,
  onUpdateScore,
  onGenerateReport
}) => {
  // State declarations
  const [editingScore, setEditingScore] = useState<EditingScoreState | null>(null);
  const [tempScore, setTempScore] = useState<number>(0);
  const [tempIsCapable, setTempIsCapable] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'knowledge' | 'attendance'>('skills');
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { confirm, confirmationDialog } = useConfirmDialog();
  
  // Ref untuk menyimpan mapping accomplishment id ke data
  const accomplishmentsRef = useRef<Map<string, AccomplishmentWithMetadata>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);
  const editButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());


  // Memoized calculations
  const attendanceStats = useMemo<AttendanceStats>(() => {
    const attendances = student?.attendances || [];
    const totalAttendances = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'present').length;
    const absentCount = attendances.filter(a => a.status === 'absent').length;
    const sickCount = attendances.filter(a => a.status === 'sick').length;
    const permissionCount = attendances.filter(a => a.status === 'permission').length;

    return {
      totalAttendances,
      presentCount,
      absentCount,
      sickCount,
      permissionCount,
      presentPercentage: totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0
    };
  }, [student]);

  const allAccomplishments = useMemo<AccomplishmentWithMetadata[]>(() => {
    if (!student) return [];
    
    const attendances = student.attendances || [];
    // console.log('Processing accomplishments for student:', student.fullname, 'with', attendances.length, 'attendances');
    
    const accomplishments: AccomplishmentWithMetadata[] = [];

    attendances.forEach(attendance => {
      const subjectAccomplishments = attendance.schedule?.subject?.accomplishments || [];
      
      subjectAccomplishments.forEach(accomplishment => {
        // Validasi apakah accomplishment memiliki data yang diperlukan
        if (!accomplishment.id || !attendance.schedule?.id) {
          console.warn('Invalid accomplishment data:', accomplishment);
          return;
        }
        
        // SEMUA SKILL DAN KNOWLEDGE BISA DIUPDATE TANPA BATASAN
        // Tidak ada kondisi apapun, semua bisa diedit
        let canUpdate = true;
        
        accomplishments.push({
          ...accomplishment,
          date: attendance.schedule?.date || '',
          subject: attendance.schedule?.subject?.name || 'Tidak diketahui',
          attendanceId: attendance.schedule?.id || '',
          scheduleId: attendance.schedule?.id || '',
          canUpdate
        });
      });
    });

    // console.log('Total accomplishments found:', accomplishments.length);
    // console.log('All accomplishments can be updated (no restrictions):', accomplishments.length);
    
    return accomplishments;
  }, [student]);

  const skillAccomplishments = useMemo(() => 
    allAccomplishments.filter(a => a.type === 'skill'), 
    [allAccomplishments]
  );
  
  const knowledgeAccomplishments = useMemo(() => 
    allAccomplishments.filter(a => a.type === 'knowledge'), 
    [allAccomplishments]
  );

  // Update ref saat accomplishments berubah
  useEffect(() => {
    accomplishmentsRef.current.clear();
    allAccomplishments.forEach(accomplishment => {
      accomplishmentsRef.current.set(accomplishment.id, accomplishment);
    });
  }, [allAccomplishments]);

  // Effects
  useEffect(() => {
    if (!isOpen) {
      setEditingScore(null);
      setUpdateMessage(null);
      setIsUpdating(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset editing state saat student berubah
    if (editingScore && student) {
      setEditingScore(null);
    }
  }, [student]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUpdating) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isUpdating]);

  // Callbacks
  const handleClose = useCallback(async () => {
    if (editingScore && !isUpdating) {
      const confirmClose = await confirm({
        title: 'Tutup detail siswa?',
        description: 'Perubahan penilaian yang belum disimpan akan dibatalkan.',
        confirmLabel: 'Ya, tutup',
        tone: 'warning',
        testId: 'student-detail-close-confirm',
      });
      if (!confirmClose) return;
    }
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [editingScore, isUpdating, onClose, confirm]);

  const handleScoreUpdate = useCallback(async () => {
    if (!editingScore || isUpdating) return;

    setUpdateMessage(null);

    // Validasi untuk skill
    if (editingScore.type === 'skill') {
      if (!Number.isFinite(tempScore)) {
        setUpdateMessage({ type: 'error', text: 'Nilai tugas tidak valid' });
        return;
      }

      if (tempScore < 0 || tempScore > 100) {
        setUpdateMessage({ type: 'error', text: 'Nilai tugas harus antara 0–100' });
        return;
      }

      if (tempScore === editingScore.currentScore) {
        setUpdateMessage({ type: 'error', text: 'Tidak ada perubahan nilai' });
        return;
      }

      const confirmed = await confirm({
        title: 'Konfirmasi nilai tugas',
        description: `Nilai tugas akan diubah dari ${editingScore.currentScore} menjadi ${tempScore}.`,
        confirmLabel: 'Simpan perubahan',
        tone: 'primary',
        testId: 'student-modal-skill-score-confirm',
      });
      if (!confirmed) return;
    }

    // Validasi untuk knowledge
    if (editingScore.type === 'knowledge') {
      if (tempIsCapable === editingScore.isCapable) {
        setUpdateMessage({ type: 'error', text: 'Tidak ada perubahan status' });
        return;
      }

      const confirmed = await confirm({
        title: 'Konfirmasi pemahaman',
        description: `Status pemahaman akan diubah dari ${editingScore.isCapable ? 'Mampu' : 'Tidak Mampu'} menjadi ${tempIsCapable ? 'Mampu' : 'Tidak Mampu'}.`,
        confirmLabel: 'Simpan perubahan',
        tone: 'primary',
        testId: 'student-modal-knowledge-score-confirm',
      });
      if (!confirmed) return;
    }

    setIsUpdating(true);

    try {
      await onUpdateScore(
        editingScore.accomplishmentId,
        editingScore.accomplishmentName,
        editingScore.type === 'skill' ? tempScore : editingScore.currentScore,
        editingScore.attendanceId,
        editingScore.type,
        editingScore.type === 'knowledge' ? tempIsCapable : undefined
      );

      // Success message
      setUpdateMessage({
        type: 'success',
        text:
          editingScore.type === 'skill'
            ? `Nilai tugas berhasil diubah dari ${editingScore.currentScore} ke ${tempScore}`
            : `Status pemahaman berhasil diubah menjadi ${tempIsCapable ? 'Mampu ✓' : 'Tidak Mampu ✗'}`
      });

      // Reset editing state
      setEditingScore(null);
      setTempScore(0);
      setTempIsCapable(false);

      // Auto-hide success message
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);

    } catch (err: any) {
      console.error('handleScoreUpdate error:', err);
      setUpdateMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [editingScore, tempScore, tempIsCapable, onUpdateScore, isUpdating, confirm]);

  // handleEditClick - SEMUA BISA DIEDIT TANPA SYARAT
  const handleEditClick = useCallback(async (accomplishment: AccomplishmentWithMetadata) => {
    // Cegah jika sedang updating
    if (isUpdating) {
      // console.log('Currently updating, ignoring edit click');
      return;
    }

    // console.log('Edit clicked for accomplishment:', {
    //   id: accomplishment.id,
    //   name: accomplishment.name,
    //   type: accomplishment.type,
    //   score: accomplishment.score,
    //   is_capable: accomplishment.is_capable,
    //   canUpdate: accomplishment.canUpdate,
    //   attendanceId: accomplishment.attendanceId
    // });

    // Validasi data accomplishment
    if (!accomplishment.id || !accomplishment.attendanceId) {
      console.error('Invalid accomplishment data:', accomplishment);
      setUpdateMessage({ type: 'error', text: 'Data accomplishment tidak valid.' });
      setTimeout(() => setUpdateMessage(null), 3000);
      return;
    }

    // Jika sedang mengedit accomplishment lain, tanyakan konfirmasi
    if (editingScore) {
      const confirmSwitch = await confirm({
        title: 'Beralih penilaian?',
        description: 'Perubahan yang belum disimpan akan dibatalkan jika Anda beralih ke penilaian lain.',
        confirmLabel: 'Ya, beralih',
        tone: 'warning',
        testId: 'student-modal-score-switch-confirm',
      });
      if (!confirmSwitch) return;
      
      // Reset editing state
      setEditingScore(null);
      setTempScore(0);
      setTempIsCapable(false);
      setUpdateMessage(null);
    }

    // Set editing state
    const editingState: EditingScoreState = {
      accomplishmentId: accomplishment.id,
      accomplishmentName: accomplishment.name,
      attendanceId: accomplishment.attendanceId,
      currentScore: accomplishment.score,
      type: accomplishment.type,
      subject: accomplishment.subject || 'Tidak diketahui',
      date: accomplishment.date || '',
      isCapable: accomplishment.is_capable
    };
    
    // console.log('Setting editing state:', editingState);
    
    // Set nilai awal untuk editing
    setEditingScore(editingState);
    setTempScore(accomplishment.score);
    setTempIsCapable(accomplishment.is_capable || false);
    
    // Reset message
    setUpdateMessage(null);
    
    // Scroll ke element yang sedang diedit
    setTimeout(() => {
      const element = document.querySelector(`[data-accomplishment-id="${accomplishment.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Tambahkan highlight effect
        element.classList.add('ring-2', 'ring-orange-500', 'ring-opacity-50', 'transition-all', 'duration-300');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-orange-500', 'ring-opacity-50');
        }, 1000);
      }
    }, 100);
  }, [editingScore, isUpdating, confirm]);

  // Fungsi untuk menangani cancel editing
  const handleCancelEdit = useCallback(() => {
    if (isUpdating) return;
    
    setEditingScore(null);
    setUpdateMessage(null);
    setTempScore(0);
    setTempIsCapable(false);
  }, [isUpdating]);

  const formatDate = useCallback((dateString: string): string => {
    return formatDateDDMMYYYY(dateString, 'Tanggal tidak valid');
  }, []);

  const formatDateFull = useCallback((dateString: string): string => {
    return formatDateDDMMYYYY(dateString, 'Tanggal tidak valid');
  }, []);

  const renderAttendanceStatus = useCallback((status: AttendanceStatus) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', label: 'Hadir', icon: '✓' },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absen', icon: '✗' },
      sick: { color: 'bg-yellow-100 text-yellow-800', label: 'Sakit', icon: '🏥' },
      permission: { color: 'bg-blue-100 text-blue-800', label: 'Izin', icon: '📝' }
    };

    const config = statusConfig[status] || statusConfig.absent;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  }, []);

  const getScoreColor = useCallback((score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 65) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }, []);

  const getGrade = useCallback((score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D';
    return 'E';
  }, []);

  // Fungsi untuk mengecek apakah accomplishment sedang dalam mode edit
  const isEditing = useCallback((accomplishmentId: string, attendanceId: string) => {
    return editingScore?.accomplishmentId === accomplishmentId && 
           editingScore?.attendanceId === attendanceId;
  }, [editingScore]);
  
  if (!isOpen || !student || !studentData) return null;
  
  // Modal render
  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={handleClose}
      />
      
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className={`relative w-full max-w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-xl shadow-xl transform transition-transform duration-200 ${
          isClosing ? 'translate-y-full sm:translate-y-4 sm:scale-95' : 'translate-y-0'
        } h-[90vh] sm:h-auto flex flex-col max-h-screen`}>
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {student.fullname}
                  </h2>
                  <p className="text-xs text-gray-600 truncate">
                    Rank #{student.summary?.rank || 'N/A'} • Kelas {studentData.classroom?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdating}
                title="Tutup"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Update Message */}
            {updateMessage && (
              <div className={`px-4 pb-2 animate-in slide-in-from-top duration-300 ${updateMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${
                  updateMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {updateMessage.type === 'success' ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  )}
                  {updateMessage.text}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-4 border-t pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(student.summary?.final_score || 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Nilai Akhir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {student.summary?.attendance_percentage || 0}%
                </div>
                <div className="text-xs text-gray-600 mt-1">Hadir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(student.summary?.average_scores?.skill || 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Tugas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  #{student.summary?.rank || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Rank</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-t">
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                disabled={isUpdating}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors disabled:opacity-50 ${
                  activeTab === 'skills'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <FireIcon className="w-4 h-4" />
                  <span>Tugas</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'skills' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {skillAccomplishments.length}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('knowledge')}
                disabled={isUpdating}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors disabled:opacity-50 ${
                  activeTab === 'knowledge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <LightBulbIcon className="w-4 h-4" />
                  <span>Pemahaman</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'knowledge' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {knowledgeAccomplishments.length}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                disabled={isUpdating}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors disabled:opacity-50 ${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  <span>Kehadiran</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'attendance' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {student.attendances?.length || 0}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" ref={contentRef}>
            <div className="p-4 space-y-6">
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FireIcon className="w-5 h-5 text-orange-500" />
                        Penilaian Tugas
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Semua tugas dapat diedit (tanpa batasan nilai)
                      </p>
                    </div>
                  </div>
                  
                  {skillAccomplishments.length > 0 ? (
                    <div className="space-y-3">
                      {skillAccomplishments.map((accomplishment) => {
                        const isCurrentlyEditing = isEditing(accomplishment.id, accomplishment.attendanceId);
                        
                        return (
                          <div
                            data-accomplishment-id={accomplishment.id}
                            key={`skill-${accomplishment.id}-${accomplishment.scheduleId}-${accomplishment.attendanceId}`}
                            className={`p-4 rounded-lg border transition-all border-orange-200 bg-orange-50 hover:bg-orange-100 ${
                              isCurrentlyEditing ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {accomplishment.score < 65 ? (
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  ) : accomplishment.score >= 85 ? (
                                    <FireIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                  )}
                                  <div className="font-medium text-gray-900 truncate">
                                    {accomplishment.name}
                                    {!isCurrentlyEditing && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        Dapat diedit
                                      </span>
                                    )}
                                    {isCurrentlyEditing && (
                                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        Sedang diedit
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 truncate mb-1">
                                  {accomplishment.subject}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(accomplishment.date)}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 ml-2">
                                {isCurrentlyEditing ? (
                                  <div className="flex flex-col gap-2 w-full">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={tempScore}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          if (!isNaN(value)) {
                                            setTempScore(Math.max(0, Math.min(100, value)));
                                          }
                                        }}
                                        className="w-20 px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleScoreUpdate();
                                          }
                                          if (e.key === 'Escape') {
                                            handleCancelEdit();
                                          }
                                        }}
                                        disabled={isUpdating}
                                      />
                                      <span className="text-sm font-medium text-gray-700">/100</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={handleScoreUpdate}
                                        disabled={isUpdating}
                                        className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                      >
                                        {isUpdating ? (
                                          <>
                                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                            Menyimpan...
                                          </>
                                        ) : 'Simpan'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isUpdating}
                                        className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">
                                        {accomplishment.score}
                                      </div>
                                      <div className={`text-xs font-medium px-2 py-1 rounded ${getScoreColor(accomplishment.score)}`}>
                                        {getGrade(accomplishment.score)}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditClick(accomplishment);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors hover:bg-orange-50 rounded-md"
                                      title="Edit nilai"
                                      disabled={isUpdating}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FireIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tidak ada data penilaian tugas</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <LightBulbIcon className="w-5 h-5 text-blue-500" />
                        Penilaian Pemahaman
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Semua pemahaman dapat diedit (tanpa batasan status mampu)
                      </p>
                    </div>
                  </div>
                  
                  {knowledgeAccomplishments.length > 0 ? (
                    <div className="space-y-3">
                      {knowledgeAccomplishments.map((accomplishment) => {
                        const isCurrentlyEditing = isEditing(accomplishment.id, accomplishment.attendanceId);
                        
                        return (
                          <div
                            data-accomplishment-id={accomplishment.id}
                            key={`knowledge-${accomplishment.id}-${accomplishment.scheduleId}-${accomplishment.attendanceId}`}
                            className={`p-4 rounded-lg border transition-all border-blue-200 bg-blue-50 hover:bg-blue-100 ${
                              isCurrentlyEditing ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {accomplishment.is_capable ? (
                                    <LightBulbIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  )}
                                  <div className="font-medium text-gray-900 truncate">
                                    {accomplishment.name}
                                    {!isCurrentlyEditing && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        Dapat diedit
                                      </span>
                                    )}
                                    {isCurrentlyEditing && (
                                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        Sedang diedit
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 truncate mb-1">
                                  {accomplishment.subject}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(accomplishment.date)}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 ml-2">
                                {isCurrentlyEditing ? (
                                  <div className="flex flex-col gap-2 w-full">
                                    <div className="flex flex-col gap-1 mt-2 w-full">
                                      <label className="text-xs font-medium text-gray-700">Status Pemahaman:</label>
                                      <div className="flex gap-4">
                                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`capable-${accomplishment.attendanceId}`}
                                            value="true"
                                            checked={tempIsCapable === true}
                                            onChange={() => setTempIsCapable(true)}
                                            disabled={isUpdating}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                          />
                                          <span className="text-green-700 flex items-center gap-1">
                                            <CheckCircleIcon className="w-3 h-3" />
                                            Mampu
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`capable-${accomplishment.attendanceId}`}
                                            value="false"
                                            checked={tempIsCapable === false}
                                            onChange={() => setTempIsCapable(false)}
                                            disabled={isUpdating}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 cursor-pointer"
                                          />
                                          <span className="text-red-700 flex items-center gap-1">
                                            <XCircleIcon className="w-3 h-3" />
                                            Tidak Mampu
                                          </span>
                                        </label>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={handleScoreUpdate}
                                        disabled={isUpdating}
                                        className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                      >
                                        {isUpdating ? (
                                          <>
                                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                            Menyimpan...
                                          </>
                                        ) : 'Simpan'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isUpdating}
                                        className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-right">
                                      <div className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                                        accomplishment.is_capable 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {accomplishment.is_capable ? (
                                          <>
                                            <CheckCircleIcon className="w-3 h-3" />
                                            Mampu
                                          </>
                                        ) : (
                                          <>
                                            <XCircleIcon className="w-3 h-3" />
                                            Tidak Mampu
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditClick(accomplishment);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-md"
                                      title="Edit status"
                                      disabled={isUpdating}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tidak ada data penilaian pemahaman</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-green-500" />
                      Riwayat Kehadiran
                    </h3>
                    <div className="text-sm text-gray-600">
                      {attendanceStats.presentCount}/{attendanceStats.totalAttendances} sesi
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</div>
                      <div className="text-sm text-green-800 font-medium mt-1">Hadir</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</div>
                      <div className="text-sm text-red-800 font-medium mt-1">Absen</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{attendanceStats.sickCount}</div>
                      <div className="text-sm text-yellow-800 font-medium mt-1">Sakit</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{attendanceStats.permissionCount}</div>
                      <div className="text-sm text-blue-800 font-medium mt-1">Izin</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Persentase Kehadiran</span>
                      <span className="text-sm font-bold text-gray-900">{attendanceStats.presentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(attendanceStats.presentPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {student.attendances?.map((attendance) => (
                      <div
                        key={attendance.schedule?.id || `attendance-${Math.random()}`}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900">
                            {formatDateFull(attendance.schedule?.date || '')}
                          </div>
                          {renderAttendanceStatus(attendance.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {attendance.schedule?.start_time?.slice(0,5) || '--:--'} - {attendance.schedule?.end_time?.slice(0,5) || '--:--'}
                        </div>
                        <div className="text-base font-medium text-gray-700 mb-1">
                          {attendance.schedule?.subject?.name || 'Mata Pelajaran Tidak Diketahui'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attendance.schedule?.subject?.accomplishments?.length || 0} tugas • {attendance.status === 'present' ? 'Hadir' : attendance.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {/* <div className="sticky bottom-0 bg-white border-t">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onGenerateReport(student.id)}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Download Laporan</span>
                </button>
              </div>
            </div>
          </div> */}
        </div>
      </div>
      {confirmationDialog}
    </div>
  );
};
