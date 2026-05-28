import { DollarSign, TrendingUp, CreditCard, AlertCircle } from "lucide-react";

const monthlyData = [
  { month: "Jan", collected: 45000, pending: 12000 },
  { month: "Feb", collected: 52000, pending: 8000 },
  { month: "Mar", collected: 48000, pending: 15000 },
  { month: "Apr", collected: 61000, pending: 5000 },
  { month: "May", collected: 55000, pending: 10000 },
  { month: "Jun", collected: 67000, pending: 3000 },
];

export default function FinanceChart() {
  const totalCollected = monthlyData.reduce((sum, m) => sum + m.collected, 0);
  const totalPending = monthlyData.reduce((sum, m) => sum + m.pending, 0);
  const collectionRate = Math.round((totalCollected / (totalCollected + totalPending)) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 h-full border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fee Collection Overview</h3>
          <p className="text-sm text-gray-500 mt-0.5">January - June 2026</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{collectionRate}% Collected</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            ${(totalCollected / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500">Collected</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            ${(totalPending / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <CreditCard className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            ${((totalCollected + totalPending) / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="flex items-end justify-between gap-3 h-[200px]">
        {monthlyData.map((month) => {
          const maxValue = 70000;
          const collectedHeight = (month.collected / maxValue) * 180;
          const pendingHeight = (month.pending / maxValue) * 180;

          return (
            <div key={month.month} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex flex-col items-center w-full" style={{ height: "180px", justifyContent: "flex-end" }}>
                <div
                  className="w-full max-w-[35px] bg-green-500 rounded-t-md transition-all hover:bg-green-600 cursor-pointer"
                  style={{ height: `${collectedHeight}px` }}
                />
                <div
                  className="w-full max-w-[35px] bg-orange-300 rounded-b-md transition-all hover:bg-orange-400 cursor-pointer"
                  style={{ height: `${pendingHeight}px` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 mt-1">{month.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}