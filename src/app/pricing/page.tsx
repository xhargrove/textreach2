import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLAN_CONFIG, PLAN_ORDER } from "@/lib/billing/plans";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 py-16 sm:py-24">
        <div className="container-app">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Start free and upgrade as you grow. No hidden fees or complicated
              tiers.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {PLAN_ORDER.map((planKey) => {
              const plan = PLAN_CONFIG[planKey];
              return (
                <Card
                  key={planKey}
                  className={
                    plan.highlighted
                      ? "relative border-brand-500 ring-2 ring-brand-500"
                      : ""
                  }
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="mt-0.5 text-brand-600">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button
                      href="/sign-up"
                      variant={plan.highlighted ? "primary" : "secondary"}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            All plans include compliance tools and delivery tracking. Sign up
            free, then subscribe on the Billing page.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
