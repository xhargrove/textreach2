import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  createdAt: Date;
};

type InboxThreadProps = {
  messages: ThreadMessage[];
};

export function InboxThread({ messages }: InboxThreadProps) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No messages in this conversation yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message) => {
        const isOutbound = message.direction === "outbound";

        return (
          <div
            key={message.id}
            className={cn("flex", isOutbound ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                isOutbound
                  ? "rounded-br-md bg-brand-600 text-white"
                  : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  isOutbound ? "text-brand-200" : "text-gray-400"
                )}
              >
                {formatDateTime(message.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
