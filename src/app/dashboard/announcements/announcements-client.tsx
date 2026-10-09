"use client";

import { useState, useTransition, useOptimistic, useRef } from "react";
import {
  saveAnnouncementAction,
  publishAnnouncementAction,
  deleteAnnouncementAction,
} from "./actions";
import type { AnnouncementListItem } from "@/lib/services/announcements/announcements";
import type { AnnouncementAudience } from "@prisma/client";

// ─── Icons (inline SVG paths) ─────────────────────────────────────────────────

const ICONS = {
  plus: "M12 5v14M5 12h14",
  pin: "M12 17v5M5 11l7-7 7 7M5 11v8a1 1 0 0 0 1 1h4M19 11v8a1 1 0 0 0-1 1h-4",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c-2.5 2.5-4 5.7-4 10s1.5 7.5 4 10M12 2c2.5 2.5 4 5.7 4 10s-1.5 7.5-4 10",
  send: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  megaphone: "m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
};

// ─── Audience config ─────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; color: string; description: string }[] = [
  { value: "ALL", label: "Everyone", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20", description: "All users in the system" },
  { value: "STUDENTS", label: "Students", color: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20", description: "All active students" },
  { value: "PARENTS", label: "Parents", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", description: "All parents/guardians" },
  { value: "TEACHERS", label: "Teachers", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20", description: "All active teachers" },
  { value: "STAFF", label: "Staff", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20", description: "All admin and staff" },
  { value: "CLASS", label: "Single Class", color: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20", description: "Target one class specifically" },
];

function audienceConfig(a: AnnouncementAudience) {
  return AUDIENCE_OPTIONS.find((o) => o.value === a) ?? AUDIENCE_OPTIONS[0];
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(date: Date | string | null): string {
  if (!date) return "Draft";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Announcement Card ────────────────────────────────────────────────────────

interface CardProps {
  item: AnnouncementListItem;
  actorId: string;
  isStaffAdmin: boolean;
  onEdit: (item: AnnouncementListItem) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

function AnnouncementCard({ item, actorId, isStaffAdmin, onEdit, onPublish, onDelete, isPending }: CardProps) {
  const cfg = audienceConfig(item.audience);
  const isDraft = !item.publishedAt;
  const isOwner = item.authorId === actorId;
  const canManage = isStaffAdmin || isOwner;

  return (
    <article
      className={`group relative rounded-xl border transition-all duration-200 overflow-hidden
        ${isDraft
          ? "border-border/50 bg-muted/20 opacity-80 hover:opacity-100"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md"
        }
        ${item.isPinned ? "ring-1 ring-primary/20" : ""}
      `}
    >
      {/* Pinned stripe */}
      {item.isPinned && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-xl" />
      )}

      <div className="p-4 sm:p-5">
        {/* Top row: audience badge + date + pin */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>

          {item.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5">
                <path d={ICONS.pin} />
              </svg>
              Pinned
            </span>
          )}

          {isDraft && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Draft
            </span>
          )}

          <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d={ICONS.clock} />
            </svg>
            {relativeTime(item.publishedAt ?? item.createdAt)}
          </span>
        </div>

        {/* Title & Body */}
        <h3 className="text-sm font-semibold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-line">
          {item.body}
        </p>

        {/* Footer: author + class + actions */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground">
            by <span className="font-medium text-foreground">{item.authorName}</span>
            {item.className && (
              <> &bull; <span className="font-medium">{item.className}</span></>
            )}
          </span>

          {/* Actions */}
          {canManage && (
            <div className="ml-auto flex items-center gap-1.5">
              {isDraft && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onPublish(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 text-[11px] font-semibold text-primary transition-all disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d={ICONS.send} />
                  </svg>
                  Publish
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1 rounded-lg border border-border hover:bg-muted px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d={ICONS.edit} />
                </svg>
                Edit
              </button>

              {(isStaffAdmin || isOwner) && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDelete(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 hover:bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive/80 hover:text-destructive transition-all disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d={ICONS.trash} />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Compose / Edit Modal ─────────────────────────────────────────────────────

interface ModalProps {
  editing: AnnouncementListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function ComposeModal({ editing, onClose, onSaved }: ModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnnouncementAudience>(
    editing?.audience ?? "ALL"
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("audience", audience);

    startTransition(async () => {
      const result = await saveAnnouncementAction(null, fd);
      if (result.error) {
        setError(result.error);
      } else {
        onSaved();
        onClose();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d={ICONS.megaphone} />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {editing ? "Edit Announcement" : "New Announcement"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d={ICONS.x} />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Title *
            </label>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={editing?.title}
              placeholder="e.g. End of Term Exam Schedule"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Message *
            </label>
            <textarea
              name="body"
              required
              rows={5}
              defaultValue={editing?.body}
              placeholder="Write your announcement here..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Audience Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Target Audience *
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudience(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    audience === opt.value
                      ? `${opt.color} ring-1 ring-current/30 font-semibold`
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="text-[11px] font-semibold">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="isPinned"
                defaultChecked={editing?.isPinned}
                className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Pin this announcement
              </span>
            </label>

            {!editing && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="publishImmediately"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Publish immediately
                </span>
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60 shadow-sm"
            >
              {isPending ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d={ICONS.check} />
                  </svg>
                  {editing ? "Save changes" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

interface Props {
  initialAnnouncements: AnnouncementListItem[];
  canCreate: boolean;
  isStaffAdmin: boolean;
  actorId: string;
}

type FilterTab = "all" | "published" | "drafts" | "pinned";

export function AnnouncementsClient({
  initialAnnouncements,
  canCreate,
  isStaffAdmin,
  actorId,
}: Props) {
  const [announcements, setAnnouncements] = useOptimistic(initialAnnouncements);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementListItem | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementAudience | "ALL_TYPES">("ALL_TYPES");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Filtered list ──
  const filtered = announcements.filter((a) => {
    if (filter === "published" && !a.publishedAt) return false;
    if (filter === "drafts" && a.publishedAt) return false;
    if (filter === "pinned" && !a.isPinned) return false;
    if (audienceFilter !== "ALL_TYPES" && a.audience !== audienceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: announcements.length,
    published: announcements.filter((a) => a.publishedAt).length,
    drafts: announcements.filter((a) => !a.publishedAt).length,
    pinned: announcements.filter((a) => a.isPinned).length,
  };

  // ── Actions ──
  const handlePublish = (id: string) => {
    startTransition(async () => {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, publishedAt: new Date() } : a
        )
      );
      await publishAnnouncementAction(id);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    startTransition(async () => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      await deleteAnnouncementAction(id);
    });
  };

  const openEdit = (item: AnnouncementListItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSaved = () => {
    // The modal closed + revalidatePath from server action refreshes the page
    // The optimistic update + RSC revalidation keeps UI snappy
  };

  return (
    <>
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search announcements…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>

        {/* Audience filter */}
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value as AnnouncementAudience | "ALL_TYPES")}
          className="rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-xs font-medium text-foreground focus:border-primary focus:outline-none transition-colors cursor-pointer"
        >
          <option value="ALL_TYPES">All audiences</option>
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Create button */}
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d={ICONS.plus} />
            </svg>
            New Announcement
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0 -mb-1 overflow-x-auto">
        {(["all", "published", "drafts", "pinned"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap pb-2.5 pt-1 px-3 text-xs font-medium capitalize transition-colors ${
              filter === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              filter === tab
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {counts[tab]}
            </span>
            {filter === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 opacity-60">
              <path d={ICONS.megaphone} />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {searchQuery
              ? "No announcements match your search."
              : filter === "drafts"
              ? "No draft announcements."
              : filter === "pinned"
              ? "No pinned announcements."
              : "No announcements yet."}
          </p>
          {canCreate && !searchQuery && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d={ICONS.plus} />
              </svg>
              Create the first announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              actorId={actorId}
              isStaffAdmin={isStaffAdmin}
              onEdit={openEdit}
              onPublish={handlePublish}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Compose/Edit Modal */}
      {modalOpen && (
        <ComposeModal
          editing={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
