// src/app/dashboard/parent/fees/ParentFeesClient.tsx
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

type FeeBreakdown = {
  tuitionFee: number;
  libraryFee: number;
  labFee: number;
  activityFee: number;
  transportFee: number;
  totalFee: number;
};

type Payment = {
  id: number;
  date: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
};

type ChildFees = {
  id: string;
  name: string;
  className: string;
  gradeLevel: number;
  sex: string;
  feeStructure: FeeBreakdown;
  payments: Payment[];
  totalPaid: number;
  balance: number;
  totalFee: number;
};

type Props = {
  parentName: string;
  children: ChildFees[];
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
  "Bank Transfer": <Building2 className="w-4 h-4" />,
  "Cash": <Banknote className="w-4 h-4" />,
  "Credit Card": <CreditCard className="w-4 h-4" />,
};

export default function ParentFeesClient({ parentName, children }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id ?? "");
  const [showBreakdown, setShowBreakdown] = useState(true);

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  if (children.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">No children enrolled</h1>
        <Link href="/dashboard/parent" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const paidPercent = selectedChild ? Math.round((selectedChild.totalPaid / selectedChild.totalFee) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/parent"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-sm text-gray-500">View fee structure and payment history</p>
          </div>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[200px] ${
                selectedChildId === child.id
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                child.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
              }`}>
                {child.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">Class {child.className}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Child Fees */}
      {selectedChild && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Fees</p>
                  <p className="text-xl font-bold text-gray-900">${selectedChild.totalFee.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">${selectedChild.totalPaid.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(paidPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{paidPercent}% paid</p>
            </div>

            <div className={`rounded-2xl p-6 border shadow-sm ${
              selectedChild.balance > 0
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedChild.balance > 0 ? "bg-red-100" : "bg-green-100"
                }`}>
                  {selectedChild.balance > 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Balance</p>
                  <p className={`text-xl font-bold ${
                    selectedChild.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    ${selectedChild.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className={`text-xs font-medium ${
                selectedChild.balance > 0 ? "text-red-500" : "text-green-500"
              }`}>
                {selectedChild.balance > 0 ? "Payment pending" : "All fees paid! 🎉"}
              </p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Fee Breakdown
              </h3>
              {showBreakdown ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showBreakdown && (
              <div className="px-5 pb-5 space-y-3">
                {[
                  { label: "Tuition Fee", value: selectedChild.feeStructure.tuitionFee, color: "bg-blue-50 border-blue-200" },
                  { label: "Library Fee", value: selectedChild.feeStructure.libraryFee, color: "bg-purple-50 border-purple-200" },
                  { label: "Lab Fee", value: selectedChild.feeStructure.labFee, color: "bg-teal-50 border-teal-200" },
                  { label: "Activity Fee", value: selectedChild.feeStructure.activityFee, color: "bg-orange-50 border-orange-200" },
                  { label: "Transport Fee", value: selectedChild.feeStructure.transportFee, color: "bg-pink-50 border-pink-200" },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl border ${item.color}`}>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">${item.value.toLocaleString()}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 mt-3">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-black text-amber-700">
                    ${selectedChild.feeStructure.totalFee.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Payment History ({selectedChild.payments.length} transactions)
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {selectedChild.payments.length > 0 ? (
                selectedChild.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === "Completed" ? "bg-green-100" : "bg-amber-100"
                    }`}>
                      {payment.status === "Completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          ${payment.amount.toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          payment.status === "Completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {payment.method} • Ref: {payment.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{payment.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No payment records yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}