import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { getGradeScale } from "@/lib/services/grades/grade-scales";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeScaleForm, type BandRow } from "../grade-scale-form";

export const metadata = {
  title: "Edit Grade Scale - Admin",
};

export default async function EditGradeScalePage({
  params,
}: {
  params: Promise<{ scaleId: string }>;
}) {
  const { scaleId } = await params;
  const user = await requireCurrentUser();

  const canRead = user.permissions.has("grade_scales.read");
  if (!canRead) redirect("/unauthorized");

  let scale;
  try {
    scale = await getGradeScale(user, scaleId);
  } catch {
    notFound();
  }

  const bands: BandRow[] = scale.bands.map((band) => ({
    minScore: band.minScore,
    maxScore: band.maxScore,
    symbol: band.symbol,
    description: band.description ?? "",
    points: band.points ?? "",
    isPass: band.isPass,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {scale.name}
          </h1>
          <Badge variant={scale.isActive ? "success" : "secondary"}>
            {scale.isActive ? "Active" : "Archived"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {scale.educationArea} education ·{" "}
          <Link href="/dashboard/admin/grade-scales" className="hover:underline">
            back to all scales
          </Link>
        </p>
      </div>

      {scale.reportCardCount > 0 && (
        <div
          role="status"
          className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          This scale has produced {scale.reportCardCount} report card
          {scale.reportCardCount === 1 ? "" : "s"}. Existing report cards keep
          the grades they were generated with; changing bands only affects cards
          generated from now on.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scale Details</CardTitle>
          <CardDescription>
            Bands must cover 0–100 with no overlaps. Changes are applied
            atomically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GradeScaleForm
            mode="edit"
            scaleId={scale.id}
            initialName={scale.name}
            initialDescription={scale.description ?? ""}
            initialArea={scale.educationArea}
            initialBands={bands}
            protectedSymbols={scale.usedSymbols}
          />
        </CardContent>
      </Card>
    </div>
  );
}
