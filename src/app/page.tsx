import { redirect } from "next/navigation";

// Landing page is out of scope for the foundation pass — go straight to the app.
export default function Home() {
  redirect("/dashboard");
}
