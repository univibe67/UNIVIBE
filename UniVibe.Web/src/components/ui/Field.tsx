import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { controlClass } from "./fieldStyles";

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  counter?: { value: number; max: number };
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  counter,
  className = "",
  children,
}: FieldProps) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-700">
          {label}
          {required && (
            <span className="ml-0.5 text-coral-600" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {counter && (
          <span className="text-xs text-ink-500 tabular-nums">
            {counter.value}/{counter.max}
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-coral-700">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-ink-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`h-11 px-3.5 ${controlClass} ${className}`} {...props} />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`resize-y px-3.5 py-3 leading-relaxed ${controlClass} ${className}`}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export function Select({
  className = "h-11",
  wrapperClassName = "block",
  children,
  ...props
}: SelectProps) {
  return (
    <span className={`relative ${wrapperClassName}`}>
      <select
        className={`appearance-none pr-10 pl-3.5 ${controlClass} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
    </span>
  );
}

export function SearchInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={`relative block ${className}`}>
      <Search
        size={17}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        className={`h-11 pr-3.5 pl-10 ${controlClass}`}
        {...props}
      />
    </span>
  );
}
