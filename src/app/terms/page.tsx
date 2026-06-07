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
          <p className="mt-2 text-sm text-gray-500">Last updated: June 2026</p>

          <Card className="mt-8 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                By creating an account or using TextReach, you agree to these
                Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                2. SMS and TCPA Compliance
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You are solely responsible for complying with the Telephone
                Consumer Protection Act (TCPA), carrier rules, and all applicable
                SMS laws. You must obtain express consent before texting
                contacts, honor STOP and HELP requests promptly, and only send
                messages recipients agreed to receive.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                3. Acceptable Use
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You may not use TextReach to send spam, unlawful content,
                harassing messages, or messages without proper consent. We may
                suspend accounts that violate these rules or carrier policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                4. Billing and Plans
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Paid plans renew monthly through Stripe unless canceled. Message
                and contact limits apply per plan. Twilio message fees are
                separate and billed by Twilio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                5. Limitation of Liability
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                TextReach is provided as-is. We are not liable for delivery
                failures, carrier filtering, compliance fines, or damages arising
                from your messaging program.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">6. Contact</h2>
              <p className="mt-2 text-sm text-gray-600">
                Questions about these terms: support@textreach.io
              </p>
            </section>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
