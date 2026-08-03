"use client";
import React, { useEffect, useState } from "react";
import { XMarkIcon, AcademicCapIcon, CameraIcon, DocumentIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  teacher?: any;
  canEdit: boolean;
}

export default function TeacherModal({
  isOpen,
  onClose,
  onSave,
  teacher,
  canEdit,
}: TeacherModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    degree: "",
    gender: "male" as "male" | "female",
    birth_date: "",
    phone: "",
    address: "",
    status: "active" as "active" | "inactive",
    photo: null as File | null,
  });

  const [filePreviews, setFilePreviews] = useState({
    photo: "",
  });

  // Get base URL from environment with fallback
  const baseUrl = process.env.NEXT_PUBLIC_ASSET || '';

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
    if (teacher) {
      setFormData({
        full_name: teacher.full_name,
        degree: teacher.degree || "",
        gender: teacher.gender,
        birth_date: teacher.birth_date.split("T")[0],
        phone: teacher.phone || "",
        address: teacher.address || "",
        status: teacher.status,
        photo: null,
      });

      // Set file preview dengan URL yang benar
      const photoUrl = getPhotoUrl(teacher.photo);
      if (photoUrl) setFilePreviews(prev => ({...prev, photo: photoUrl}));
    } else {
      setFormData({
        full_name: "",
        degree: "",
        gender: "male",
        birth_date: "",
        phone: "",
        address: "",
        status: "active",
        photo: null,
      });
      setFilePreviews({
        photo: "",
      });
    }
  }, [teacher]);

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
      if (teacher) {
        const existingFile = getExistingFileUrl(field);
        setFilePreviews(prev => ({ ...prev, [field]: existingFile || '' }));
      } else {
        setFilePreviews(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  // Function untuk mendapatkan URL file existing
  const getExistingFileUrl: any = (field: keyof typeof filePreviews): any => {
    if (!teacher) return '';
    
    switch (field) {
      case 'photo':
        return getPhotoUrl(teacher.photo) || '';
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
            disabled={teacher && !canEdit}
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
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleFileChange(field, null)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={teacher && !canEdit}
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
        {teacher && !formData[field] && previewUrl && (
          <p className="text-xs text-gray-500 mt-1">
            File existing akan tetap digunakan
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && teacher) {
      toast.error("Anda tidak memiliki akses untuk mengedit guru");
      return;
    }

    // Create FormData object for file upload
    const submitData = new FormData();
    
    // Append text fields
    submitData.append('full_name', formData.full_name);
    submitData.append('degree', formData.degree);
    submitData.append('gender', formData.gender);
    submitData.append('birth_date', formData.birth_date);
    submitData.append('phone', formData.phone);
    submitData.append('address', formData.address);
    submitData.append('status', formData.status);
    
    // Append photo file if exists
    if (formData.photo) {
      submitData.append('photo', formData.photo);
    }

    // Debug: log FormData contents
    // console.log('FormData contents:');
    // for (let [key, value] of submitData.entries()) {
    //   console.log(key, value);
    // }

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {teacher ? "Edit Guru" : "Tambah Guru"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {!canEdit && teacher && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Anda tidak memiliki akses untuk mengedit data guru
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
                  disabled={teacher && !canEdit}
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors duration-200"
                >
                  <CameraIcon className="w-4 h-4" />
                </label>
              </div>
              
              <p className="text-sm text-gray-500 mt-3 text-center">
                {formData.photo ? 'File baru dipilih' : teacher?.photo ? 'Foto existing akan digunakan' : 'Klik ikon kamera untuk upload foto (JPG, JPEG, PNG)'}
              </p>
            </div>

            {/* Informasi Pribadi */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={teacher && !canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gelar
                </label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({ ...formData, degree: e.target.value })
                  }
                  placeholder="Contoh: S.Pd, M.Pd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={teacher && !canEdit}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as "male" | "female",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={teacher && !canEdit}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={teacher && !canEdit}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={teacher && !canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={teacher && !canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={teacher && !canEdit}
                />
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
              {(canEdit || !teacher) && (
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  {teacher ? "Update" : "Simpan"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}