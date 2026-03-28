import { redirect } from "next/navigation";

// Root → redirect to landing
export default function Home() {
  redirect("/landing");
}
