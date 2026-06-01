// src/app/dashboard/teacher/my-classes/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, School, Users, GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherMyClassesPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  // Get teacher's supervised classes and the classes they teach in
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      supervisedClasses: {
        include: {
          grade: true,
          students: true,
        },
      },
      lessons: {
        include: {
          class: {
            include: {
              grade: true,
              students: true,
              supervisor: true,
            },
          },
        },
      },
      subjects: true,
    },
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Teacher not found</h1>
        <Link href="/dashboard/teacher" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Collect classes taught + supervised classes
  const classesMap = new Map<number, {
    id: number;
    name: string;
    grade: number;
    supervisor: string;
    capacity: number;
    studentCount: number;
  }>();

  // Add supervised classes
  teacher.supervisedClasses.forEach((cls) => {
    classesMap.set(cls.id, {
      id: cls.id,
      name: cls.name,
      grade: cls.grade.level,
      supervisor: `${teacher.name} ${teacher.surname}`,
      capacity: cls.capacity,
      studentCount: cls.students.length,
    });
  });

  // Add classes taught in lessons
  teacher.lessons.forEach((lesson) => {
    if (lesson.class && !classesMap.has(lesson.class.id)) {
      classesMap.set(lesson.class.id, {
        id: lesson.class.id,
        name: lesson.class.name,
        grade: lesson.class.grade.level,
        supervisor: lesson.class.supervisor 
          ? `${lesson.class.supervisor.name} ${lesson.class.supervisor.surname}` 
          : "N/A",
        capacity: lesson.class.capacity,
        studentCount: lesson.class.students.length,
      });
    }
  });

  const myClasses = Array.from(classesMap.values());
  const totalCapacity = myClasses.reduce((sum, c) => sum + c.capacity, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link
        href="/dashboard/teacher"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
            {teacher.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacher.name} {teacher.surname} • {myClasses.length} {myClasses.length === 1 ? "class" : "classes"} assigned
            </p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <School className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
          <p className="text-xs text-gray-500">Classes</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
          <p className="text-xs text-gray-500">Total Capacity</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.subjects.length}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
      </div>

      {/* ========== EMPTY STATE ========== */}
      {myClasses.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Classes Assigned</h3>
          <p className="text-sm text-gray-500">You are not assigned to any classes yet. Contact the administrator.</p>
        </div>
      )}

      {/* ========== CLASS CARDS ========== */}
      {myClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.map((cls) => (
            <Link
              key={cls.id}
              href={`/dashboard/teacher/my-classes/${cls.name}`}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              {/* Class Icon */}
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <School className="w-6 h-6 text-indigo-600" />
              </div>

              {/* Class Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Grade {cls.grade}</p>

              {/* Stats */}
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{cls.studentCount} / {cls.capacity} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="truncate">Supervisor: {cls.supervisor}</span>
                </div>
              </div>

              {/* View Link */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                View Class
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}