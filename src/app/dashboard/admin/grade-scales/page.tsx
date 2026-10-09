import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { listGradeScales } from "@/lib/services/grades/grade-scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Scale } from "lucide-react";
import { ScaleActionsButton } from "./archive-button";
export const metadata = {
  title: "Grade Scales - Admin",
};

export default async function GradeScalesAdminPage() {
  const user = await requireCurrentUser();

  const canRead = user.permissions.has("grade_scales.read");
  if (!canRead) redirect("/unauthorized");

  const scales = await listGradeScales(user);

  const activeCount = scales.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Grade Scales
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the grading bands used to convert report-card percentages
            into grades. Exactly one scale may be active per education area.
          </p>
        </div>

        <Link href="/dashboard/admin/grade-scales/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Grade Scale</span>
          </Button>
        </Link>
      </div>

      {activeCount === 0 && scales.length > 0 && (
        <div
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          No scale is active. Report cards cannot be generated until an active
          scale exists for the education area you need.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Configured Scales</CardTitle>
          <CardDescription>
            {scales.length} scale{scales.length === 1 ? "" : "s"} ·{" "}
            {activeCount} active
          </CardDescription>
        </CardHeader>

        <CardContent>
          {scales.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Scale className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>No grade scales configured yet.</p>
              <Link href="/dashboard/admin/grade-scales/new" className="mt-3 inline-block">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Create First Scale</span>
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Education Area</TableHead>
                  <TableHead>Bands</TableHead>
                  <TableHead>Report Cards</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scales.map((scale) => (
                  <TableRow key={scale.id}>
                    <TableCell className="font-medium text-foreground">
                      <Link
                        href={`/dashboard/admin/grade-scales/${scale.id}`}
                        className="hover:underline"
                      >
                        {scale.name}
                      </Link>
                      {scale.description && (
                        <div className="text-xs text-muted-foreground">
                          {scale.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={scale.educationArea === "TVET" ? "secondary" : "outline"}>
                        {scale.educationArea}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {scale.bandCount}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {scale.reportCardCount > 0 ? (
                        <span title="Report cards generated with this scale">
                          {scale.reportCardCount}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={scale.isActive ? "success" : "secondary"}>
                        {scale.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/admin/grade-scales/${scale.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <ScaleActionsButton
                          scaleId={scale.id}
                          scaleName={scale.name}
                          isActive={scale.isActive}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
