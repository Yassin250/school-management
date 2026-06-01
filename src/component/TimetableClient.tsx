// src/component/TimetableClient.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Clock, DoorOpen, School, Users, ChevronLeft, ChevronRight, Edit2, Check, X, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { upsertLessonTopic } from "@/lib/actions/lesson";
import { toast } from "sonner";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const PERIODS = [
  { time: "08:00 - 08:45", label: "Period 1" },
  { time: "09:00 - 09:45", label: "Period 2" },
  { time: "10:00 - 10:45", label: "Period 3" },
  { time: "11:00 - 11:45", label: "Period 4" },
  { time: "12:00 - 12:45", label: "Break" },
  { time: "13:00 - 13:45", label: "Period 5" },
  { time: "14:00 - 14:45", label: "Period 6" },
  { time: "15:00 - 15:45", label: "Period 7" },
] as const;

export type TimetableEntry = {
  id: number;
  subject: string;
  group: string;
  person?: string;
  room: string;
  lessonName?: string;
} | null;

export type TimetableData = Record<string, Record<string, TimetableEntry>>;

type Term = {
  id: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  current: boolean;
};

type Props = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  timetable: TimetableData;
  stats: {
    totalLessons: number;
    subjectsCount: number;
    groupsCount: number;
    groupsLabel: string;
  };
  isDashboard?: boolean;
  terms?: Term[];
  selectedTermId?: number;
  isTeacher?: boolean;
  initialTopics?: { id: number; lessonId: number; weekNumber: number; topic: string }[];
};

const subjectStyles = [
  "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100/70",
  "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70",
  "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100/70",
  "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70",
  "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70",
  "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/70",
  "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100/70",
  "bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100/70",
];

function getSubjectStyle(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return subjectStyles[Math.abs(hash) % subjectStyles.length];
}

function countLessons(timetable: TimetableData, day: string) {
  return Object.values(timetable[day] || {}).filter(Boolean).length;
}

function LessonBlock({ entry, compact = false }: { entry: Exclude<TimetableEntry, null>; compact?: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 transition-all duration-200 ${getSubjectStyle(entry.subject)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-sm font-semibold">{entry.subject}</p>
          <p className="truncate text-[10px] sm:text-xs opacity-75">{entry.group}</p>
        </div>
        <DoorOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
      </div>
      {!compact && (
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] sm:text-xs opacity-80">
          {entry.person && <span>👤 {entry.person}</span>}
          <span>🚪 Room {entry.room}</span>
        </div>
      )}
    </div>
  );
}

