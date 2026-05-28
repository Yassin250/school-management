// src/app/dashboard/admin/List/Parents/[id]/ParentDetailView.tsx
"use client";

import { deleteParent } from "@/lib/actions/parent";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type ParentDetail = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  childrenCount: number;
  children: {
    id: string;
    name: string;
    class: string;
  }[];
  createdAt: string;
};

export default function ParentDetailView({
  parent,
}: {
  parent: ParentDetail;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${parent.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteParent(parent.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Parent deleted successfully");
      router.push("/dashboard/admin/list/parents");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete parent");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/list/parents"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parents
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold flex-shrink-0">
            {parent.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {parent.name}
            </h1>
            <p className="text-gray-500 mt-1">{parent.email || "No email"}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Username: {parent.username}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/list/parents/${parent.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
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
              <span className="text-gray-700">{parent.email || "—"}</span>
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

        {/* Children Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Children
          </h3>
          {parent.children.length > 0 ? (
            <div className="space-y-3">
              {parent.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/dashboard/admin/list/students/${child.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                    {child.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                      {child.name}
                    </p>
                    <p className="text-xs text-gray-400">Class {child.class}</p>
                  </div>
                  <GraduationCap className="w-4 h-4 text-gray-300 group-hover:text-purple-400" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No children enrolled yet.</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {parent.childrenCount}
          </p>
          <p className="text-xs text-gray-500">Children</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Phone className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 truncate px-2">
            {parent.phone}
          </p>
          <p className="text-xs text-gray-500">Phone</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <MapPin className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 truncate px-2">
            {parent.address}
          </p>
          <p className="text-xs text-gray-500">Address</p>
        </div>
      </div>
    </div>
  );
}