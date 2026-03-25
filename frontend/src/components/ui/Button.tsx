import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ children, className = "", ...props }: Props) {
  return (
    <button
      className={`rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}