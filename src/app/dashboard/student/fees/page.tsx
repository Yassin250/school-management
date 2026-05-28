"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle, Clock, Download, CreditCard, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type FeeItem = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paidDate?: string;
  receipt?: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
};

const MOCK_FEES: FeeItem[] = [
  { id: "1", description: "Tuition Fee - Term 2", amount: 2500, dueDate: "2026-05-15", status: "paid", paidDate: "2026-05-10", receipt: "REC-001" },
  { id: "2", description: "Library Fee", amount: 200, dueDate: "2026-05-15", status: "paid", paidDate: "2026-05-10", receipt: "REC-002" },
  { id: "3", description: "Laboratory Fee", amount: 500, dueDate: "2026-05-20", status: "pending" },
  { id: "4", description: "Sports Fee", amount: 300, dueDate: "2026-04-30", status: "overdue" },
  { id: "5", description: "Exam Fee - Mid-Term", amount: 400, dueDate: "2026-05-08", status: "paid", paidDate: "2026-05-05", receipt: "REC-003" },
  { id: "6", description: "Computer Lab Fee", amount: 350, dueDate: "2026-06-01", status: "pending" },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card", name: "Credit/Debit Card", icon: "💳" },
  { id: "bank", name: "Bank Transfer", icon: "🏦" },
  { id: "mobile", name: "Mobile Money", icon: "📱" },
];

export default function StudentFeesPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  const [showPayment, setShowPayment] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalFees = MOCK_FEES.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = MOCK_FEES.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = MOCK_FEES.filter((f) => f.status === "pending" || f.status === "overdue").reduce((sum, f) => sum + f.amount, 0);
  const paidPercentage = Math.round((paidFees / totalFees) * 100);

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setShowPayment(false);
    toast.success("Payment successful! Receipt generated.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "pending": return "bg-blue-100 text-blue-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-blue-500" />;
      case "overdue": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
            student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
          }`}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class}</p>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Fee Completion</span>
            <span className="text-lg font-bold text-blue-700">{paidPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${paidPercentage}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">${totalFees.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-700">${paidFees.toLocaleString()}</p>
              <p className="text-xs text-green-600">Paid</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-700">${pendingFees.toLocaleString()}</p>
              <p className="text-xs text-red-600">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== PENDING ALERT ========== */}
      {pendingFees > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Pending Fees</p>
              <p className="text-xs text-red-600">You have ${pendingFees.toLocaleString()} in pending fees</p>
            </div>
          </div>
          <button
            onClick={() => {
              const firstPending = MOCK_FEES.find((f) => f.status === "pending" || f.status === "overdue");
              if (firstPending) { setSelectedFee(firstPending); setShowPayment(true); }
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* ========== FEE LIST ========== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Fee Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_FEES.map((fee) => (
            <div key={fee.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getStatusBadge(fee.status)}`}>
                    {getStatusIcon(fee.status)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fee.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(fee.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {fee.paidDate && (
                        <span className="text-green-600">• Paid: {new Date(fee.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${fee.status === "paid" ? "text-green-600" : "text-gray-900"}`}>
                    ${fee.amount.toLocaleString()}
                  </span>
                  {fee.status === "paid" && fee.receipt && (
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Download Receipt">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {(fee.status === "pending" || fee.status === "overdue") && (
                    <button
                      onClick={() => { setSelectedFee(fee); setShowPayment(true); }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                    >
                      Pay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== PAYMENT MODAL ========== */}
      {showPayment && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isProcessing && setShowPayment(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Make Payment</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedFee.description}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${selectedFee.amount.toLocaleString()}</p>
            </div>

            <label className="text-xs font-medium text-gray-500 uppercase block mb-2">Payment Method</label>
            <div className="space-y-2 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === method.id ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{method.icon}</span>
                  <span className="text-sm font-medium">{method.name}</span>
                  {selectedMethod === method.id && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pay ${selectedFee.amount.toLocaleString()}</>
              )}
            </button>

            <button onClick={() => setShowPayment(false)} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}