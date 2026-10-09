"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Printer,
  BookOpen,
  Grid,
  List as ListIcon,
} from "lucide-react";
import { LessonModal, type LessonModalData } from "./lesson-modal";
import { DAYS_OF_WEEK, STANDARD_PERIODS } from "@/lib/services/timetable/types";

interface TimetableClientProps {
  canManage: boolean;
  activeYear: { id: string; name: string } | null;
  activeTerm: { id: string; name: string } | null;
  classes: Array<{
    id: string;
    name: string;
    levelName: string;
    levelCode: string;
    availableSubjects: Array<{ id: string; name: string; code: string }>;
    availableModules: Array<{ id: string; name: string; code: string }>;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    staffCode: string;
    assignedClassIds: string[];
  }>;
  subjects: Array<{ id: string; name: string; code: string }>;
  modules: Array<{ id: string; name: string; code: string }>;
  selectedClassId: string | null;
  selectedTeacherId: string | null;
  schedule: {
    class: {
      id: string;
      name: string;
      levelName: string;
      academicYearName: string;
      academicYearId: string;
    } | null;
    lessons: Array<{
      id: string;
      dayOfWeek: number;
      dayName: string;
      startTime: string;
      endTime: string;
      room: string;
      subjectId?: string | null;
      moduleId?: string | null;
      subjectName: string;
      teacherId: string;
      teacherName: string;
      timetableVersionId: string;
      academicYearId: string;
      termId: string;
    }>;
  } | null;
  teacherSchedule: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    room: string;
    subjectName: string;
    className: string;
    classId: string;
  }> | null;
}

