import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Announcements from "@/component/Announcements";
import BigCalendarContainer from "@/component/BigCalendarContainer";
import EventCalendarContainer from "@/component/EventCalendarContainer";
import { BookOpen, Users, CalendarCheck, Clock, TrendingUp } from "lucide-react";

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    return <div>Not authenticated</div>;
  }

  // Fetch teacher data with relations
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      subjects: true,
      supervisedClasses: {
        include: {
          students: true,
        },
      },
      lessons: {
        where: {
          // Get today's lessons
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          subject: true,
          class: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  // Calculate real stats
  const totalStudents = teacher.supervisedClasses.reduce(
    (acc, cls) => acc + cls.students.length, 
    0
  );

  // Get all lessons for this week to calculate weekly lesson count
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const weeklyLessons = await prisma.lesson.count({
    where: {
      teacherId: teacherId,
      startTime: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
  });

  const stats = [
    { 
      icon: Users, 
      label: "Students", 
      value: totalStudents.toString(), 
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      icon: BookOpen, 
      label: "Classes", 
      value: teacher.supervisedClasses.length.toString(), 
      color: "bg-green-50 text-green-600" 
    },
    { 
      icon: CalendarCheck, 
      label: "Lessons/Week", 
      value: weeklyLessons.toString(), 
      color: "bg-purple-50 text-purple-600" 
    },
    { 
      icon: TrendingUp, 
      label: "Subjects", 
      value: teacher.subjects.length.toString(), 
      color: "bg-orange-50 text-orange-600" 
    },
  ];

  // Format today's lessons
  const todayClasses = teacher.lessons.map((lesson) => ({
    subject: lesson.subject?.name || 'Unknown',
    class: lesson.class?.name || 'Unknown',
    time: `${lesson.startTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })} - ${lesson.endTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`,
    room: 'TBD',
    color: getSubjectColor(lesson.subject?.name || ''),
  }));

  const teacherName = `${teacher.name} ${teacher.surname}`;

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {/* Welcome + Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome back, {teacher.name}!</h2>
              <p className="text-sm text-gray-500 mt-1">
                You have {todayClasses.length} class{todayClasses.length !== 1 ? 'es' : ''} today
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`rounded-xl p-4 ${stat.color} bg-opacity-10`}>
                  <Icon className="w-5 h-5 mb-2 opacity-70" />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-70">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Today's Classes</h1>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {todayClasses.length} class{todayClasses.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${cls.color} bg-gray-50`}
                >
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{cls.subject}</h4>
                    <p className="text-xs text-gray-500">Class {cls.class} • Room {cls.room}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{cls.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No classes scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
          <h1 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h1>
          <BigCalendarContainer type="teacherId" id={teacherId} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        {/* Teacher Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Info</h3>
          <div className="space-y-3">
            {teacher.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Email:</span> {teacher.email}
              </div>
            )}
            {teacher.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Phone:</span> {teacher.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Subjects:</span> 
              {teacher.subjects.map(s => s.name).join(', ')}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <CalendarCheck className="w-6 h-6 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">Mark Attendance</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <BookOpen className="w-6 h-6 text-green-600" />
              <span className="text-xs font-medium text-green-700">Enter Grades</span>
            </button>
          </div>
        </div>
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
};

// Helper function to assign colors based on subject
function getSubjectColor(subject: string): string {
  const colorMap: { [key: string]: string } = {
    'Mathematics': 'border-l-blue-500',
    'Math': 'border-l-blue-500',
    'Physics': 'border-l-amber-500',
    'Chemistry': 'border-l-green-500',
    'Biology': 'border-l-emerald-500',
    'English': 'border-l-red-500',
    'History': 'border-l-purple-500',
    'Geography': 'border-l-indigo-500',
  };
  return colorMap[subject] || 'border-l-gray-500';
}

export default TeacherPage;