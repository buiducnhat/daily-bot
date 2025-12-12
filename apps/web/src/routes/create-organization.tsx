import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/create-organization")({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(name && slug)) {
      return;
    }

    setIsLoading(true);
    await authClient.organization.create({
      name,
      slug,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("Organization created successfully");
          navigate({ to: "/dashboard" });
        },
      },
    });
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
        <h1 className="mb-6 text-center font-bold text-2xl">
          Create Organization
        </h1>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block font-medium text-sm" htmlFor="name">
              Organization Name
            </label>
            <input
              className="w-full rounded border p-2"
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome team"
              required
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-sm" htmlFor="slug">
              Slug (URL friendly)
            </label>
            <input
              className="w-full rounded border p-2"
              id="slug"
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-awesome-team"
              required
              type="text"
              value={slug}
            />
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Creating..." : "Create Organization"}
          </Button>
        </form>
      </div>
    </div>
  );
}
