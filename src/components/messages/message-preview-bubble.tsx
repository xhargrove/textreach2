type MessagePreviewBubbleProps = {
  body: string;
};

export function MessagePreviewBubble({ body }: MessagePreviewBubbleProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        Preview
      </p>
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
          {body.trim() ? (
            <p className="whitespace-pre-wrap break-words">{body}</p>
          ) : (
            <p className="text-brand-200">Your message will appear here…</p>
          )}
        </div>
      </div>
    </div>
  );
}
