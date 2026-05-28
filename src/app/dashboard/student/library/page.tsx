"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { studentsData } from "@/lib/mockData";
import { ArrowLeft, BookOpen, Clock, Calendar, AlertCircle, CheckCircle, Search, BookMarked } from "lucide-react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  issueDate: string;
  dueDate: string;
  status: "borrowed" | "overdue" | "returned";
  returnDate?: string;
  fine?: number;
};

const MOCK_BOOKS: Book[] = [
  { id: "1", title: "Advanced Mathematics", author: "Dr. R.K. Sharma", isbn: "978-0-12-345678-9", category: "Mathematics", issueDate: "2026-04-15", dueDate: "2026-05-15", status: "borrowed" },
  { id: "2", title: "Physics for Scientists", author: "Paul A. Tipler", isbn: "978-0-71-678964-2", category: "Physics", issueDate: "2026-03-20", dueDate: "2026-04-20", status: "overdue", fine: 15 },
  { id: "3", title: "English Literature Anthology", author: "M.H. Abrams", isbn: "978-0-39-395551-4", category: "English", issueDate: "2026-02-10", dueDate: "2026-03-10", status: "returned", returnDate: "2026-03-05" },
  { id: "4", title: "Chemistry: The Central Science", author: "Theodore Brown", isbn: "978-0-13-441423-2", category: "Chemistry", issueDate: "2026-05-01", dueDate: "2026-06-01", status: "borrowed" },
  { id: "5", title: "World History", author: "William J. Duiker", isbn: "978-0-49-557069-1", category: "History", issueDate: "2026-01-15", dueDate: "2026-02-15", status: "returned", returnDate: "2026-02-10" },
  { id: "6", title: "Introduction to Biology", author: "Neil A. Campbell", isbn: "978-0-32-155823-7", category: "Biology", issueDate: "2026-04-25", dueDate: "2026-05-25", status: "borrowed" },
];

const LIBRARY_CATALOG = [
  { id: "c1", title: "Data Structures & Algorithms", author: "Robert Sedgewick", category: "Computer Science", available: true },
  { id: "c2", title: "Organic Chemistry", author: "Jonathan Clayden", category: "Chemistry", available: true },
  { id: "c3", title: "Principles of Economics", author: "N. Gregory Mankiw", category: "Economics", available: false },
  { id: "c4", title: "Introduction to Psychology", author: "James W. Kalat", category: "Psychology", available: true },
  { id: "c5", title: "The Art of Computer Programming", author: "Donald Knuth", category: "Computer Science", available: true },
  { id: "c6", title: "Fundamentals of Physics", author: "David Halliday", category: "Physics", available: false },
];

export default function StudentLibraryPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id || "1";
  const student = studentsData.find((s) => s.id === studentId) || studentsData[0];

  const [activeTab, setActiveTab] = useState<"myBooks" | "catalog">("myBooks");
  const [searchTerm, setSearchTerm] = useState("");

  // Stats
  const borrowedBooks = MOCK_BOOKS.filter((b) => b.status === "borrowed");
  const overdueBooks = MOCK_BOOKS.filter((b) => b.status === "overdue");
  const returnedBooks = MOCK_BOOKS.filter((b) => b.status === "returned");
  const totalFine = MOCK_BOOKS.reduce((sum, b) => sum + (b.fine || 0), 0);

  // Filter my books
  const filteredMyBooks = MOCK_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter catalog
  const filteredCatalog = LIBRARY_CATALOG.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "borrowed": return "bg-blue-100 text-blue-700";
      case "overdue": return "bg-red-100 text-red-700";
      case "returned": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const daysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ========== BACK BUTTON ========== */}
      <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* ========== HEADER ========== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
            student.sex === "MALE" ? "bg-blue-500" : "bg-pink-500"
          }`}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Library</h1>
            <p className="text-sm text-gray-500 mt-1">{student.name} • Class {student.class}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("myBooks")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "myBooks" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <BookMarked className="w-4 h-4 inline mr-1" /> My Books
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "catalog" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" /> Browse Catalog
          </button>
        </div>
      </div>

      {/* ========== OVERDUE ALERT ========== */}
      {overdueBooks.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Overdue Books</p>
              <p className="text-xs text-red-600">{overdueBooks.length} book(s) overdue • Fine: ${totalFine}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== STATS (My Books only) ========== */}
      {activeTab === "myBooks" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{borrowedBooks.length}</p>
            <p className="text-xs text-gray-500">Borrowed</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
            <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-700">{overdueBooks.length}</p>
            <p className="text-xs text-red-600">Overdue</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-700">{returnedBooks.length}</p>
            <p className="text-xs text-green-600">Returned</p>
          </div>
        </div>
      )}

      {/* ========== SEARCH ========== */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={activeTab === "myBooks" ? "Search my books..." : "Search by title, author, or category..."}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ========== MY BOOKS LIST ========== */}
      {activeTab === "myBooks" && (
        <>
          {filteredMyBooks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">No Books</h3>
              <p className="text-sm text-gray-500">No books match your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyBooks.map((book) => {
                const daysLeft = daysUntil(book.dueDate);
                return (
                  <div key={book.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{book.title}</h3>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="text-xs text-gray-400">ISBN: {book.isbn}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              Issued: {new Date(book.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              Due: {new Date(book.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {book.status === "borrowed" && daysLeft <= 5 && daysLeft > 0 && (
                          <span className="text-xs text-amber-600 font-medium">{daysLeft} days left</span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(book.status)}`}>
                          {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                        </span>
                        {book.fine && (
                          <span className="text-xs font-bold text-red-600">Fine: ${book.fine}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========== CATALOG LIST ========== */}
      {activeTab === "catalog" && (
        <>
          {filteredCatalog.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">No Results</h3>
              <p className="text-sm text-gray-500">No books match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCatalog.map((book) => (
                <div key={book.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{book.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          book.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {book.available ? "Available" : "Issued"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}