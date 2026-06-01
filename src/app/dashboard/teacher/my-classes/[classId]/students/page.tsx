// src/app/dashboard/teacher/my-classes/[classId]/students/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, School, Mail, GraduationCap, Users, User, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherClassStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const { classId } = await params; // classId is the className e.g. "1B"
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search || "";

  // Get class info
  const classInfo = await prisma.class.findUnique({
    where: { name: classId },
    include: {
      grade: true,
      supervisor: true,
    },
  });

  if (!classInfo) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Class not found</h1>
        <Link href="/dashboard/teacher/my-classes" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to My Classes
        </Link>
      </div>
    );
  }

  // Verify access: Is the teacher the supervisor OR does the teacher teach any lessons in this class?
  const isSupervisor = classInfo.supervisorId === teacherId;
  const teachesClass = await prisma.lesson.findFirst({
    where: {
      classId: classInfo.id,
      teacherId: teacherId,
    },
  });

  if (!isSupervisor && !teachesClass) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-1">You are not assigned to this class.</p>
        <Link href="/dashboard/teacher/my-classes" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to My Classes
        </Link>
      </div>
    );
  }

  // Get students in this class filtered by search term
  const students = await prisma.student.findMany({
    where: {
      classId: classInfo.id,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { surname: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    },
    include: {
      attendances: true,
      results: true,
    }
  });

  // Calculate stats for all students in the class
  const allClassStudentsCount = await prisma.student.count({
    where: { classId: classInfo.id }
  });
  
  const boysCount = await prisma.student.count({
    where: { classId: classInfo.id, sex: "MALE" }
  });

  const girlsCount = await prisma.student.count({
    where: { classId: classInfo.id, sex: "FEMALE" }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link
        href={`/dashboard/teacher/my-classes/${classId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Class Details
      </Link>

      {/* ========== CLASS HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
              <School className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class {classInfo.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Grade {classInfo.grade.level} • {allClassStudentsCount} students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/teacher/attendance?class=${classId}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Take Attendance
            </Link>
            <Link
              href={`/dashboard/teacher/grades?class=${classId}`}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              Enter Grades
            </Link>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{allClassStudentsCount}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <User className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{boysCount}</p>
          <p className="text-xs text-gray-500">Boys</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <User className="w-5 h-5 text-pink-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{girlsCount}</p>
          <p className="text-xs text-gray-500">Girls</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <GraduationCap className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{classInfo.capacity}</p>
          <p className="text-xs text-gray-500">Capacity</p>
        </div>
      </div>

      {/* ========== SEARCH ========== */}
      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search students by name, email, or ID..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* ========== EMPTY STATE ========== */}
      {allClassStudentsCount === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Students</h3>
          <p className="text-sm text-gray-500">No students are enrolled in this class yet.</p>
        </div>
      )}

      {/* ========== STUDENT LIST ========== */}
      {students.length === 0 && search ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No results</h3>
          <p className="text-sm text-gray-500">No students match "{search}"</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {students.map((student) => {
              // Calculate attendance rate
              const totalAtt = student.attendances.length;
              const presentAtt = student.attendances.filter(a => a.present).length;
              const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

              // Calculate avg score
              const totalScore = student.results.reduce((sum, r) => sum + r.score, 0);
              const totalRes = student.results.length;
              const avgScore = totalRes > 0 ? Math.round(totalScore / totalRes) : 0;

              const getLetterGrade = (score: number): string => {
                if (score >= 90) return "A";
                if (score >= 80) return "B";
                if (score >= 70) return "C";
                if (score >= 60) return "D";
                return "F";
              };
              const letterGrade = totalRes > 0 ? getLetterGrade(avgScore) : "-";

              return (
                <Link
                  key={student.id}
                  href={`/dashboard/teacher/students/${student.id}`}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
                    }`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{student.name} {student.surname}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {student.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {student.email}
                          </span>
                        )}
                        <span>ID: {student.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">{attRate}%</p>
                      <p className="text-xs text-gray-400">Attendance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">{letterGrade}</p>
                      <p className="text-xs text-gray-400">Grade</p>
                    </div>
                    <span className="text-gray-300">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}