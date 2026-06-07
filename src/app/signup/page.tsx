import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign up",
};

export default function SignupRedirectPage() {
  redirect("/sign-up");
}
