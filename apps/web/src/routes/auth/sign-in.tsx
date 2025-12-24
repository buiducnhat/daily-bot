import { createFileRoute } from "@tanstack/react-router";
import SignInForm from "@/components/auth/sign-in-form";

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <SignInForm />
    </div>
  );
}
