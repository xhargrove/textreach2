import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 py-16">
        <div className="container-app max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: June 2026
          </p>

          <Card className="mt-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                This is a placeholder Terms of Service page for TextReach. The
                full legal terms will be added before public launch.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                By accessing or using TextReach, you agree to be bound by these
                Terms of Service and all applicable laws and regulations.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                2. SMS Compliance
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Users are responsible for complying with all applicable SMS
                regulations, including obtaining proper consent before sending
                messages and honoring opt-out requests.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                3. Acceptable Use
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You may not use TextReach to send spam, harassing messages, or
                any content that violates applicable laws.
              </p>
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
