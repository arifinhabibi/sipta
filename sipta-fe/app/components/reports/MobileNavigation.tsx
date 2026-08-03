import React from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ActiveTab } from '@/src/domain/ReportEntity';

interface MobileNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white pt-20 px-4">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => {
                setActiveTab('students');
                setIsOpen(false);
              }}
              className={`py-3 px-4 text-left font-medium rounded-lg transition-colors ${
                activeTab === 'students'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Laporan Siswa
            </button>
            <button
              onClick={() => {
                setActiveTab('teachers');
                setIsOpen(false);
              }}
              className={`py-3 px-4 text-left font-medium rounded-lg transition-colors ${
                activeTab === 'teachers'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              👨‍🏫 Absensi Guru
            </button>
            <button
              onClick={() => {
                setActiveTab('calendar');
                setIsOpen(false);
              }}
              className={`py-3 px-4 text-left font-medium rounded-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 Kalender
            </button>
          </div>
        </div>
      )}
    </>
  );
};