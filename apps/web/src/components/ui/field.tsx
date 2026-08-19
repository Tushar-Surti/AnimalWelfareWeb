'use client';

import { forwardRef, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-body text-ink ' +
  'placeholder:text-ink-faint transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-blush focus:outline-none';

type FieldShell = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

function Shell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldShell & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block font-display text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-1 text-blush">*</span>}
        </label>
      )}
      {children}
      {/* Hint disappears once there is an error, so the two never stack and
          push the rest of a long form around. */}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm font-semibold text-critical-deep"
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="text-sm text-ink-soft">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, FieldShell & React.ComponentProps<'input'>>(
  function Input({ label, hint, error, className, required, ...props }, ref) {
    const auto = useId();
    const id = props.id ?? auto;
    return (
      <Shell id={id} label={label} hint={hint} error={error} required={required} className={className}>
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(control, error && 'border-critical focus:border-critical')}
          {...props}
        />
      </Shell>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, FieldShell & React.ComponentProps<'textarea'>>(
  function Textarea({ label, hint, error, className, required, ...props }, ref) {
    const auto = useId();
    const id = props.id ?? auto;
    return (
      <Shell id={id} label={label} hint={hint} error={error} required={required} className={className}>
        <textarea
          ref={ref}
          id={id}
          rows={props.rows ?? 4}
          aria-invalid={Boolean(error)}
          className={cn(control, 'resize-y min-h-28', error && 'border-critical focus:border-critical')}
          {...props}
        />
      </Shell>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, FieldShell & React.ComponentProps<'select'>>(
  function Select({ label, hint, error, className, required, children, ...props }, ref) {
    const auto = useId();
    const id = props.id ?? auto;
    return (
      <Shell id={id} label={label} hint={hint} error={error} required={required} className={className}>
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(control, 'appearance-none cursor-pointer pr-10', error && 'border-critical')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238A7268' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.9rem center',
          }}
          {...props}
        >
          {children}
        </select>
      </Shell>
    );
  },
);

/** Pill-shaped multi-select. Used for species filters, personality traits,
 *  "good with" — anywhere a row of checkboxes would look clinical. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = true,
  label,
}: {
  options: Array<{ value: T; label: string; emoji?: string }>;
  value: T[];
  onChange: (next: T[]) => void;
  multiple?: boolean;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <span className="block font-display text-sm font-semibold text-ink">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() =>
                onChange(
                  multiple
                    ? active
                      ? value.filter((v) => v !== option.value)
                      : [...value, option.value]
                    : active
                      ? []
                      : [option.value],
                )
              }
              aria-pressed={active}
              className={cn(
                'rounded-full border-2 px-4 py-2 text-sm font-display font-semibold transition-colors',
                active
                  ? 'border-blush-deep bg-blush text-white'
                  : 'border-line bg-paper text-ink-soft hover:border-blush hover:text-ink',
              )}
            >
              {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