export default function TimetableClient({
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "Back",
  timetable,
  stats,
  isDashboard = false,
  terms = [],
  selectedTermId,
  isTeacher = false,
  initialTopics = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTerm = useMemo(() => {
    return terms.find((t) => t.id === selectedTermId) || terms.find((t) => t.current) || terms[0];
  }, [terms, selectedTermId]);

  // Calculate current week number
  const calculatedCurrentWeek = useMemo(() => {
    if (!activeTerm) return 1;
    const start = new Date(activeTerm.startDate);
    const end = new Date(activeTerm.endDate);
    const now = new Date();
    if (now < start) return 1;
    if (now > end) {
      const totalMs = end.getTime() - start.getTime();
      return Math.min(12, Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000)));
    }
    const diffMs = now.getTime() - start.getTime();
    return Math.min(12, Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
  }, [activeTerm]);

  const [selectedWeek, setSelectedWeek] = useState<number>(calculatedCurrentWeek);
  const [topics, setTopics] = useState(initialTopics);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null); // "lessonId-week"
  const [editTopicValue, setEditTopicValue] = useState("");

  const currentWeekday = new Date().getDay();
  const initialDay = currentWeekday >= 1 && currentWeekday <= 5 ? DAYS[currentWeekday - 1] : DAYS[0];
  const [selectedDay, setSelectedDay] = useState<string>(initialDay);

  const busiestDay = useMemo(() => {
    return DAYS.reduce(
      (best, day) => {
        const lessons = countLessons(timetable, day);
        return lessons > best.lessons ? { day, lessons } : best;
      },
      { day: DAYS[0], lessons: 0 }
    );
  }, [timetable]);

  const handleTermChange = (termIdStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("termId", termIdStr);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleEditTopicStart = (lessonId: number, weekNum: number, currentTopic: string) => {
    setEditingTopicId(`${lessonId}-${weekNum}`);
    setEditTopicValue(currentTopic);
  };

  const handleSaveTopic = async (lessonId: number, weekNum: number) => {
    if (!editTopicValue.trim()) {
      toast.error("Topic cannot be empty");
      return;
    }

    const response = await upsertLessonTopic({
      lessonId,
      weekNumber: weekNum,
      topic: editTopicValue,
    });

    if (response.success) {
      toast.success("Lesson topic updated successfully");
      setTopics((prev) => {
        const other = prev.filter((t) => !(t.lessonId === lessonId && t.weekNumber === weekNum));
        return [...other, { id: Date.now(), lessonId, weekNumber: weekNum, topic: editTopicValue }];
      });
      setEditingTopicId(null);
    } else {
      toast.error(response.error || "Failed to update topic");
    }
  };

  // List of all lessons scheduled across this timetable
  const uniqueLessons = useMemo(() => {
    const list: { id: number; subject: string; group: string; room: string; time: string; day: string }[] = [];
    Object.entries(timetable).forEach(([day, periods]) => {
      Object.entries(periods).forEach(([time, entry]) => {
        if (entry) {
          list.push({
            id: entry.id,
            subject: entry.subject,
            group: entry.group,
            room: entry.room,
            time,
            day,
          });
        }
      });
    });
    return list;
  }, [timetable]);

  return (
    <div className={`mx-auto w-full space-y-6 ${isDashboard ? "p-0" : "max-w-7xl p-4 sm:p-6"}`}>
      {/* ========== HEADER (Only if not in Dashboard) ========== */}
      {!isDashboard && (
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}

      {/* ========== TITLE BLOCK & STATS ========== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950 leading-tight">{title}</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                {subtitle} {activeTerm && `• ${activeTerm.name}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:self-center">
            {/* Term selector dropdown */}
            {terms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Term:</span>
                <select
                  value={selectedTermId || activeTerm?.id}
                  onChange={(e) => handleTermChange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  disabled={isPending}
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.current ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5 text-center min-w-[280px] sm:min-w-[340px]">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 sm:p-3">
                <Clock className="mx-auto mb-1 h-4 w-4 text-indigo-600" />
                <p className="text-base sm:text-lg font-bold text-slate-950">{stats.totalLessons}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Lessons</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 sm:p-3">
                <BookOpen className="mx-auto mb-1 h-4 w-4 text-violet-600" />
                <p className="text-base sm:text-lg font-bold text-slate-950">{stats.subjectsCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Subjects</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 sm:p-3">
                <Users className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
                <p className="text-base sm:text-lg font-bold text-slate-950">{stats.groupsCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{stats.groupsLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SCHEDULE TABLE SECTION ========== */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Weekly schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">Busiest day: {busiestDay.day} with {busiestDay.lessons} lessons</p>
          </div>
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 w-full sm:max-w-sm">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                  selectedDay === day ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="hidden xs:inline">{day}</span>
                <span className="xs:hidden">{day.slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop grid (displayed on large screens) */}
        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[140px_repeat(5,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50/50">
              <div className="px-4 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="border-l border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">{day}</p>
                  <p className="text-xs text-slate-500 font-medium">{countLessons(timetable, day)} lessons</p>
                </div>
              ))}
            </div>

            {PERIODS.map((period) => {
              const isBreak = period.label === "Break" || period.label === "Lunch Break";
              return (
                <div key={period.time} className="grid grid-cols-[140px_repeat(5,minmax(140px,1fr))] border-b border-slate-100 last:border-b-0">
                  <div className={`px-4 py-3 flex flex-col justify-center ${isBreak ? "bg-amber-50/40" : "bg-white"}`}>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{period.label}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{period.time}</p>
                  </div>
                  {DAYS.map((day) => {
                    const entry = timetable[day]?.[period.time];
                    return (
                      <div key={`${day}-${period.time}`} className={`min-h-[85px] border-l border-slate-100 p-2.5 ${isBreak ? "bg-amber-50/20" : "bg-white"}`}>
                        {isBreak ? (
                          <div className="flex h-full items-center justify-center rounded-xl border border-amber-200/50 bg-amber-50/30 text-xs font-semibold text-amber-700">
                            ☕ Break
                          </div>
                        ) : entry ? (
                          <LessonBlock entry={entry} compact />
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-medium text-slate-300">
                            Free
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile timetable layout (displayed on mobile view) */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {PERIODS.map((period) => {
            const entry = timetable[selectedDay]?.[period.time];
            const isBreak = period.label === "Break" || period.label === "Lunch Break";
            return (
              <div key={period.time} className={`grid grid-cols-[90px_1fr] gap-3 p-4 items-center ${isBreak ? "bg-amber-50/20" : ""}`}>
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">{period.label}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{period.time}</p>
                </div>
                {isBreak ? (
                  <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 px-3 py-2 text-xs font-bold text-amber-700">
                    ☕ Break
                  </div>
                ) : entry ? (
                  <LessonBlock entry={entry} />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-400">
                    Free period
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== LESSON TOPICS / PLANNER SECTION ========== */}
      {uniqueLessons.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Weekly Lesson Plan Topics</h3>
                <p className="text-xs text-slate-500 font-medium">View and set topics per week for this term.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Week:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                  disabled={selectedWeek <= 1}
                  className="p-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w} {w === calculatedCurrentWeek ? "(This Week)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedWeek((w) => Math.min(12, w + 1))}
                  disabled={selectedWeek >= 12}
                  className="p-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueLessons.map((l) => {
              const matchedTopic = topics.find((t) => t.lessonId === l.id && t.weekNumber === selectedWeek);
              const isEditing = editingTopicId === `${l.id}-${selectedWeek}`;

              return (
                <div key={l.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-all duration-200 flex flex-col justify-between bg-slate-50/20">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/50 text-slate-700">
                          {l.day} • {l.time}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1.5">{l.subject}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{l.group} • Room {l.room}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lesson Topic:</p>
                      {isEditing ? (
                        <div className="mt-2 flex gap-2">
                          <textarea
                            value={editTopicValue}
                            onChange={(e) => setEditTopicValue(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            rows={2}
                          />
                          <div className="flex flex-col gap-1.5 justify-end">
                            <button
                              onClick={() => handleSaveTopic(l.id, selectedWeek)}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTopicId(null)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">
                            {matchedTopic?.topic || <span className="text-slate-400 italic">No topic scheduled yet</span>}
                          </p>
                          {isTeacher && (
                            <button
                              onClick={() => handleEditTopicStart(l.id, selectedWeek, matchedTopic?.topic || "")}
                              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========== WEEKLY OVERVIEW (Cards) ========== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 ${
              selectedDay === day ? "border-indigo-300 ring-4 ring-indigo-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-slate-900">{day.slice(0, 3)}</p>
              <School className="h-4 w-4 text-slate-400 animate-pulse" />
            </div>
            <p className="mt-2 text-2xl font-black text-indigo-600">{countLessons(timetable, day)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">lessons</p>
          </button>
        ))}
      </section>
    </div>
  );
}
