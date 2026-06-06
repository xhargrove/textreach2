import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 py-16">
        <div className="container-app max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: June 2026
          </p>

          <Card className="mt-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                This is a placeholder Privacy Policy page for TextReach. The
                full privacy policy will be added before public launch.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                1. Information We Collect
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We collect information you provide directly, including account
                details, contact lists, and message content necessary to provide
                our SMS services.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                2. How We Use Your Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We use your information to provide, maintain, and improve
                TextReach, process messages, and communicate with you about
                your account.
              </p>
              <h2 className="mt-6 text-lg font-semibold text-gray-900">
                3. Data Security
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We implement appropriate security measures to protect your
                personal information and contact data.
              </p>
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
