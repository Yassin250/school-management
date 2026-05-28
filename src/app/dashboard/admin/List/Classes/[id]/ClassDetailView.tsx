// src/app/dashboard/admin/List/Classes/[id]/ClassDetailView.tsx
"use client";

import { deleteClass } from "@/lib/actions/class";
import {
  ArrowLeft,
  GraduationCap,
  Pencil,
  School,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type ClassDetail = {
  id: number;
  name: string;
  capacity: number;
  grade: string;
  supervisor: string;
  supervisorId: string | null;
  students: {
    id: string;
    name: string;
  }[];
  lessons: number;
};

export default function ClassDetailView({
  classData,
}: {
  classData: ClassDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${classData.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteClass(classData.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Class deleted successfully");
      router.push("/dashboard/admin/list/classes");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete class");
    }
  };

  const occupancyPercent = Math.round(
    (classData.students.length / classData.capacity) * 100
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/list/classes"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </Link>

      {/* Class Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold flex-shrink-0">
            {classData.name}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Class {classData.name}
            </h1>
            <p className="text-gray-500 mt-1">{classData.grade}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {classData.students.length} / {classData.capacity} students enrolled
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/classes/${classData.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
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
        {/* Class Details */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Class Details
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Grade Level</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{classData.grade}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Supervisor</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                {classData.supervisor || (
                  <span className="text-gray-400">Not assigned</span>
                )}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Occupancy</span>
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        occupancyPercent >= 90
                          ? "bg-red-500"
                          : occupancyPercent >= 70
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {occupancyPercent}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {classData.students.length} of {classData.capacity} seats filled
                  ({classData.capacity - classData.students.length} available)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Students ({classData.students.length})
          </h3>
          {classData.students.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {classData.students.map((student) => (
                <Link
                  key={student.id}
                  href={`/dashboard/admin/list/students/${student.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                    {student.name}
                  </span>
                  <GraduationCap className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 ml-auto" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No students enrolled yet.</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {classData.students.length}
          </p>
          <p className="text-xs text-gray-500">Enrolled Students</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {classData.capacity}
          </p>
          <p className="text-xs text-gray-500">Max Capacity</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {classData.lessons}
          </p>
          <p className="text-xs text-gray-500">Lessons / Week</p>
        </div>
      </div>
    </div>
  );
}