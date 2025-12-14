import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/create-organization")({
  component: CreateOrganizationPage,
});

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required"),
});

function CreateOrganizationPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
    },

    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await authClient.organization.create({
        name: value.name,
        slug: value.slug,
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
    },
  });

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
        <h1 className="mb-6 text-center font-bold text-2xl">
          Create Organization
        </h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => (
                <Field
                  data-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                >
                  <FieldLabel htmlFor={field.name}>
                    Organization Name
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="My awesome team"
                    value={field.state.value}
                  />
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              )}
            </form.Field>
            <form.Field name="slug">
              {(field) => (
                <Field
                  data-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                >
                  <FieldLabel htmlFor={field.name}>
                    Slug (URL friendly)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="my-awesome-team"
                    value={field.state.value}
                  />
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button disabled={!canSubmit} type="submit">
                {isSubmitting ? "Creating..." : "Create Organization"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
