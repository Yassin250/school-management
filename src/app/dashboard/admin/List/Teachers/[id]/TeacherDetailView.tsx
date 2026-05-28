"use client";

import { deleteTeacher } from "@/lib/actions/teacher";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  MapPin,
  Pencil,
  Phone,
  School,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type TeacherDetail = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  sex: string;
  birthday: string;
  img: string | null;
  subjects: string[];
  classes: string[];
  studentCount: number;
  createdAt: string;
};

export default function TeacherDetailView({ teacher }: { teacher: TeacherDetail }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${teacher.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteTeacher(teacher.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Teacher deleted successfully");
      router.push("/dashboard/admin/list/teachers");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete teacher");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/admin/list/teachers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teachers
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold flex-shrink-0 overflow-hidden">
            {teacher.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teacher.img} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              teacher.name.charAt(0)
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
            <p className="text-gray-500 mt-1">{teacher.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">Username: {teacher.username}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/teachers/${teacher.id}/edit`}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{teacher.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{teacher.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{teacher.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 capitalize">{teacher.sex.toLowerCase()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Professional Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Subjects</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.length > 0 ? (
                  teacher.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No subjects assigned</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <School className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Classes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher.classes.length > 0 ? (
                  teacher.classes.map((cls) => (
                    <span
                      key={cls}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                    >
                      {cls}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No supervised classes</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.subjects.length}</p>
          <p className="text-xs text-gray-500">Subjects Taught</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.classes.length}</p>
          <p className="text-xs text-gray-500">Classes Assigned</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.studentCount}</p>
          <p className="text-xs text-gray-500">Students (supervised classes)</p>
        </div>
      </div>
    </div>
  );
}
