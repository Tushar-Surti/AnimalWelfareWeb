'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import type { StorageBucket } from '@aww/shared';
import { useUpload } from '@/hooks/use-upload';
import { cn } from '@/lib/utils';

export function PhotoUpload({
  bucket,
  value,
  onChange,
  max = 4,
  label = 'Photos',
  hint,
  error,
  required,
}: {
  bucket: StorageBucket;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploads, busy } = useUpload(bucket);
  const [dragging, setDragging] = useState(false);

  const full = value.length >= max;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - value.length;
    const urls = await upload(Array.from(files).slice(0, room));
    if (urls.length) onChange([...value, ...urls]);
    if (input.current) input.current.value = '';
  }

  const failed = uploads.filter((u) => u.error);

  return (
    <div className="space-y-2">
      <span className="block font-display text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-blush">*</span>}
        <span className="ml-2 font-normal text-ink-faint">
          {value.length}/{max}
        </span>
      </span>

      <div className="flex flex-wrap gap-3">
        <AnimatePresence mode="popLayout">
          {value.map((url, i) => (
            <motion.div
              key={url}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="relative size-24 overflow-hidden rounded-2xl border-2 border-line bg-cream-deep sm:size-28"
            >
              <Image src={url} alt={`Photo ${i + 1}`} fill sizes="112px" className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((u) => u !== url))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full border-2 border-ink/15 bg-paper/95 text-ink-soft backdrop-blur transition-colors hover:bg-critical hover:text-white"
              >
                <X className="size-3.5" />
              </button>
              {/* The first photo is the one that shows on cards and maps. */}
              {i === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[0.6rem] font-bold uppercase tracking-wide text-white">
                  Cover
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!full && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              'grid size-24 place-items-center rounded-2xl border-2 border-dashed transition-colors sm:size-28',
              dragging ? 'border-blush bg-blush-soft' : 'border-line-strong bg-paper hover:border-blush',
              error && 'border-critical',
            )}
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin text-ink-faint" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-ink-faint">
                <ImagePlus className="size-6" />
                <span className="text-xs font-semibold">Add</span>
              </span>
            )}
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {failed.map((f) => (
        <p key={f.id} className="text-sm font-semibold text-critical-deep">
          {f.name}: {f.error}
        </p>
      ))}
      {error && <p className="text-sm font-semibold text-critical-deep">{error}</p>}
      {hint && !error && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
