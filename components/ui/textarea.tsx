import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function Textarea({ className = "", error, ...props }: TextareaProps) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
        error
          ? "border-red-500 focus-visible:ring-red-400"
          : "border-zinc-300 dark:border-zinc-700"
      } ${className}`}
      {...props}
    />
  );
}
