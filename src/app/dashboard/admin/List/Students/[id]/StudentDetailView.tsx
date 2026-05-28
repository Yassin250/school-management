// src/app/dashboard/admin/List/Students/[id]/StudentDetailView.tsx
"use client";

import { deleteStudent } from "@/lib/actions/student";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  School,
  Trash2,
  User,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type StudentDetail = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  sex: string;
  birthday: string;
  img: string | null;
  class: string;
  gradeLevel: number;
  parent: string;
  parentName: string;
  attendance: number;
  recentResults: {
    id: string;
    score: number;
    examTitle?: string;
    assignmentTitle?: string;
  }[];
  createdAt: string;
};

export default function StudentDetailView({
  student,
}: {
  student: StudentDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${student.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteStudent(student.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Student deleted successfully");
      router.push("/dashboard/admin/list/students");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete student");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/list/students"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
            {student.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.img}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              student.name.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.name}
            </h1>
            <p className="text-gray-500 mt-1">{student.email || "No email"}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-400">
                Username: {student.username}
              </p>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                {student.class}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/students/${student.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{student.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{student.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{student.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 capitalize">
                {student.sex.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">
                {formatDate(student.birthday)}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Academic Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Class & Grade
                </span>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                  {student.class}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  Grade {student.gradeLevel}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Parent / Guardian
                </span>
              </div>
              <p className="text-sm text-gray-700">{student.parentName}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  Attendance Rate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      student.attendance >= 90
                        ? "bg-green-500"
                        : student.attendance >= 80
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${student.attendance}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${getAttendanceColor(
                    student.attendance
                  )}`}
                >
                  {student.attendance}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{student.class}</p>
          <p className="text-xs text-gray-500">Class</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {student.gradeLevel}
          </p>
          <p className="text-xs text-gray-500">Grade Level</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p
            className={`text-2xl font-bold ${getAttendanceColor(
              student.attendance
            )}`}
          >
            {student.attendance}%
          </p>
          <p className="text-xs text-gray-500">Attendance</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {student.recentResults.length}
          </p>
          <p className="text-xs text-gray-500">Recent Results</p>
        </div>
      </div>

      {/* Recent Results */}
      {student.recentResults.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Recent Academic Results
          </h3>
          <div className="space-y-2">
            {student.recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {result.examTitle || result.assignmentTitle || "Assessment"}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    result.score >= 70
                      ? "text-green-600"
                      : result.score >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {result.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}