export function TimetableClient({
  canManage,
  activeYear,
  activeTerm,
  classes,
  teachers,
  subjects,
  modules,
  selectedClassId,
  selectedTeacherId,
  schedule,
  teacherSchedule,
}: TimetableClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"class-grid" | "teacher-grid" | "list">("class-grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonModalData | null>(null);

  const handleClassChange = (classId: string) => {
    router.push(`/dashboard/timetable?classId=${encodeURIComponent(classId)}`);
  };

  const handleTeacherChange = (teacherId: string) => {
    router.push(`/dashboard/timetable?teacherId=${encodeURIComponent(teacherId)}`);
  };

  const openAddLesson = (dayOfWeek = 1, startTime = "08:00", endTime = "08:45") => {
    setEditingLesson({
      classId: selectedClassId || classes[0]?.id || "",
      dayOfWeek,
      startTime,
      endTime,
      teacherId: teachers[0]?.id || "",
      room: "",
    });
    setModalOpen(true);
  };

  const openEditLesson = (lesson: {
    id: string;
    classId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    teacherId: string;
    subjectId?: string | null;
    moduleId?: string | null;
    room?: string | null;
  }) => {
    if (!canManage) return;
    setEditingLesson({
      id: lesson.id,
      classId: lesson.classId || selectedClassId || "",
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      moduleId: lesson.moduleId,
      room: lesson.room,
    });
    setModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to find a lesson matching a standard period and day
  const findClassLessonInSlot = (dayId: number, period: typeof STANDARD_PERIODS[0]) => {
    if (!schedule) return null;
    return schedule.lessons.find((l) => {
      if (l.dayOfWeek !== dayId) return false;
      return (
        l.startTime === period.startTime ||
        (l.startTime <= period.startTime && l.endTime >= period.endTime) ||
        (l.startTime >= period.startTime && l.startTime < period.endTime)
      );
    });
  };

  const findTeacherLessonInSlot = (dayId: number, period: typeof STANDARD_PERIODS[0]) => {
    if (!teacherSchedule) return null;
    return teacherSchedule.find((l) => {
      if (l.dayOfWeek !== dayId) return false;
      return (
        l.startTime === period.startTime ||
        (l.startTime <= period.startTime && l.endTime >= period.endTime) ||
        (l.startTime >= period.startTime && l.startTime < period.endTime)
      );
    });
  };

  const currentTeacherObj = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Timetable & Schedule Management
            </h1>
            {activeTerm && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {activeYear?.name} &bull; {activeTerm.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive master schedule with live clash detection and period allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print Schedule
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => openAddLesson()} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Period
            </Button>
          )}
        </div>
      </div>

      {/* Filter & View Controls */}
      <Card className="print:hidden border-muted/70 bg-card/60 backdrop-blur-xs">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Class / Teacher Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Class:
                </span>
                <select
                  value={selectedClassId || ""}
                  onChange={(e) => {
                    setViewMode("class-grid");
                    handleClassChange(e.target.value);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.levelName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Teacher:
                </span>
                <select
                  value={selectedTeacherId || ""}
                  onChange={(e) => {
                    setViewMode("teacher-grid");
                    handleTeacherChange(e.target.value);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Teacher Schedule...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.staffCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("class-grid")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "class-grid"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="h-3 w-3" /> Class Grid
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTeacherId && teachers[0]) {
                    handleTeacherChange(teachers[0].id);
                  }
                  setViewMode("teacher-grid");
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "teacher-grid"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-3 w-3" /> Teacher Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListIcon className="h-3 w-3" /> List View
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Schedule Container */}
      <Card className="overflow-hidden border shadow-xs">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {viewMode === "teacher-grid" && currentTeacherObj ? (
                  <span>Instructor Weekly Schedule: {currentTeacherObj.name}</span>
                ) : (
                  <span>Class Weekly Schedule: {schedule?.class?.name ?? "Selected Class"}</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {viewMode === "teacher-grid" && currentTeacherObj ? (
                  <span>Staff Code {currentTeacherObj.staffCode} &bull; Academic Year {activeYear?.name}</span>
                ) : (
                  <span>{schedule?.class?.levelName} &bull; Academic Year {schedule?.class?.academicYearName ?? activeYear?.name}</span>
                )}
              </CardDescription>
            </div>

            {canManage && (
              <Badge variant="secondary" className="text-[11px] font-normal text-muted-foreground self-start sm:self-auto">
                Click any slot to add or edit periods
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* 1. Class Grid Matrix View */}
          {viewMode === "class-grid" && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                    <th className="p-2.5 pl-4 border-r w-28 text-xs">Time & Period</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day.id} className="p-2.5 border-r min-w-[130px] font-bold text-foreground text-center">
                        <div>{day.name}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">{day.short}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {STANDARD_PERIODS.map((period, pIdx) => {
                    if (period.isBreak) {
                      return (
                        <tr key={`break-${pIdx}`} className="bg-muted/25 text-muted-foreground">
                          <td className="p-2 pl-4 border-r font-medium text-[11px]">
                            <div className="flex items-center gap-1 text-muted-foreground/80 font-mono">
                              <Clock className="h-3 w-3 text-muted-foreground/60" />
                              <span>{period.startTime} - {period.endTime}</span>
                            </div>
                          </td>
                          <td colSpan={DAYS_OF_WEEK.length} className="p-2 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            ☕ {period.label} ({period.startTime} &ndash; {period.endTime})
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={`period-${period.period}`} className="hover:bg-muted/10 transition-colors">
                        {/* Period & Time Column */}
                        <td className="p-2.5 pl-4 border-r bg-muted/10">
                          <div className="font-bold text-foreground text-xs">{period.label}</div>
                          <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-primary/70" />
                            <span>{period.startTime} &ndash; {period.endTime}</span>
                          </div>
                        </td>

                        {/* Days Columns */}
                        {DAYS_OF_WEEK.map((day) => {
                          const lesson = findClassLessonInSlot(day.id, period);

                          if (lesson) {
                            return (
                              <td
                                key={`${day.id}-${period.period}`}
                                onClick={() => openEditLesson(lesson)}
                                className={`p-2 border-r align-top ${
                                  canManage ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : ""
                                }`}
                              >
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 shadow-2xs transition-all hover:bg-primary/10">
                                  <div className="font-semibold text-foreground text-xs truncate leading-snug">
                                    {lesson.subjectName}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate">
                                    <User className="h-2.5 w-2.5 shrink-0 text-muted-foreground/80" />
                                    <span className="truncate">{lesson.teacherName}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-0.5 font-mono">
                                    <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
                                    <span>{lesson.room}</span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={`${day.id}-${period.period}`}
                              className="p-2 border-r align-middle text-center text-muted-foreground/30 hover:bg-muted/20 transition-colors group"
                            >
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => openAddLesson(day.id, period.startTime, period.endTime)}
                                  className="h-full w-full py-3 rounded-md border border-dashed border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 flex items-center justify-center transition-all"
                                  title={`Add lesson for ${day.name} at ${period.startTime}`}
                                >
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                </button>
                              ) : (
                                <span className="text-[11px]">&ndash;</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Teacher Grid Matrix View */}
          {viewMode === "teacher-grid" && (
            <div className="overflow-x-auto">
              {!selectedTeacherId ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">Please select a teacher from the dropdown above.</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <th className="p-2.5 pl-4 border-r w-28 text-xs">Time & Period</th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th key={day.id} className="p-2.5 border-r min-w-[130px] font-bold text-foreground text-center">
                          <div>{day.name}</div>
                          <div className="text-[10px] font-normal text-muted-foreground">{day.short}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {STANDARD_PERIODS.map((period, pIdx) => {
                      if (period.isBreak) {
                        return (
                          <tr key={`tbreak-${pIdx}`} className="bg-muted/25 text-muted-foreground">
                            <td className="p-2 pl-4 border-r font-medium text-[11px]">
                              <div className="flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3 text-muted-foreground/60" />
                                <span>{period.startTime} - {period.endTime}</span>
                              </div>
                            </td>
                            <td colSpan={DAYS_OF_WEEK.length} className="p-2 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                              ☕ {period.label} ({period.startTime} &ndash; {period.endTime})
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={`tperiod-${period.period}`} className="hover:bg-muted/10 transition-colors">
                          <td className="p-2.5 pl-4 border-r bg-muted/10">
                            <div className="font-bold text-foreground text-xs">{period.label}</div>
                            <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5 text-primary/70" />
                              <span>{period.startTime} &ndash; {period.endTime}</span>
                            </div>
                          </td>

                          {DAYS_OF_WEEK.map((day) => {
                            const lesson = findTeacherLessonInSlot(day.id, period);

                            if (lesson) {
                              return (
                                <td key={`t-${day.id}-${period.period}`} className="p-2 border-r align-top">
                                  <div className="rounded-lg border border-accent/40 bg-accent/10 p-2 shadow-2xs">
                                    <div className="font-bold text-foreground text-xs truncate">
                                      {lesson.className}
                                    </div>
                                    <div className="text-[11px] font-medium text-foreground/90 mt-0.5 truncate">
                                      {lesson.subjectName}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 font-mono">
                                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                                      <span>{lesson.room}</span>
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={`t-${day.id}-${period.period}`} className="p-2 border-r align-middle text-center text-muted-foreground/30">
                                <span className="text-[11px]">Free</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 3. List Table View */}
          {viewMode === "list" && (
            <div className="p-4">
              {!schedule || schedule.lessons.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="font-medium text-foreground">No periods scheduled for this class yet.</p>
                  {canManage && (
                    <Button size="sm" onClick={() => openAddLesson()} className="mt-3 text-xs gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Schedule First Period
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Subject / Module</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Room</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.lessons.map((lesson) => (
                      <TableRow key={lesson.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-foreground text-xs">
                          {lesson.dayName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-primary" />
                            <span>{lesson.startTime} &ndash; {lesson.endTime}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-xs">
                          {lesson.subjectName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {lesson.teacherName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            <span>{lesson.room}</span>
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditLesson(lesson)}
                              className="h-7 px-2.5 text-xs"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Edit / Add Modal */}
      <LessonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLesson(null);
        }}
        initialData={editingLesson}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        modules={modules}
      />
    </div>
  );
}
