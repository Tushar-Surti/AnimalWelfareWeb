'use client';

import { useCallback, useState } from 'react';
import type { StorageBucket, UploadTicket } from '@aww/shared';
import { MAX_UPLOAD_BYTES, ACCEPTED_IMAGE_TYPES } from '@aww/shared';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useSession } from './use-session';

export type UploadState = { id: string; name: string; progress: number; url?: string; error?: string };

/**
 * Two-step upload: ask the API to sign a path, then send the bytes straight to
 * Supabase Storage. Nothing large ever touches the Render instance.
 */
export function useUpload(bucket: StorageBucket) {
  const { token } = useSession();
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const upload = useCallback(
    async (files: File[]): Promise<string[]> => {
      const accepted: File[] = [];
      const rejected: UploadState[] = [];

      for (const file of files) {
        const id = crypto.randomUUID();
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
          rejected.push({ id, name: file.name, progress: 0, error: 'That file type is not a photo we can read.' });
        } else if (file.size > MAX_UPLOAD_BYTES) {
          rejected.push({ id, name: file.name, progress: 0, error: 'That photo is over 8MB. Try a smaller one.' });
        } else {
          accepted.push(file);
        }
      }

      setUploads((prev) => [
        ...prev,
        ...rejected,
        ...accepted.map((f) => ({ id: f.name + f.size, name: f.name, progress: 0 })),
      ]);

      const urls = await Promise.all(
        accepted.map(async (file) => {
          const key = file.name + file.size;
          try {
            const ticket = await api.post<UploadTicket>(
              '/api/uploads/sign',
              { bucket, contentType: file.type, filename: file.name },
              { token },
            );

            setUploads((prev) => prev.map((u) => (u.id === key ? { ...u, progress: 35 } : u)));

            const { error } = await supabase()
              .storage.from(bucket)
              .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
            if (error) throw new Error(error.message);

            setUploads((prev) =>
              prev.map((u) => (u.id === key ? { ...u, progress: 100, url: ticket.publicUrl } : u)),
            );
            return ticket.publicUrl;
          } catch (error) {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === key ? { ...u, progress: 0, error: (error as Error).message || 'Upload failed.' } : u,
              ),
            );
            return null;
          }
        }),
      );

      return urls.filter((u): u is string => Boolean(u));
    },
    [bucket, token],
  );

  const remove = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const reset = useCallback(() => setUploads([]), []);

  return { upload, uploads, remove, reset, busy: uploads.some((u) => u.progress > 0 && u.progress < 100) };
}
