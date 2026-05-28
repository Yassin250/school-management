"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { parentsData, studentsData } from "@/lib/mockData";
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle, Clock, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const MOCK_FEES: Record<string, { id: string; description: string; amount: number; dueDate: string; status: "paid" | "pending" | "overdue"; paidDate?: string }[]> = {
  "1": [
    { id: "1", description: "Tuition Fee - Term 2", amount: 2500, dueDate: "2026-05-15", status: "paid", paidDate: "2026-05-10" },
    { id: "2", description: "Library Fee", amount: 200, dueDate: "2026-05-15", status: "paid", paidDate: "2026-05-10" },
    { id: "3", description: "Laboratory Fee", amount: 500, dueDate: "2026-05-20", status: "pending" },
    { id: "4", description: "Sports Fee", amount: 300, dueDate: "2026-04-30", status: "overdue" },
    { id: "5", description: "Exam Fee", amount: 400, dueDate: "2026-05-08", status: "paid", paidDate: "2026-05-05" },
  ],
};

export default function ParentFeesPage() {
  const { data: session } = useSession();
  const parentId = session?.user?.id || "1";
  const parent = parentsData.find((p) => p.id === parentId);
  const myChildren = studentsData.filter((s) => parent?.children.includes(s.name));
  const [selectedChildId, setSelectedChildId] = useState(myChildren[0]?.id || "");
  const child = myChildren.find((c) => c.id === selectedChildId);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fees = MOCK_FEES[selectedChildId] || [];
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = fees.filter((f) => f.status === "pending" || f.status === "overdue").reduce((sum, f) => sum + f.amount, 0);
  const paidPercentage = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;

  const handlePayAll = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setShowPayment(false);
    toast.success("Payment successful!");
  };

  if (!parent || myChildren.length === 0) {
    return <div className="p-6 text-center"><h1 className="text-xl font-semibold">No children linked</h1></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/parent" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
            {parent.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
            <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
              className="mt-2 h-10 px-3 rounded-lg border border-gray-200 text-sm">
              {myChildren.map((c) => (<option key={c.id} value={c.id}>{c.name} — Class {c.class}</option>))}
            </select>
          </div>
        </div>

        {child && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{child.name}'s Fee Completion</span>
              <span className="text-lg font-bold text-blue-700">{paidPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${paidPercentage}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-lg font-bold">${totalFees}</p><p className="text-xs text-gray-500">Total</p></div>
              <div><p className="text-lg font-bold text-green-700">${paidFees}</p><p className="text-xs text-green-600">Paid</p></div>
              <div><p className="text-lg font-bold text-red-700">${pendingFees}</p><p className="text-xs text-red-600">Pending</p></div>
            </div>
          </div>
        )}
      </div>

      {pendingFees > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div><p className="text-sm font-semibold text-red-700">Pending Fees</p><p className="text-xs text-red-600">${pendingFees} remaining</p></div>
          </div>
          <button onClick={() => setShowPayment(true)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700">Pay Now</button>
        </div>
      )}

      {child && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50"><h3 className="text-sm font-semibold text-gray-500 uppercase">Fee Breakdown</h3></div>
          <div className="divide-y divide-gray-50">
            {fees.map((fee) => (
              <div key={fee.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${fee.status === "paid" ? "bg-green-100 text-green-700" : fee.status === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                    {fee.status === "paid" ? <CheckCircle className="w-4 h-4" /> : fee.status === "overdue" ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{fee.description}</p>
                    <p className="text-xs text-gray-400"><Calendar className="w-3 h-3 inline" /> Due: {new Date(fee.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${fee.status === "paid" ? "text-green-600" : "text-gray-900"}`}>${fee.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isProcessing && setShowPayment(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Pay All Pending Fees</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm">Total pending for {child?.name}</p>
              <p className="text-2xl font-bold">${pendingFees}</p>
            </div>
            <button onClick={handlePayAll} disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Pay ${pendingFees}</>}
            </button>
            <button onClick={() => setShowPayment(false)} className="w-full mt-2 py-2 text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}