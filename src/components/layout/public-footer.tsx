import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container-app py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-brand-600">TextReach</p>
            <p className="mt-2 text-sm text-gray-500">
              Send text messages your customers actually see.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Product</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Legal</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Support</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:support@textreach.io"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  support@textreach.io
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} TextReach. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
