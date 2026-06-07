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
          <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

          <Card className="mt-8 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                1. Information We Collect
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We collect account information (name, email), workspace data,
                contact phone numbers you upload, message content, delivery
                results, and billing details processed by Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                2. How We Use Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We use your data to operate TextReach: send and receive SMS,
                track delivery, manage opt-outs, process subscriptions, and
                provide support. We do not sell contact lists.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                3. SMS Data and Retention
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Message bodies, recipient lists, and compliance archives are
                stored to provide the service and support lawful messaging
                records. You can export or delete workspace data by contacting
                support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                4. Third-Party Services
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                TextReach uses Twilio for SMS delivery, Stripe for billing, and
                Clerk for authentication. Each provider has its own privacy
                policy governing how they handle data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                5. Security
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We use industry-standard practices including encrypted
                connections, workspace isolation, webhook signature verification,
                and access controls. No system is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">6. Contact</h2>
              <p className="mt-2 text-sm text-gray-600">
                Privacy questions: privacy@textreach.io
              </p>
            </section>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
