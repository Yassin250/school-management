// src/app/dashboard/teacher/exams/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ClipboardCheck, Calendar, Clock, Search, BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  // Get teacher with their classes
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      supervisedClasses: true,
      lessons: {
        include: {
          class: true,
        }
      }
    }
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Teacher not found</h1>
      </div>
    );
  }

  // Extract unique classes
  const classesSet = new Set<string>();
  teacher.supervisedClasses.forEach((c) => classesSet.add(c.name));
  teacher.lessons.forEach((l) => {
    if (l.class) classesSet.add(l.class.name);
  });
  const myClassNames = Array.from(classesSet);

  // Parse filters
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || "";
  const filterClass = resolvedSearchParams.class || "all";
  const filterStatus = resolvedSearchParams.status || "all";

  // Fetch all exams for teacher's lessons
  const allExams = await prisma.exam.findMany({
    where: {
      lesson: {
        teacherId: teacherId,
      },
    },
    include: {
      lesson: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Map and compute status
  const exams = allExams.map((exam) => {
    const now = new Date();
    let status: "Upcoming" | "Ongoing" | "Completed" = "Upcoming";
    if (now < exam.startTime) {
      status = "Upcoming";
    } else if (now > exam.endTime) {
      status = "Completed";
    } else {
      status = "Ongoing";
    }

    return {
      id: exam.id,
      title: exam.title,
      startTime: exam.startTime,
      endTime: exam.endTime,
      className: exam.lesson.class.name,
      subjectName: exam.lesson.subject.name,
      status,
    };
  });

  // Apply filters
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === "all" || exam.className === filterClass;
    const matchesStatus = filterStatus === "all" || exam.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Calculate stats
  const totalExamsCount = exams.length;
  const upcomingCount = exams.filter((e) => e.status === "Upcoming").length;
  const completedCount = exams.filter((e) => e.status === "Completed").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Ongoing": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Completed": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/teacher" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
            <ClipboardCheck className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
            <p className="text-sm text-gray-500 mt-1">
              {teacher.name} {teacher.surname} • {totalExamsCount} exams across {myClassNames.length} classes
            </p>
          </div>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalExamsCount}</p>
          <p className="text-xs text-gray-500">Total Exams</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center">
          <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{upcomingCount}</p>
          <p className="text-xs text-blue-600">Upcoming</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
          <ClipboardCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search exams..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="class"
          defaultValue={filterClass}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
        >
          <option value="all">All Classes</option>
          {myClassNames.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filterStatus}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
        >
          <option value="all">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-purple-600 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
        >
          Apply
        </button>
      </form>

      {/* ========== EXAM LIST ========== */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <ClipboardCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">No Exams Found</h3>
          <p className="text-sm text-gray-500">No exams match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 text-sm font-bold">
                      EX
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {exam.subjectName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(exam.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - 
                      {exam.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                  </div>

                  {/* Classes */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      Class {exam.className}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-start">
                  <Link
                    href={`/dashboard/teacher/grades?class=${encodeURIComponent(exam.className)}&subject=${encodeURIComponent(exam.subjectName)}&type=exam&itemId=${exam.id}`}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors whitespace-nowrap"
                  >
                    Enter Marks
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
