import Link from "next/link";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";

type Props = {
  table: "teacher" | "student" | "parent" | "class" | "subject" | "exam" | "event" | "announcement";
  type: "create" | "update" | "delete" | "view";
  id?: string | number;
};

export default function FormContainer({ table, type, id }: Props) {
  if (type === "delete") {
    return (
      <button className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors">
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    );
  }

  if (type === "create") {
    return (
      <Link
        href={`/dashboard/admin/list/${table}s/new`}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <Plus className="w-4 h-4 text-blue-600" />
      </Link>
    );
  }

  if (type === "view") {
    return (
      <Link
        href={`/dashboard/admin/list/${table}s/${id}`}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-50 hover:bg-sky-100 transition-colors"
      >
        <Eye className="w-4 h-4 text-sky-600" />
      </Link>
    );
  }

  if (type === "update") {
    return (
      <Link
        href={`/dashboard/admin/list/${table}s/${id}/edit`}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 transition-colors"
      >
        <Pencil className="w-4 h-4 text-green-600" />
      </Link>
    );
  }

  return null;
}