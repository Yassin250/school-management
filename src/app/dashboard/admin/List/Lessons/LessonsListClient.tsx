// src/app/dashboard/admin/List/Lessons/LessonsListClient.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  X,
  Clock,
  User,
  BookOpen,
  DoorOpen,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  createTerm,
  updateTerm,
  deleteTerm,
  setTermCurrent,
} from "@/lib/actions/lesson";
import { DAYS, PERIODS } from "@/component/TimetableClient";

// ============================================================
// TYPES
// ============================================================

type Term = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

type ClassItem = {
  id: number;
  name: string;
};

type Teacher = {
  id: string;
  name: string;
};

type Subject = {
  id: number;
  name: string;
};

type Lesson = {
  id: number;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  termId: number | null;
  room?: string;
};

type Props = {
  terms: Term[];
  classes: ClassItem[];
  teachers: Teacher[];
  subjects: Subject[];
  lessons: Lesson[];
  selectedTermId?: number;
  selectedClassId?: number;
};

// ============================================================
// CONSTANTS
// ============================================================

const dayEnumMap: Record<string, string> = {
  Monday: "MONDAY",
  Tuesday: "TUESDAY",
  Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY",
  Friday: "FRIDAY",
};

const reverseDayMap: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

const getSubjectColor = (subjectName: string): string => {
  const colors: Record<string, string> = {
    Mathematics: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70",
    Math: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70",
    "English Literature": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70",
    English: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70",
    Physics: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70",
    Chemistry: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/70",
    Biology: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70",
    "History & Geography": "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70",
    "Computer Science": "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70",
    "Physical Education": "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70",
  };
  return colors[subjectName] || "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/70";
};

// ============================================================
// COMPONENT
// ============================================================

