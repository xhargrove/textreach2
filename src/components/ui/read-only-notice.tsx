type ReadOnlyNoticeProps = {
  message?: string;
};

export function ReadOnlyNotice({
  message = "You can view this page, but your role cannot make changes here. Contact your workspace owner if you need edit access.",
}: ReadOnlyNoticeProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
      {message}
    </div>
  );
}
