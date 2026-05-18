'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  isLowConfidence,
  shouldAutoFlag,
  getConfidenceScores,
} from '@/lib/confidence';
import CardImageViewer from '@/components/CardImageViewer';
import ConfidenceField from '@/components/ConfidenceField';
import FlagButton from '@/components/FlagButton';
import FeedbackModal from '@/components/FeedbackModal';
import type { ScanResult, BusinessFormData } from '@/types';
import { EMPTY_FORM_DATA as EMPTY } from '@/types';

type Step = 'entry' | 'review';

function serializeSocialHandles(handles: Record<string, string>): string {
  return Object.entries(handles)
    .map(([platform, handle]) => `${platform}: ${handle}`)
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

function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
        resolve({ base64, mediaType: 'image/jpeg' });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function NewBusinessPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('entry');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [formData, setFormData] = useState<BusinessFormData>(EMPTY);
  const [socialHandlesText, setSocialHandlesText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setScanError('Image must be under 10 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setScanError('Please select an image file.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanError(null);
  }

  async function handleScan() {
    if (!imageFile) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const { base64, mediaType } = await compressImage(imageFile);
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64, mediaType }),
      });

      if (!response.ok) throw new Error('Scan failed');

      const result: ScanResult = await response.json();
      setScanResult(result);

      const scores = getConfidenceScores(result);
      const autoFlag = shouldAutoFlag(Object.values(scores));

      const handles = result.social_handles.value ?? {};
      setSocialHandlesText(serializeSocialHandles(handles));
      setFormData({
        name: result.name.value ?? '',
        email: result.email.value ?? '',
        phone: result.phone.value ?? '',
        website: result.website.value ?? '',
        social_handles: handles,
        category: '',
        met_at: '',
        notes: '',
        needs_review: autoFlag,
      });

      setStep('review');
    } catch {
      setScanError('Scan failed. You can try again or enter details manually.');
    } finally {
      setIsScanning(false);
    }
  }

  function handleManualEntry() {
    setFormData(EMPTY);
    setScanResult(null);
    setStep('review');
  }

  function updateField(field: keyof BusinessFormData, value: string | boolean | Record<string, string>) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    try {
      let card_image_url: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('card-images')
          .upload(filename, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('card-images')
          .getPublicUrl(filename);
        card_image_url = urlData.publicUrl;
      }

      const { data: business, error: insertError } = await supabase
        .from('businesses')
        .insert({ ...formData, card_image_url })
        .select()
        .single();
      if (insertError) throw insertError;

      if (scanResult) {
        const scores = getConfidenceScores(scanResult);
        const lowRows = Object.entries(scores)
          .filter(([, score]) => isLowConfidence(score))
          .map(([field_name, confidence_score]) => ({
            business_id: business.id,
            field_name,
            confidence_score: confidence_score!,
          }));
        if (lowRows.length > 0) {
          const { error: confidenceError } = await supabase.from('scan_confidence').insert(lowRows);
          if (confidenceError) console.error('[scan_confidence]', confidenceError);
        }
      }

      router.push(`/businesses/${business.id}`);
    } catch {
      setSaveError('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (step === 'entry') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Add Business</h1>

        <div className="space-y-4">
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-2">Scan a card</h2>
            <p className="text-sm text-gray-500 mb-4">
              Take a photo or upload an image of a business card.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl && (
              <div className="mb-4">
                <CardImageViewer src={previewUrl} />
              </div>
            )}
            {!imageFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                Choose photo
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Scan card'}
                </button>
              </div>
            )}
            {scanError && (
              <p className="text-sm text-red-600 mt-3">{scanError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualEntry}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-900"
          >
            Enter manually instead
          </button>
        </div>
      </div>
    );
  }

  // Review step
  const scores = scanResult ? getConfidenceScores(scanResult) : {};

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review</h1>

      {previewUrl && (
        <div className="mb-6">
          <CardImageViewer src={previewUrl} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
        <ConfidenceField
          label="Business Name"
          value={formData.name}
          confidence={scores.name ?? null}
          onChange={(v) => updateField('name', v)}
          placeholder="e.g. Pottery by Mia"
        />
        <ConfidenceField
          label="Email"
          value={formData.email}
          confidence={scores.email ?? null}
          onChange={(v) => updateField('email', v)}
          placeholder="e.g. mia@email.com"
        />
        <ConfidenceField
          label="Phone"
          value={formData.phone}
          confidence={scores.phone ?? null}
          onChange={(v) => updateField('phone', v)}
          placeholder="e.g. 718-555-0192"
        />
        <ConfidenceField
          label="Website"
          value={formData.website}
          confidence={scores.website ?? null}
          onChange={(v) => updateField('website', v)}
          placeholder="e.g. https://miapottery.com"
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Social Handles
            {isLowConfidence(scores.social_handles ?? null) && (
              <span className="ml-2 text-yellow-600 normal-case tracking-normal font-normal">
                low confidence
              </span>
            )}
          </label>
          <textarea
            value={socialHandlesText}
            onChange={(e) => {
              setSocialHandlesText(e.target.value);
              updateField('social_handles', deserializeSocialHandles(e.target.value));
            }}
            rows={2}
            placeholder={"instagram: @handle\ntiktok: @handle"}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none ${
              isLowConfidence(scores.social_handles ?? null)
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          />
          <p className="text-xs text-gray-400 mt-1">One per line: platform: @handle</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Category
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder="e.g. ceramics, jewelry, textiles"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Where I Met Them
          </label>
          <input
            type="text"
            value={formData.met_at}
            onChange={(e) => updateField('met_at', e.target.value)}
            placeholder="e.g. Brooklyn Craft Fair 2026"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            placeholder="Anything else you want to remember"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <FlagButton
          flagged={formData.needs_review}
          onChange={(v) => updateField('needs_review', v)}
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
        <p className="text-sm text-red-600 mb-4">{saveError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep('entry')}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save business'}
        </button>
      </div>

      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
