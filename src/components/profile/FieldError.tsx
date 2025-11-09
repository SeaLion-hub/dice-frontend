type FieldErrorProps = {
  message?: string;
  className?: string;
};

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className={className ?? "text-xs text-red-600"}>
      {message}
    </p>
  );
}
