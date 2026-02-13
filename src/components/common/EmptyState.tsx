export function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center">
      <img
        src="/icons/empty-box.svg"
        alt=""
        className="mb-3 h-20 w-20 opacity-70"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
