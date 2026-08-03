// components/profiles/SystemsInformation.tsx
import React from "react";

interface SystemsInformationProps {
  profileData: any;
}

const SystemsInformation: React.FC<SystemsInformationProps> = ({
  profileData,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Informasi Sistem
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Dibuat Pada
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
            {new Date(profileData.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Diperbarui Pada
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
            {new Date(profileData.updated_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemsInformation;
