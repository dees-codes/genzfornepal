export function LoadingSpinner({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4">
        <LoadingSpinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
