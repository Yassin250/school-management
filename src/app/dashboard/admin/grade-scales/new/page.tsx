import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GradeScaleForm } from "../grade-scale-form";

export const metadata = {
  title: "New Grade Scale - Admin",
};

export default async function NewGradeScalePage() {
  const user = await requireCurrentUser();

  const canCreate = user.permissions.has("grade_scales.create");
  if (!canCreate) redirect("/unauthorized");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          New Grade Scale
        </h1>
        <p className="text-sm text-muted-foreground">
          Define the grading bands used to convert report-card percentages into
          grades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scale Details</CardTitle>
          <CardDescription>
            Only one scale can be active per education area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GradeScaleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
