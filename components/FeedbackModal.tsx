'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  businessId?: string;
  onClose: () => void;
};

export default function FeedbackModal({ businessId, onClose }: Props) {
  const supabase = createClient();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleSubmit() {
    if (!note.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.from('feedback').insert({
      note: note.trim(),
      business_id: businessId ?? null,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError('Failed to save note. Please try again.');
      return;
    }
    setDone(true);
    timerRef.current = setTimeout(onClose, 1000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold text-gray-900 mb-1">Report scan issue</h2>
        <p className="text-sm text-gray-500 mb-4">
          Describe what went wrong — this helps you remember to improve it later.
        </p>
        {done ? (
          <p className="text-sm text-green-600 font-medium">Note saved.</p>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Phone number misread on dark background card"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
            />
            {submitError && (
              <p className="text-sm text-red-600 mb-3">{submitError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !note.trim()}
                className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save note'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
