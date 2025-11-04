// components/common/EmptyState.tsx
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center">
      <img
        src="/icons/empty-box.svg"
        alt="empty"
        className="mb-3 h-20 w-20 opacity-70"
      />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
