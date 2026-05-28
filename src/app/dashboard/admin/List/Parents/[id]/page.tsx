"use client";

import { useParams, useRouter } from "next/navigation";
import { parentsData, studentsData } from "@/lib/mockData";
import { ArrowLeft, Mail, Phone, MapPin, Users, GraduationCap, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ParentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const parent = parentsData.find((p) => p.id === id);

  if (!parent) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Parent not found</h1>
        <p className="text-sm text-gray-500 mt-1">No parent found with ID: {id}</p>
        <Link href="/dashboard/admin/list/parents" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Parents
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link
        href="/dashboard/admin/list/parents"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parents
      </Link>

      {/* ========== PROFILE HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold flex-shrink-0">
            {parent.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{parent.name}</h1>
            <p className="text-gray-500 mt-1">{parent.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {parent.children.length} {parent.children.length === 1 ? "child" : "children"} linked
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/parents/${parent.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this parent?")) {
                  router.push("/dashboard/admin/list/parents");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ========== INFO CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{parent.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{parent.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{parent.address}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Total Children</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{parent.children.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== CHILDREN LIST ========== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Linked Children
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {parent.children.map((childName) => {
            const child = studentsData.find((s) => s.name === childName);
            return (
              <div key={childName} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    child?.sex === "MALE" ? "bg-blue-500" : child ? "bg-pink-500" : "bg-gray-400"
                  }`}>
                    {childName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{childName}</p>
                    {child && (
                      <p className="text-xs text-gray-400">Class {child.class} • Grade {child.grade}</p>
                    )}
                  </div>
                </div>
                {child && (
                  <Link
                    href={`/dashboard/admin/list/students/${child.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Student →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== QUICK STATS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{parent.children.length}</p>
          <p className="text-xs text-gray-500">Children</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Mail className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{parent.email ? "✓" : "—"}</p>
          <p className="text-xs text-gray-500">Email Verified</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Phone className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{parent.phone ? "✓" : "—"}</p>
          <p className="text-xs text-gray-500">Phone Added</p>
        </div>
      </div>
    </div>
  );
}