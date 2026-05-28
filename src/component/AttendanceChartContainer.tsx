import AttendanceChart from "@/component/AttendanceChart";
import { TrendingUp, MoreHorizontal } from "lucide-react";

const AttendanceChartContainer = async () => {
  // ========== REAL DATA LOGIC (commented until Prisma is ready) ==========
  // const today = new Date();
  // const dayOfWeek = today.getDay();
  // const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  // const lastMonday = new Date(today);
  // lastMonday.setDate(today.getDate() - daysSinceMonday);
  //
  // const resData = await prisma.attendance.findMany({
  //   where: { date: { gte: lastMonday } },
  //   select: { date: true, present: true },
  // });
  //
  // const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  // const attendanceMap: { [key: string]: { present: number; absent: number } } = {
  //   Mon: { present: 0, absent: 0 },
  //   Tue: { present: 0, absent: 0 },
  //   Wed: { present: 0, absent: 0 },
  //   Thu: { present: 0, absent: 0 },
  //   Fri: { present: 0, absent: 0 },
  // };
  //
  // resData.forEach((item) => {
  //   const itemDate = new Date(item.date);
  //   const dow = itemDate.getDay();
  //   if (dow >= 1 && dow <= 5) {
  //     const dayName = daysOfWeek[dow - 1];
  //     if (item.present) {
  //       attendanceMap[dayName].present += 1;
  //     } else {
  //       attendanceMap[dayName].absent += 1;
  //     }
  //   }
  // });
  //
  // const data = daysOfWeek.map((day) => ({
  //   name: day,
  //   present: attendanceMap[day].present,
  //   absent: attendanceMap[day].absent,
  // }));

  // ========== MOCK DATA (remove when Prisma is connected) ==========
  const data = [
    { name: "Mon", present: 230, absent: 18 },
    { name: "Tue", present: 215, absent: 25 },
    { name: "Wed", present: 240, absent: 10 },
    { name: "Thu", present: 198, absent: 42 },
    { name: "Fri", present: 225, absent: 15 },
  ];

  const totalPresent = data.reduce((sum, d) => sum + d.present, 0);
  const totalAbsent = data.reduce((sum, d) => sum + d.absent, 0);
  const total = totalPresent + totalAbsent;
  const avgAttendance = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-6 h-full border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Attendance</h3>
          <p className="text-sm text-gray-500 mt-0.5">Monday - Friday</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{avgAttendance}% Avg</span>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <AttendanceChart data={data} />

      {/* Summary Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-xs text-gray-500">Present ({totalPresent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-300" />
            <span className="text-xs text-gray-500">Absent ({totalAbsent})</span>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          Total: {total} students
        </span>
      </div>
    </div>
  );
};

export default AttendanceChartContainer;