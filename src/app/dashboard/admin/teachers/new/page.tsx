import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { createTeacherAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Register New Teacher - Admin",
};

export default async function NewTeacherPage() {
  await requireCurrentUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/teachers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Register Faculty Member
          </h1>
          <p className="text-xs text-muted-foreground">
            Create a teacher profile and automatically provision login credentials.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teacher Information</CardTitle>
          <CardDescription>
            Enter qualification details and official contact information.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={createTeacherAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" required placeholder="e.g. Jean" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" required placeholder="e.g. Habimana" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sex">Sex *</Label>
                <select
                  id="sex"
                  name="sex"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" required placeholder="+250 788 123 456" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" required placeholder="teacher@school.rw" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qualification">Academic Qualification</Label>
                <Input id="qualification" name="qualification" placeholder="e.g. BSc Mathematics & Education" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nationalId">National ID (NIDA)</Label>
                <Input id="nationalId" name="nationalId" placeholder="16-digit Rwandan NID" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input id="hireDate" name="hireDate" type="date" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/dashboard/admin/teachers">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                Register Faculty Member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
