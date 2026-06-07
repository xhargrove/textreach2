import { Alert } from "@/components/ui/alert";

type FormActionErrorProps = {
  error?: string | null;
  className?: string;
};

export function FormActionError({ error, className }: FormActionErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="error" className={className}>
      {error}
    </Alert>
  );
}
