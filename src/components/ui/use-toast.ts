// Simple toast implementation
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function toast(props: ToastProps) {
  // Simple alert-based toast for now
  if (props.variant === "destructive") {
    alert(`Error: ${props.title}\n${props.description}`);
  } else {
    alert(`${props.title}\n${props.description}`);
  }
}

export function useToast() {
  return { toast };
}
