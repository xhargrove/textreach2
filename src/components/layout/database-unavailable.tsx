import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export function DatabaseUnavailable() {
  return (
    <div className="container-app max-w-2xl py-16">
      <Card className="space-y-4">
        <Alert variant="error" title="Database not connected">
          <p>
            TextReach cannot reach the production database. Add a Postgres
            connection (Neon via Vercel Storage is recommended), run{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
              npx prisma migrate deploy
            </code>
            , then redeploy.
          </p>
        </Alert>
        <p className="text-sm text-gray-600">
          Check{" "}
          <a href="/api/health" className="font-medium text-brand-600">
            /api/health
          </a>{" "}
          — it should return <code>{`{"ok":true}`}</code> when the database is
          ready.
        </p>
      </Card>
    </div>
  );
}
