"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { Users } from "lucide-react";

const CountChart = ({ boys, girls }: { boys: number; girls: number }) => {
  const total = boys + girls;

  const data = [
    {
      name: "Total",
      count: total,
      fill: "#E5E7EB", // gray-200 background
    },
    {
      name: "Girls",
      count: girls,
      fill: "#F472B6", // pink-400
    },
    {
      name: "Boys",
      count: boys,
      fill: "#60A5FA", // blue-400
    },
  ];

  const boyPercentage = total > 0 ? Math.round((boys / total) * 100) : 0;
  const girlPercentage = total > 0 ? Math.round((girls / total) * 100) : 0;

  return (
    <div className="relative w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={28}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background
            dataKey="count"
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <Users className="w-8 h-8 text-gray-500" />
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span className="text-xs text-gray-600">
            Boys ({boyPercentage}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-pink-400" />
          <span className="text-xs text-gray-600">
            Girls ({girlPercentage}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountChart;