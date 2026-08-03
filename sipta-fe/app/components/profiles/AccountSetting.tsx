// components/profiles/AccountSetting.tsx
import React from "react";

interface AccountSettingProps {
  profileData: any;
  isChangingPassword: boolean;
  passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  };
  isSubmitting: boolean;
  onEditToggle: (section: "password") => void;
  onPasswordChange: (field: any, value: any) => void;
  onPasswordSubmit: (e: React.FormEvent) => void;
  onCancel: (section: "password") => void;
}

const AccountSetting: React.FC<AccountSettingProps> = ({
  profileData,
  isChangingPassword,
  passwordData,
  isSubmitting,
  onEditToggle,
  onPasswordChange,
  onPasswordSubmit,
  onCancel,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Informasi Akun</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Username
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
            {profileData.username}
          </p>
        </div>

        {/* Change Password Section */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-500">
              Password
            </label>
            <button
              onClick={() => onEditToggle("password")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              {isChangingPassword ? "Batal" : "Ubah Password"}
            </button>
          </div>

          {isChangingPassword ? (
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    onPasswordChange("current_password", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 w-full"
                  placeholder="Masukkan password saat ini"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    onPasswordChange("new_password", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 w-full"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    onPasswordChange("confirm_password", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 w-full"
                  placeholder="Ulangi password baru"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onPasswordSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSubmitting ? "Mengubah..." : "Ubah Password"}
                </button>
                <button
                  onClick={() => onCancel("password")}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
              ••••••••
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSetting;
