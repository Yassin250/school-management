import CountChart from "@/component/countchart";
import { GraduationCap } from "lucide-react";

export default function CountChartContainer() {
  // Mock data — replace with real API call later
  const boys = 648;
  const girls = 599;
  const total = boys + girls;

  return (
    <div className="bg-white rounded-2xl p-6 h-full border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Student Demographics</h3>
          <p className="text-sm text-gray-500 mt-0.5">Boys vs Girls</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          2025/26
        </span>
      </div>

      {/* Chart */}
      <CountChart boys={boys} girls={girls} />

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Total Students</span>
        </div>
        <span className="text-lg font-bold text-gray-900">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}