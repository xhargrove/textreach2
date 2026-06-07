import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign in",
};

export default function LoginRedirectPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.error) params.set("error", searchParams.error);
  if (searchParams.redirect) params.set("redirect", searchParams.redirect);
  const query = params.toString();
  redirect(query ? `/sign-in?${query}` : "/sign-in");
}
