// src/app/dashboard/admin/List/Subjects/[id]/SubjectDetailView.tsx
"use client";

import { deleteSubject } from "@/lib/actions/subject";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type SubjectDetail = {
  id: number;
  name: string;
  teachers: {
    id: string;
    name: string;
  }[];
  teacherCount: number;
  lessonCount: number;
};

export default function SubjectDetailView({
  subject,
}: {
  subject: SubjectDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${subject.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSubject(subject.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Subject deleted successfully");
      router.push("/dashboard/admin/list/subjects");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete subject");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/list/subjects"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Subjects
      </Link>

      {/* Subject Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-2xl font-bold flex-shrink-0">
            {subject.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {subject.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {subject.teacherCount} {subject.teacherCount === 1 ? "teacher" : "teachers"} assigned
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {subject.lessonCount} {subject.lessonCount === 1 ? "lesson" : "lessons"} per week
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/subjects/${subject.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors"
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

      {/* Teachers List */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Assigned Teachers ({subject.teachers.length})
        </h3>
        {subject.teachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subject.teachers.map((teacher) => (
              <Link
                key={teacher.id}
                href={`/dashboard/admin/list/teachers/${teacher.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-amber-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-amber-700">
                    {teacher.name}
                  </p>
                  <p className="text-xs text-gray-400">Teacher</p>
                </div>
                <Users className="w-4 h-4 text-gray-300 group-hover:text-amber-400 ml-auto" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No teachers assigned yet.</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {subject.teacherCount}
          </p>
          <p className="text-xs text-gray-500">Teachers</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {subject.lessonCount}
          </p>
          <p className="text-xs text-gray-500">Lessons / Week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {subject.teachers.length}
          </p>
          <p className="text-xs text-gray-500">Active Teachers</p>
        </div>
      </div>
    </div>
  );
}