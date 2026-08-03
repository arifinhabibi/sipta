"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, UsersIcon, PhotoIcon, DocumentIcon, CameraIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { Student } from '@/src/domain/StudentEntity';
import toast from 'react-hot-toast';
import { useClassroomStore } from '@/src/state/ClassroomStore';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  student?: Student;
  classroomId?: string;
  canEdit: boolean;
}

const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  student,
  classroomId,
  canEdit
}) => {
  // Ambil classrooms dari store
  const { classrooms } = useClassroomStore();
  
  const [formData, setFormData] = useState({
    fullname: '',
    birth_place: '',
    birth_date: '',
    gender: 'male' as 'male' | 'female',
    father_name: '',
    mother_name: '',
    address: '',
    phone: '',
    adverb: '' as '' | 'dhuafa' | 'yatim' | 'piatu' | 'yatim_piatu',
    status: 'active' as 'active' | 'inactive',
    classroom_id: '', // Tambahkan classroom_id di formData
    photo: null as File | null,
    birth_certificate: null as File | null,
    family_card: null as File | null,
    id_card_father: null as File | null,
    id_card_mother: null as File | null
  });

  const [filePreviews, setFilePreviews] = useState({
    photo: '',
    birth_certificate: '',
    family_card: '',
    id_card_father: '',
    id_card_mother: ''
  });

  // Get base URL from environment with fallback
  const baseUrl = process.env.NEXT_PUBLIC_ASSET || '';

  // Function untuk format label kelas
  const getClassroomOptions = () => {
    if (!classrooms || classrooms.length === 0) return [];
    
    return classrooms.map(classroom => {
      // Format label berdasarkan struktur data classroom
      const classroomName = classroom.name || 'Kelas';
      
      return {
        value: classroom.id,
        label: `${classroomName}`
      };
    });
  };

  // Build photo URL safely
  const getPhotoUrl = (photoPath: string | undefined | null): string | null => {
    if (!photoPath || photoPath.trim() === '' || photoPath === 'null') {
      return null;
    }
    
    if (photoPath.startsWith('http')) {
      try {
        new URL(photoPath);
        return photoPath;
      } catch {
        return null;
      }
    }
    
    if (baseUrl) {
      try {
        const normalizedPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        const fullUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${normalizedPath}`;
        new URL(fullUrl);
        return fullUrl;
      } catch {
        return null;
      }
    }
    
    return null;
  };

  useEffect(() => {
    if (student) {
      setFormData({
        fullname: student.fullname,
        birth_place: student.birth_place,
        birth_date: student.birth_date.split('T')[0],
        gender: student.gender,
        father_name: student.father_name,
        mother_name: student.mother_name,
        address: student.address,
        phone: student.phone,
        adverb: student.adverb as '' | 'dhuafa' | 'yatim' | 'piatu' | 'yatim_piatu',
        status: student.status,
        classroom_id: student.classroom_id || '',
        photo: null,
        birth_certificate: null,
        family_card: null,
        id_card_father: null,
        id_card_mother: null
      });

      // Set file previews
      const photoUrl = getPhotoUrl(student.photo);
      if (photoUrl) setFilePreviews(prev => ({...prev, photo: photoUrl}));
      
      if (student.birth_certificate) {
        const birthCertUrl = getPhotoUrl(student.birth_certificate);
        if (birthCertUrl) setFilePreviews(prev => ({...prev, birth_certificate: birthCertUrl}));
      }
      if (student.family_card) {
        const familyCardUrl = getPhotoUrl(student.family_card);
        if (familyCardUrl) setFilePreviews(prev => ({...prev, family_card: familyCardUrl}));
      }
      if (student.id_card_father) {
        const idCardFatherUrl = getPhotoUrl(student.id_card_father);
        if (idCardFatherUrl) setFilePreviews(prev => ({...prev, id_card_father: idCardFatherUrl}));
      }
      if (student.id_card_mother) {
        const idCardMotherUrl = getPhotoUrl(student.id_card_mother);
        if (idCardMotherUrl) setFilePreviews(prev => ({...prev, id_card_mother: idCardMotherUrl}));
      }
    } else {
      setFormData({
        fullname: '',
        birth_place: '',
        birth_date: '',
        gender: 'male',
        father_name: '',
        mother_name: '',
        address: '',
        phone: '',
        adverb: '',
        status: 'active',
        classroom_id: classroomId || '', // Gunakan classroomId untuk student baru
        photo: null,
        birth_certificate: null,
        family_card: null,
        id_card_father: null,
        id_card_mother: null
      });
      setFilePreviews({
        photo: '',
        birth_certificate: '',
        family_card: '',
        id_card_father: '',
        id_card_mother: ''
      });
    }
  }, [student, classroomId]);

  const handleFileChange = (field: keyof typeof formData, file: File | null) => {
    // console.log('File selected:', field, file);
    
    if (file) {
      // console.log('File details:', file.name, file.type, file.size);
      
      // Validasi file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Format file harus JPG, JPEG, atau PNG');
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: file }));
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({ ...prev, [field]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      // Jika file dihapus, kembalikan ke preview existing (jika ada) atau kosong
      if (student) {
        // Untuk edit mode, jika file dihapus, kita tetap pertahankan preview existing
        const existingFile = getExistingFileUrl(field);
        setFilePreviews(prev => ({ ...prev, [field]: existingFile || '' }));
      } else {
        setFilePreviews(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  // Function untuk mendapatkan URL file existing berdasarkan field
  const getExistingFileUrl: any = (field: keyof typeof filePreviews): any => {
    if (!student) return '';
    
    switch (field) {
      case 'photo':
        return getPhotoUrl(student.photo) || '';
      case 'birth_certificate':
        return getPhotoUrl(student.birth_certificate) || '';
      case 'family_card':
        return getPhotoUrl(student.family_card) || '';
      case 'id_card_father':
        return getPhotoUrl(student.id_card_father) || '';
      case 'id_card_mother':
        return getPhotoUrl(student.id_card_mother) || '';
      default:
        return '';
    }
  };

  // Function untuk menampilkan preview file
  const renderFilePreview = (field: keyof typeof filePreviews, label: string) => {
    const previewUrl = filePreviews[field];
    
    return (
      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
            className="hidden"
            id={`${field}-upload`}
            disabled={student && !canEdit}
          />
          <label
            htmlFor={`${field}-upload`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
          >
            <DocumentIcon className="w-4 h-4" />
            <span>Pilih File</span>
          </label>
          
          {/* Preview Section */}
          {previewUrl && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border border-gray-300 rounded overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt={`Preview ${label}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Jika preview error, sembunyikan preview
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleFileChange(field, null)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={student && !canEdit}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Info file yang dipilih */}
        {formData[field] && (
          <p className="text-xs text-green-600 mt-1">
            File baru dipilih: {(formData[field] as File).name}
          </p>
        )}
        
        {/* Info file existing */}
        {student && !formData[field] && previewUrl && (
          <p className="text-xs text-gray-500 mt-1">
            File existing akan tetap digunakan
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && student) {
      toast.error("Anda tidak memiliki akses untuk mengedit siswa");
      return;
    }

    // Create FormData object for file upload
    const submitData = new FormData();
    
    // Append text fields
    submitData.append('fullname', formData.fullname);
    submitData.append('birth_place', formData.birth_place);
    submitData.append('birth_date', formData.birth_date);
    submitData.append('gender', formData.gender);
    submitData.append('father_name', formData.father_name);
    submitData.append('mother_name', formData.mother_name);
    submitData.append('address', formData.address);
    submitData.append('phone', formData.phone);
    submitData.append('status', formData.status);
    
    // Append classroom_id (untuk edit mode)
    if (formData.classroom_id) {
      submitData.append('classroom_id', formData.classroom_id);
    }
    
    if (formData.adverb) {
      submitData.append('adverb', formData.adverb);
    }

    // Append files only if they exist
    if (formData.photo) {
      submitData.append('photo', formData.photo);
    }
    if (formData.birth_certificate) {
      submitData.append('birth_certificate', formData.birth_certificate);
    }
    if (formData.family_card) {
      submitData.append('family_card', formData.family_card);
    }
    if (formData.id_card_father) {
      submitData.append('id_card_father', formData.id_card_father);
    }
    if (formData.id_card_mother) {
      submitData.append('id_card_mother', formData.id_card_mother);
    }

    // Debug: log FormData contents
    // console.log('FormData contents:');
    for (let [key, value] of submitData.entries()) {
      // console.log(key, value);
    }

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {student ? 'Edit Siswa' : 'Tambah Siswa'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {!canEdit && student && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Anda tidak memiliki akses untuk mengedit data siswa
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Profile Section */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
                  {filePreviews.photo ? (
                    <img 
                      src={filePreviews.photo} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <CameraIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo-upload"
                  disabled={student && !canEdit}
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors duration-200"
                >
                  <CameraIcon className="w-4 h-4" />
                </label>
              </div>
              
              <p className="text-sm text-gray-500 mt-3">
                {formData.photo ? 'File baru dipilih' : student?.photo ? 'Foto existing akan digunakan' : 'Klik ikon kamera untuk upload foto (JPG, JPEG, PNG)'}
              </p>
            </div>

            {/* Informasi Pribadi */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pribadi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.birth_place}
                    onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan Khusus
                  </label>
                  <select
                    value={formData.adverb || ""}
                    onChange={(e) =>
                        setFormData({
                        ...formData,
                        adverb: e.target.value as '' | 'dhuafa' | 'yatim' | 'piatu' | 'yatim_piatu',
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                    >
                        <option value="">- Pilih Keterangan -</option>
                        <option value="dhuafa">Dhuafa</option>
                        <option value="yatim">Yatim</option>
                        <option value="piatu">Piatu</option>
                        <option value="yatim_piatu">Yatim Piatu</option>
                    </select>
                </div>

                {/* TAMBAHKAN FIELD CLASSROOM UNTUK EDIT MODE */}
                {student && canEdit && (
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas *
                    </label>
                    <select
                      value={formData.classroom_id}
                      onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={!canEdit}
                    >
                      <option value="">Pilih Kelas</option>
                      {getClassroomOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Mengubah kelas siswa akan memperbarui penempatan di tahun akademik aktif
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat *
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={student && !canEdit}
                />
              </div>
            </div>

            {/* Informasi Orang Tua */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Orang Tua</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Ayah *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Ibu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={student && !canEdit}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={student && !canEdit}
                />
              </div>
            </div>

            {/* Upload Dokumen Lainnya */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dokumen Lainnya</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Akta Kelahiran */}
                {renderFilePreview('birth_certificate', 'Akta Kelahiran')}

                {/* Kartu Keluarga */}
                {renderFilePreview('family_card', 'Kartu Keluarga')}

                {/* KTP Ayah */}
                {renderFilePreview('id_card_father', 'KTP Ayah')}

                {/* KTP Ibu */}
                {renderFilePreview('id_card_mother', 'KTP Ibu')}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Batal
              </button>
              {(canEdit || !student) && (
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <UsersIcon className="w-4 h-4" />
                  {student ? 'Update' : 'Simpan'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;