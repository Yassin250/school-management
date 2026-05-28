// src/app/dashboard/admin/List/Exams/[id]/ExamDetailView.tsx
"use client";

import { deleteExam } from "@/lib/actions/exam";
import {
  ArrowLeft,
  Clock,
  FileText,
  GraduationCap,
  Pencil,
  School,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type ExamDetail = {
  id: number;
  title: string;
  subject: string;
  class: string;
  lesson: string;
  startTime: string;
  endTime: string;
  results: number;
  averageScore: number;
};

export default function ExamDetailView({
  exam,
}: {
  exam: ExamDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${exam.title}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteExam(exam.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Exam deleted successfully");
      router.push("/dashboard/admin/list/exams");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete exam");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const start = formatDateTime(exam.startTime);
  const end = formatDateTime(exam.endTime);

  const duration = Math.round(
    (new Date(exam.endTime).getTime() - new Date(exam.startTime).getTime()) /
      (1000 * 60)
  );

  const isUpcoming = new Date(exam.startTime) > new Date();
  const isPast = new Date(exam.endTime) < new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/list/exams"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exams
      </Link>

      {/* Exam Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar / Status */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
              isPast
                ? "bg-gray-400"
                : isUpcoming
                ? "bg-green-500"
                : "bg-rose-500"
            }`}
          >
            <FileText className="w-8 h-8" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {exam.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isPast
                    ? "bg-gray-100 text-gray-600"
                    : isUpcoming
                    ? "bg-green-100 text-green-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {isPast ? "Completed" : isUpcoming ? "Upcoming" : "In Progress"}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {exam.subject} • {exam.class}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Lesson: {exam.lesson}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/exams/${exam.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors"
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
        {/* Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-500">Start</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">
                {start.date}
              </p>
              <p className="text-sm text-gray-500 ml-6">{start.time}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-gray-500">End</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 ml-6">
                {end.date}
              </p>
              <p className="text-sm text-gray-500 ml-6">{end.time}</p>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-gray-700">
                  Duration: {duration} minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Academic Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <School className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Subject</span>
              </div>
              <span className="ml-6 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {exam.subject}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Class</span>
              </div>
              <span className="ml-6 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                {exam.class}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Results</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                {exam.results} student{exam.results !== 1 ? "s" : ""} graded
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Clock className="w-5 h-5 text-rose-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{duration}m</p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 truncate">
            {exam.subject}
          </p>
          <p className="text-xs text-gray-500">Subject</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{exam.class}</p>
          <p className="text-xs text-gray-500">Class</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <FileText className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {exam.averageScore}%
          </p>
          <p className="text-xs text-gray-500">Avg Score</p>
        </div>
      </div>
    </div>
  );
}