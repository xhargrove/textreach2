import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Build your contact list",
    description:
      "Import contacts or let people join by texting a keyword. Organize them into lists that make sense for your business.",
  },
  {
    title: "Send event updates and reminders",
    description:
      "Reach your audience instantly with event reminders, promotions, and announcements they'll actually read.",
  },
  {
    title: "Schedule messages ahead of time",
    description:
      "Write your message now and schedule it for later. Perfect for event reminders and timed promotions.",
  },
  {
    title: "See replies and results",
    description:
      "Track delivery, replies, and link clicks in one simple dashboard. Know what's working.",
  },
  {
    title: "Stay compliant with opt-outs",
    description:
      "Automatic STOP handling keeps you compliant. Manage opt-outs and respect your audience's preferences.",
  },
];

const useCases = [
  {
    title: "Events",
    description: "Send reminders, updates, and last-minute changes to attendees.",
  },
  {
    title: "Restaurants",
    description: "Promote specials, announce new menus, and fill slow nights.",
  },
  {
    title: "DJs & Artists",
    description: "Build your fan list and announce shows, drops, and ticket links.",
  },
  {
    title: "Churches",
    description: "Send service reminders, prayer requests, and community updates.",
  },
  {
    title: "Local Businesses",
    description: "Reach loyal customers with offers they'll actually see.",
  },
  {
    title: "Community Groups",
    description: "Keep members informed with simple, direct text updates.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-brand-50 to-white py-16 sm:py-24">
          <div className="container-app text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Send text messages your customers actually see.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
              TextReach helps you build lists, send event updates, schedule
              reminders, and track replies without complicated marketing
              software.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href="/signup" size="lg">
                Start Free
              </Button>
              <Button href="/dashboard" variant="secondary" size="lg">
                View Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="container-app">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Simple texting for real businesses
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Everything you need to reach your audience — without the
                complexity.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="container-app">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Built for how you work
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Whether you run events, a restaurant, or a local brand —
                TextReach fits your workflow.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase) => (
                <Card key={useCase.title}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {useCase.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <div className="container-app">
            <div className="rounded-2xl bg-brand-600 px-6 py-12 text-center sm:px-12 sm:py-16">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to reach your audience?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
                Start sending text messages in minutes. No complicated setup
                required.
              </p>
              <div className="mt-8">
                <Button
                  href="/signup"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50"
                >
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
