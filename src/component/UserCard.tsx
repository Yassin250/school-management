import { Users, UserCheck, GraduationCap, UserPlus } from "lucide-react";

const userCardData = {
  admin: {
    icon: UserCheck,
    label: "Admins",
    count: 4,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
  },
  teacher: {
    icon: Users,
    label: "Teachers",
    count: 28,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
  },
  student: {
    icon: GraduationCap,
    label: "Students",
    count: 1247,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
  },
  parent: {
    icon: UserPlus,
    label: "Parents",
    count: 1890,
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    borderColor: "border-orange-200",
  },
};

export default function UserCard({ type }: { type: "admin" | "teacher" | "student" | "parent" }) {
  const data = userCardData[type];
  const Icon = data.icon;

  return (
    <div className={`flex-1 min-w-[130px] rounded-2xl p-4 border ${data.borderColor} ${data.bgColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 bg-white/80 px-2 py-1 rounded-full">
          2025/26
        </span>
        <Icon className={`w-8 h-8 ${data.iconColor}`} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mt-3">
        {data.count.toLocaleString()}
      </h3>
      <p className="text-sm text-gray-600 mt-1">{data.label}</p>
    </div>
  );
}