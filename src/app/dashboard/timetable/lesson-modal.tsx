"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { saveLessonAction, deleteLessonAction } from "./actions";
import { DAYS_OF_WEEK, STANDARD_PERIODS } from "@/lib/services/timetable/types";

export interface LessonModalData {
  id?: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId?: string | null;
  moduleId?: string | null;
  room?: string | null;
}

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LessonModalData | null;
  classes: Array<{
    id: string;
    name: string;
    levelName: string;
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
  onSuccess?: () => void;
}

export function LessonModal({
  isOpen,
  onClose,
  initialData,
  classes,
  teachers,
  subjects,
  modules,
  onSuccess,
}: LessonModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [classId, setClassId] = useState(initialData?.classId ?? classes[0]?.id ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek ?? 1);
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "08:45");
  const [teacherId, setTeacherId] = useState(initialData?.teacherId ?? teachers[0]?.id ?? "");
  const [itemType, setItemType] = useState<"subject" | "module">(
    initialData?.moduleId ? "module" : "subject",
  );
  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [moduleId, setModuleId] = useState(initialData?.moduleId ?? "");
  const [room, setRoom] = useState(initialData?.room ?? "");

  const selectedClass = classes.find((c) => c.id === classId);
  const classSubjects = selectedClass?.availableSubjects.length ? selectedClass.availableSubjects : subjects;
  const classModules = selectedClass?.availableModules.length ? selectedClass.availableModules : modules;

  const isEditing = Boolean(initialData?.id);

  const applyStandardPeriod = (periodNum: number) => {
    const period = STANDARD_PERIODS.find((p) => p.period === periodNum);
    if (period) {
      setStartTime(period.startTime);
      setEndTime(period.endTime);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (initialData?.id) formData.set("lessonId", initialData.id);
    formData.set("classId", classId);
    formData.set("dayOfWeek", String(dayOfWeek));
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    formData.set("teacherId", teacherId);
    if (itemType === "subject" && subjectId) formData.set("subjectId", subjectId);
    if (itemType === "module" && moduleId) formData.set("moduleId", moduleId);
    if (room) formData.set("room", room);

    startTransition(async () => {
      const res = await saveLessonAction(null, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        onSuccess?.();
        onClose();
      }
    });
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to remove this scheduled lesson?")) return;

    startDeleteTransition(async () => {
      const res = await deleteLessonAction(initialData.id!);
      if (res?.error) {
        setError(res.error);
      } else {
        onSuccess?.();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold">
              {isEditing ? "Edit Scheduled Lesson" : "Schedule New Lesson Period"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign period, instructor, and classroom with conflict detection.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Class */}
          <div>
            <Label htmlFor="classId" className="text-xs font-semibold">
              Class <span className="text-destructive">*</span>
            </Label>
            <select
              id="classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.levelName})
                </option>
              ))}
            </select>
          </div>

          {/* Day & Standard Preset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dayOfWeek" className="text-xs font-semibold">
                Day of Week <span className="text-destructive">*</span>
              </Label>
              <select
                id="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                required
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Standard Period Preset</Label>
              <select
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) applyStandardPeriod(val);
                }}
                defaultValue=""
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Custom Time Range</option>
                {STANDARD_PERIODS.filter((p) => !p.isBreak).map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.label} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime" className="text-xs font-semibold">
                Start Time (HH:mm) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="mt-1 h-9 font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-xs font-semibold">
                End Time (HH:mm) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1 h-9 font-mono text-sm"
              />
            </div>
          </div>

          {/* Subject / Module Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold">Curriculum Content</Label>
              <div className="flex rounded-md border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setItemType("subject");
                    setModuleId("");
                  }}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                    itemType === "subject"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  General Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemType("module");
                    setSubjectId("");
                  }}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                    itemType === "module"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  TVET Module
                </button>
              </div>
            </div>

            {itemType === "subject" ? (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select Subject (or General Study)</option>
                {classSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select TVET Module</option>
                {classModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Instructor / Teacher */}
          <div>
            <Label htmlFor="teacherId" className="text-xs font-semibold">
              Instructor / Teacher <span className="text-destructive">*</span>
            </Label>
            <select
              id="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.staffCode})
                </option>
              ))}
            </select>
          </div>

          {/* Room / Location */}
          <div>
            <Label htmlFor="room" className="text-xs font-semibold">
              Room / Laboratory (Optional)
            </Label>
            <Input
              id="room"
              placeholder="e.g. Science Lab 1, Room 204, Computer Lab"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t pt-4 mt-6">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isPending}
                className="gap-1.5"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Period
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || isDeleting} className="gap-1.5">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Schedule Period"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
