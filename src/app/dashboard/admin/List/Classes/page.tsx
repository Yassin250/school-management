"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/component/tables/DataTables";
import { School, Users, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

type ClassItem = {
  id: string;
  name: string;
  section: string;
  classTeacher: string;
  totalStudents: number;
  subjects: string[];
};

const classesData: ClassItem[] = [
  { id: "1", name: "Grade 1", section: "A", classTeacher: "Ms. Rachel Clark", totalStudents: 28, subjects: ["English", "Math", "Science", "Art", "Music"] },
  { id: "2", name: "Grade 1", section: "B", classTeacher: "Mrs. Anna Martinez", totalStudents: 26, subjects: ["English", "Math", "Science", "Art", "Music"] },
  { id: "3", name: "Grade 2", section: "A", classTeacher: "Mrs. Anna Martinez", totalStudents: 30, subjects: ["English", "Math", "Science", "History", "Geography"] },
  { id: "4", name: "Grade 2", section: "B", classTeacher: "Ms. Lisa Anderson", totalStudents: 27, subjects: ["English", "Math", "Science", "History", "Geography"] },
  { id: "5", name: "Grade 3", section: "A", classTeacher: "Prof. James Brown", totalStudents: 32, subjects: ["English", "Math", "Science", "History", "French"] },
  { id: "6", name: "Grade 3", section: "B", classTeacher: "Ms. Emily Davis", totalStudents: 29, subjects: ["English", "Math", "Science", "History", "French"] },
  { id: "7", name: "Grade 4", section: "A", classTeacher: "Dr. Sarah Wilson", totalStudents: 31, subjects: ["Math", "Physics", "Chemistry", "English", "Computer Science"] },
  { id: "8", name: "Grade 4", section: "B", classTeacher: "Prof. Kevin Harris", totalStudents: 28, subjects: ["Math", "Physics", "Chemistry", "English", "Computer Science"] },
  { id: "9", name: "Grade 5", section: "A", classTeacher: "Mr. Michael Lee", totalStudents: 30, subjects: ["Math", "Physics", "Biology", "Economics", "English"] },
  { id: "10", name: "Grade 5", section: "B", classTeacher: "Dr. Sarah Wilson", totalStudents: 27, subjects: ["Math", "Physics", "Biology", "Economics", "English"] },
];

const columns = [
  {
    header: "Class",
    accessor: (row: ClassItem) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
          {row.name.split(" ")[1]}{row.section}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name} - {row.section}</p>
          <p className="text-xs text-gray-400">{row.classTeacher}</p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Class Teacher",
    accessor: "classTeacher" as const,
    sortable: true,
    className: "text-sm text-gray-600",
  },
  {
    header: "Students",
    accessor: (row: ClassItem) => (
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{row.totalStudents}</span>
      </div>
    ),
    sortable: true,
  },
  {
    header: "Subjects",
    accessor: (row: ClassItem) => (
      <div className="flex flex-wrap gap-1">
        {row.subjects.map((subject) => (
          <span
            key={subject}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
          >
            {subject}
          </span>
        ))}
      </div>
    ),
  },
];

export default function ClassesListPage() {
  const router = useRouter();
  const [classes] = useState<ClassItem[]>(classesData);

  const handleEdit = (classItem: ClassItem) => {
    router.push(`/dashboard/admin/list/classes/${classItem.id}/edit`);
  };

  const handleDelete = async (classItem: ClassItem) => {
    console.log("Deleting class:", classItem.id, classItem.name);
  };

  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);
  const uniqueTeachers = new Set(classes.map((c) => c.classTeacher)).size;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ========== PAGE HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage classes, sections, teachers, and subject assignments.
          </p>
        </div>
        <Link
          href="/dashboard/admin/list/classes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm 
                     font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <School className="w-4 h-4" />
          Add Class
        </Link>
      </div>

      {/* ========== STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <School className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
              <p className="text-xs text-gray-500">Total Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueTeachers}</p>
              <p className="text-xs text-gray-500">Class Teachers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DATA TABLE ========== */}
      <DataTable
        columns={columns}
        data={classes}
        searchPlaceholder="Search by class name or teacher..."
        searchFields={["name", "classTeacher"]}
        pageSize={8}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getItemName={(classItem) => `${classItem.name} - ${classItem.section}`}
        emptyState={{
          title: "No classes found",
          description: "Get started by creating the first class for your school.",
          actionLabel: "Add Class",
          actionHref: "/dashboard/admin/list/classes/new",
        }}
      />
    </div>
  );
}