export default function LessonsListClient({
  terms: initialTerms,
  classes,
  teachers,
  subjects,
  lessons: initialLessons,
  selectedTermId: initialTermId,
  selectedClassId: initialClassId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);

  // Selected filters for grid editor - use initial values if provided
  const [selectedClassId, setSelectedClassId] = useState<number | "">(
    initialClassId || classes[0]?.id || ""
  );
  const [selectedTermId, setSelectedTermId] = useState<number | "">(
    initialTermId || terms.find((t) => t.current)?.id || terms[0]?.id || ""
  );

  // Active view: "grid" (timetable editor) or "terms" (term list)
  const [activeTab, setActiveTab] = useState<"grid" | "terms">("grid");

  // Term modal state
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    current: false,
  });

  // Lesson modal state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  type LessonFormState = {
    name: string;
    day: string;
    periodTime: string;
    subjectId: number;
    teacherId: string;
    room: string;
  };

  const [lessonForm, setLessonForm] = useState<LessonFormState>({
    name: "",
    day: "MONDAY",
    periodTime: PERIODS[0].time,
    subjectId: subjects[0]?.id || 0,
    teacherId: teachers[0]?.id || "",
    room: "",
  });

  // Filter lessons for the selected class and term
  const activeLessons = lessons.filter(
    (l) => l.classId === selectedClassId && l.termId === selectedTermId
  );

  // ============================================================
  // TERM ACTIONS
  // ============================================================

  const handleOpenTermModal = (term: Term | null = null) => {
    if (term) {
      setEditingTerm(term);
      setTermForm({
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        current: term.current,
      });
    } else {
      setEditingTerm(null);
      setTermForm({ name: "", startDate: "", endDate: "", current: false });
    }
    setIsTermModalOpen(true);
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name.trim() || !termForm.startDate || !termForm.endDate) {
      toast.error("Please fill in all term details");
      return;
    }

    const payload = { ...termForm };
    let res;

    if (editingTerm) {
      res = await updateTerm(editingTerm.id, payload);
    } else {
      res = await createTerm(payload);
    }

    if (res.success && res.data) {
      toast.success(editingTerm ? "Term updated successfully" : "Term created successfully");
      
      const updatedTerm: Term = {
        id: res.data.id,
        name: res.data.name,
        startDate: res.data.startDate instanceof Date 
          ? res.data.startDate.toISOString().split("T")[0] 
          : String(res.data.startDate).split("T")[0],
        endDate: res.data.endDate instanceof Date 
          ? res.data.endDate.toISOString().split("T")[0] 
          : String(res.data.endDate).split("T")[0],
        current: res.data.current,
      };

      setTerms((prev) => {
        let list = [...prev];
        if (updatedTerm.current) {
          list = list.map((t) => ({ ...t, current: false }));
        }
        if (editingTerm) {
          list = list.map((t) => (t.id === updatedTerm.id ? updatedTerm : t));
        } else {
          list.push(updatedTerm);
        }
        return list;
      });

      setIsTermModalOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error || "Failed to save term");
    }
  };

  const handleSetTermCurrent = async (id: number) => {
    const res = await setTermCurrent(id);
    if (res.success) {
      toast.success("Active term updated");
      setTerms((prev) =>
        prev.map((t) => ({ ...t, current: t.id === id }))
      );
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error || "Failed to set active term");
    }
  };

  const handleDeleteTerm = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete term "${name}"?`)) return;

    const res = await deleteTerm(id);
    if (res.success) {
      toast.success("Term deleted");
      setTerms((prev) => prev.filter((t) => t.id !== id));
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error || "Failed to delete term");
    }
  };

  // ============================================================
  // LESSON ACTIONS
  // ============================================================

  const handleOpenLessonModal = (dayName: string, timeSlot: string, lesson: Lesson | null = null) => {
    if (!selectedClassId || !selectedTermId) {
      toast.error("Please select a Class and Term first");
      return;
    }

    if (lesson) {
      setEditingLesson(lesson);
      const periodObj = PERIODS.find(
        (p) => `${lesson.startTime} - ${lesson.endTime}` === p.time
      );
      setLessonForm({
        name: lesson.name,
        day: dayEnumMap[lesson.day] || "MONDAY",
        periodTime: periodObj?.time || PERIODS[0].time,
        subjectId: lesson.subjectId,
        teacherId: lesson.teacherId,
        room: lesson.room || "",
      });
    } else {
      setEditingLesson(null);
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      setLessonForm({
        name: `${selectedClass?.name || ""} Lesson`,
        day: dayEnumMap[dayName] || "MONDAY",
        periodTime: timeSlot,
        subjectId: subjects[0]?.id || 0,
        teacherId: teachers[0]?.id || "",
        room: "",
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.name.trim() || !selectedClassId || !selectedTermId) {
      toast.error("Please fill in all lesson details");
      return;
    }

    const [start, end] = lessonForm.periodTime.split(" - ");
    const payload = {
      name: lessonForm.name,
      day: lessonForm.day as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY",
      startTime: start,
      endTime: end,
      subjectId: Number(lessonForm.subjectId),
      classId: Number(selectedClassId),
      teacherId: lessonForm.teacherId,
      termId: Number(selectedTermId),
    };

    let res;
    if (editingLesson) {
      res = await updateLesson(editingLesson.id, payload);
    } else {
      res = await createLesson(payload);
    }

    if (res.success && res.data) {
      toast.success(editingLesson ? "Lesson updated" : "Lesson added");

      const startTimeStr = res.data.startTime instanceof Date
        ? `${res.data.startTime.getUTCHours().toString().padStart(2, "0")}:${res.data.startTime.getUTCMinutes().toString().padStart(2, "0")}`
        : start;
      const endTimeStr = res.data.endTime instanceof Date
        ? `${res.data.endTime.getUTCHours().toString().padStart(2, "0")}:${res.data.endTime.getUTCMinutes().toString().padStart(2, "0")}`
        : end;

      const newLesson: Lesson = {
        id: res.data.id,
        name: res.data.name,
        day: reverseDayMap[res.data.day] || "Monday",
        startTime: startTimeStr,
        endTime: endTimeStr,
        classId: res.data.classId,
        className: classes.find((c) => c.id === res.data.classId)?.name || "",
        subjectId: res.data.subjectId,
        subjectName: subjects.find((s) => s.id === res.data.subjectId)?.name || "",
        teacherId: res.data.teacherId,
        teacherName: teachers.find((t) => t.id === res.data.teacherId)?.name || "",
        termId: res.data.termId,
        room: lessonForm.room || "TBD",
      };

      setLessons((prev) => {
        if (editingLesson) {
          return prev.map((l) => (l.id === editingLesson.id ? newLesson : l));
        }
        return [...prev, newLesson];
      });

      setIsLessonModalOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error || "Failed to save lesson");
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheduled lesson?")) return;

    const res = await deleteLesson(id);
    if (res.success) {
      toast.success("Lesson removed");
      setLessons((prev) => prev.filter((l) => l.id !== id));
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error || "Failed to delete lesson");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            Lessons & Timetables
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build weekly class schedules, assign teachers, and manage school terms.
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "grid"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Weekly Grid Editor
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "terms"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Term Settings
          </button>
        </div>
      </div>

      {/* ========== TERM SETTINGS TAB ========== */}
      {activeTab === "terms" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Terms</h2>
              <p className="text-xs text-slate-500">Configure start/end dates for school terms.</p>
            </div>
            <button
              onClick={() => handleOpenTermModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Term
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {terms.map((t) => (
              <div
                key={t.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition hover:shadow-sm ${
                  t.current ? "border-indigo-400 bg-indigo-50/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                    {t.current ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetTermCurrent(t.id)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 text-slate-600 text-xs font-semibold">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start: {t.startDate}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> End: {t.endDate}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleOpenTermModal(t)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-slate-50"
                    title="Edit term"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!t.current && (
                    <button
                      onClick={() => handleDeleteTerm(t.id, t.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-slate-50"
                      title="Delete term"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== WEEKLY GRID TAB ========== */}
      {activeTab === "grid" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term</label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.current ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:self-end py-1">
              <p className="text-xs text-slate-400 font-semibold text-center sm:text-right">
                Showing <span className="text-indigo-600 font-black">{activeLessons.length}</span> scheduled lessons.
              </p>
            </div>
          </div>

          {/* Grid schedule editor */}
          {selectedClassId && selectedTermId ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[130px_repeat(5,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50/40">
                  <div className="px-4 py-3 text-xs font-bold uppercase text-slate-400 tracking-wider">Time Slot</div>
                  {DAYS.map((day) => (
                    <div key={day} className="border-l border-slate-100 px-4 py-3">
                      <p className="text-sm font-extrabold text-slate-900">{day}</p>
                    </div>
                  ))}
                </div>

                {PERIODS.map((period) => {
                  const isBreak = period.label === "Break" || period.label === "Lunch Break";
                  return (
                    <div key={period.time} className="grid grid-cols-[130px_repeat(5,minmax(140px,1fr))] border-b border-slate-100 last:border-b-0">
                      <div className={`px-4 py-3 flex flex-col justify-center ${isBreak ? "bg-amber-50/20" : "bg-white"}`}>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{period.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{period.time}</p>
                      </div>

                      {DAYS.map((day) => {
                        const lesson = activeLessons.find(
                          (l) => l.day === day && `${l.startTime} - ${l.endTime}` === period.time
                        );

                        return (
                          <div
                            key={`${day}-${period.time}`}
                            className={`min-h-[85px] border-l border-slate-100 p-2 flex flex-col justify-between ${
                              isBreak ? "bg-amber-50/10" : "bg-white hover:bg-slate-50/30"
                            }`}
                          >
                            {isBreak ? (
                              <div className="flex h-full items-center justify-center rounded-xl border border-amber-200/40 bg-amber-50/20 text-xs font-bold text-amber-700 select-none">
                                ☕ Break
                              </div>
                            ) : lesson ? (
                              <div className={`rounded-xl border p-2 text-left h-full flex flex-col justify-between transition ${getSubjectColor(lesson.subjectName)}`}>
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold truncate block">{lesson.subjectName}</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleOpenLessonModal(day, period.time, lesson)}
                                        className="text-slate-400 hover:text-indigo-600 transition"
                                        title="Edit lesson"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="text-slate-400 hover:text-rose-600 transition"
                                        title="Remove lesson"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[10px] opacity-75 mt-0.5 truncate flex items-center gap-1">
                                    <User className="w-3 h-3 flex-shrink-0" /> {lesson.teacherName}
                                  </p>
                                </div>
                                <p className="text-[9px] opacity-60 font-bold uppercase flex items-center gap-1 mt-1.5 self-end">
                                  <DoorOpen className="w-3 h-3" /> Room {lesson.room || "TBD"}
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenLessonModal(day, period.time)}
                                className="h-full w-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-slate-300 hover:text-slate-400 transition"
                                title="Add lesson"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold">Select a class and term to display the weekly schedule.</p>
            </div>
          )}
        </div>
      )}

      {/* ========== TERM MODAL ========== */}
      {isTermModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingTerm ? "Edit Term Details" : "Create New Term"}
              </h3>
              <button
                onClick={() => setIsTermModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTermSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term Name</label>
                <input
                  type="text"
                  placeholder="e.g. Term 1 2026"
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={termForm.startDate}
                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={termForm.endDate}
                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="term-current"
                  checked={termForm.current}
                  onChange={(e) => setTermForm({ ...termForm, current: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <label htmlFor="term-current" className="text-xs font-semibold text-slate-600 select-none">
                  Set as current active term
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTermModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 transition rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  Save Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== LESSON MODAL ========== */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingLesson ? "Edit Scheduled Lesson" : "Schedule New Lesson"}
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lesson Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics P1"
                  value={lessonForm.name}
                  onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekday</label>
                  <select
                    value={lessonForm.day}
                    onChange={(e) => setLessonForm({ ...lessonForm, day: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Slot</label>
                  <select
                    value={lessonForm.periodTime}
                    onChange={(e) => setLessonForm({ ...lessonForm, periodTime: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  >
                    {PERIODS.filter((p) => p.label !== "Break" && p.label !== "Lunch Break").map((p) => (
                      <option key={p.time} value={p.time}>
                        {p.label} ({p.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                  <select
                    value={lessonForm.subjectId}
                    onChange={(e) => setLessonForm({ ...lessonForm, subjectId: Number(e.target.value) })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</label>
                  <select
                    value={lessonForm.teacherId}
                    onChange={(e) => setLessonForm({ ...lessonForm, teacherId: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room</label>
                <input
                  type="text"
                  placeholder="e.g. 101, Lab A"
                  value={lessonForm.room}
                  onChange={(e) => setLessonForm({ ...lessonForm, room: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 transition rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  {editingLesson ? "Update Lesson" : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}