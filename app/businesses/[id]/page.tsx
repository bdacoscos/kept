'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CardImageViewer from '@/components/CardImageViewer';
import FlagButton from '@/components/FlagButton';
import FeedbackModal from '@/components/FeedbackModal';
import type { Business } from '@/types';

function serializeSocialHandles(handles: Record<string, string>): string {
  return Object.entries(handles)
    .map(([p, h]) => `${p}: ${h}`)
    .join('\n');
}

function deserializeSocialHandles(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const platform = line.slice(0, colon).trim().toLowerCase();
    const handle = line.slice(colon + 1).trim();
    if (platform && handle) result[platform] = handle;
  }
  return result;
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [business, setBusiness] = useState<Business | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Business>>({});
  const [saving, setSaving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [socialHandlesText, setSocialHandlesText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadError('Business not found.');
          return;
        }
        setBusiness(data as Business);
        setForm(data as Business);
        setSocialHandlesText(serializeSocialHandles((data as Business).social_handles ?? {}));
      });
  }, [id]);

  function updateForm(field: keyof Business, value: string | boolean | Record<string, string>) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { data, error } = await supabase
      .from('businesses')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[detail save]', error);
      setSaveError('Save failed. Please try again.');
      setSaving(false);
      return;
    }
    if (data) {
      setBusiness(data as Business);
      setForm(data as Business);
    }
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this business? This cannot be undone.')) return;
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) {
      console.error('[delete]', error);
      alert('Delete failed. Please try again.');
      return;
    }
    router.push('/');
  }

  if (loadError) {
    return <p className="text-red-500 text-sm">{loadError}</p>;
  }

  if (!business) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  const fields: { label: string; key: keyof Business; type?: string }[] = [
    { label: 'Business Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Website', key: 'website' },
    { label: 'Category', key: 'category' },
    { label: 'Where I Met Them', key: 'met_at' },
    { label: 'Notes', key: 'notes', type: 'textarea' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {business.name ?? 'Unnamed business'}
          </h1>
          {business.category && (
            <p className="text-gray-500 text-sm mt-0.5">{business.category}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {business.card_image_url && (
        <div className="mb-6">
          <CardImageViewer src={business.card_image_url} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
        {fields.map(({ label, key, type }) => (
          <div key={key}>
            <label
              htmlFor={`field-${key}`}
              className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide"
            >
              {label}
            </label>
            {editing ? (
              type === 'textarea' ? (
                <textarea
                  id={`field-${key}`}
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => updateForm(key, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              ) : (
                <input
                  id={`field-${key}`}
                  type="text"
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => updateForm(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              )
            ) : (
              <p className="text-sm text-gray-800">
                {(business[key] as string) || (
                  <span className="text-gray-300">—</span>
                )}
              </p>
            )}
          </div>
        ))}
        <div>
          <label
            htmlFor="field-social-handles"
            className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide"
          >
            Social Handles
          </label>
          {editing ? (
            <>
              <textarea
                id="field-social-handles"
                value={socialHandlesText}
                onChange={(e) => {
                  setSocialHandlesText(e.target.value);
                  updateForm('social_handles', deserializeSocialHandles(e.target.value));
                }}
                rows={2}
                placeholder={"instagram: @handle\ntiktok: @handle"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">One per line: platform: @handle</p>
            </>
          ) : (
            <p className="text-sm text-gray-800">
              {Object.keys(business.social_handles ?? {}).length > 0
                ? serializeSocialHandles(business.social_handles)
                : <span className="text-gray-300">—</span>}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <FlagButton
          flagged={editing ? (form.needs_review ?? false) : business.needs_review}
          onChange={(v) => {
            if (editing) {
              updateForm('needs_review', v);
            } else {
              supabase
                .from('businesses')
                .update({ needs_review: v })
                .eq('id', id)
                .then(({ error }) => {
                  if (error) console.error('[flag toggle]', error);
                  else setBusiness((prev) => prev ? { ...prev, needs_review: v } : prev);
                });
            }
          }}
        />
        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Report scan issue
        </button>
      </div>

      {saveError && (
        <p className="text-sm text-red-600 mb-3">{saveError}</p>
      )}

      {editing && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setForm(business);
              setSocialHandlesText(serializeSocialHandles(business.social_handles ?? {}));
              setEditing(false);
            }}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}

      {showFeedback && (
        <FeedbackModal
          businessId={business.id}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
