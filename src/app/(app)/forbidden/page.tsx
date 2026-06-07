import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Access denied",
};

export default function ForbiddenPage() {
  return (
    <>
      <PageHeader
        title="Access denied"
        description="You do not have permission to access this page."
      />

      <Card>
        <p className="text-sm text-gray-700">
          You do not have permission to access this page. Contact your workspace
          owner if you need access.
        </p>
        <div className="mt-4">
          <Button href="/dashboard" variant="secondary" size="sm">
            Back to dashboard
          </Button>
        </div>
      </Card>
    </>
  );
}
