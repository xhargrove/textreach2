import { Button } from "@/components/ui/button";

export default function ContactNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Contact not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This contact may have been deleted or you don&apos;t have access.
      </p>
      <div className="mt-6">
        <Button href="/contacts">Back to Contacts</Button>
      </div>
    </div>
  );
}
