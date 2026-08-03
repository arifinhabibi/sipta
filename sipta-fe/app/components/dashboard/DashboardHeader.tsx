"use client";
import React, { useState, useEffect } from "react";
import { ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "@/src/state/AuthStore";
import toast from "react-hot-toast";

const DashboardHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());
  // const me = useAuthStore((s) => s.me);
  const { me } = useAuthStore();

  const [user, setUser] = useState({
    fullname: "",
    degree: "",
    email: "",
    photo: "",
    role: "",
  });
  const [instance, setInstance] = useState({
    name: "",
    description: "",
    type_institutions: "",
    logo: "",
  });
  const [academicYear, setAcademicYear] = useState({ name: "", periode: "" });

  const teacherName = user.fullname || "Teacher";
  const schoolName = instance.name || "School";

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUser(parsed.state?.user || {});
        setInstance(parsed.state?.instance || {});
        setAcademicYear(parsed.state?.academic_year || {});
      } catch (err) {
        toast.error("Gagal membaca data login.");
      }
    }
  }, []);

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl p-4 text-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{teacherName}</h2>
            <p className="text-blue-100 text-sm">{schoolName}</p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">
                {time.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <ClockIcon className="w-4 h-4" />
              <span className="font-medium">
                {time.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs">WIB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
