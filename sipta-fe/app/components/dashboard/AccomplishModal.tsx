"use client";
import React, { useState } from "react";

// Interface untuk data yang disimpan di state
interface AccomplishmentItem {
  id: string;
  name: string;
  displayType: "pemahaman" | "tugas";
  backendType: "knowledge" | "skill";
}

// Interface untuk data yang dikirim ke parent component
export interface BackendAccomplishmentItem {
  id: string;
  name: string;
  type: "knowledge" | "skill";
}

interface AccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accomplishments: BackendAccomplishmentItem[]) => void;
  subjectName?: string;
}

const AccomplishmentModal: React.FC<AccomplishmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subjectName,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState<"pemahaman" | "tugas">("pemahaman");
  const [accomplishments, setAccomplishments] = useState<AccomplishmentItem[]>([]);

  // Mapping antara tampilan UI dan backend type dengan type safety
  const typeMapping: Record<"pemahaman" | "tugas", "knowledge" | "skill"> = {
    pemahaman: "knowledge",
    tugas: "skill",
  };

  const addAccomplishment = () => {
    if (inputValue.trim() === "") return;

    const newAccomplishment: AccomplishmentItem = {
      id: Date.now().toString(),
      name: inputValue.trim(),
      displayType: selectedType,
      backendType: typeMapping[selectedType],
    };

    setAccomplishments((prev) => [...prev, newAccomplishment]);
    setInputValue("");
  };

  const removeAccomplishment = (id: string) => {
    setAccomplishments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addAccomplishment();
    }
  };

  const handleConfirm = () => {
    // Konversi ke format backend
    const backendData: BackendAccomplishmentItem[] = accomplishments.map(({ id, name, backendType }) => ({
      id,
      name,
      type: backendType,
    }));
    
    onConfirm(backendData);
    // Reset form setelah konfirmasi
    setAccomplishments([]);
    setInputValue("");
  };

  const handleClose = () => {
    onClose();
    // Reset form saat tutup
    setAccomplishments([]);
    setInputValue("");
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "pemahaman" || value === "tugas") {
      setSelectedType(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Pencapaian Materi Hari Ini
        </h2>
        <p className="text-gray-500 mb-4">
          {subjectName
            ? `Tambahkan pencapaian siswa pada materi "${subjectName}" hari ini:`
            : "Tambahkan pencapaian siswa:"}
        </p>

        {/* Input Section */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={handleSelectChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pemahaman">Pemahaman</option>
              <option value="tugas">Tugas</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tulis pencapaian siswa..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={addAccomplishment}
            disabled={inputValue.trim() === ""}
            className={`w-full px-4 py-2 rounded-lg font-medium transition ${
              inputValue.trim() === ""
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            tambahkan
          </button>
        </div>

        {/* List of Added Accomplishments */}
        <div className="mb-6 max-h-80 overflow-y-auto pr-1">
          {accomplishments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Belum ada pencapaian yang ditambahkan
            </div>
          ) : (
            <div className="space-y-2">
              {accomplishments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <span className={`font-semibold text-sm ${
                      item.displayType === "pemahaman" ? "text-green-600" : "text-blue-600"
                    }`}>
                      {item.displayType === "pemahaman" ? "📚 Pemahaman" : "📝 Tugas"}:
                    </span>
                    <span className="text-gray-700 ml-1">{item.name}</span>
                  </div>
                  <button
                    onClick={() => removeAccomplishment(item.id)}
                    className="ml-2 text-red-500 hover:text-red-700 p-1"
                    aria-label="Hapus pencapaian"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            disabled={accomplishments.length === 0}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              accomplishments.length > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Lanjut ke Kelas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccomplishmentModal;