import { isLowConfidence } from '@/lib/confidence';

type Props = {
  id?: string;
  label: string;
  value: string;
  confidence: number | null;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function ConfidenceField({
  id,
  label,
  value,
  confidence,
  onChange,
  placeholder,
}: Props) {
  const low = isLowConfidence(confidence);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
      >
        {label}
        {low && (
          <span className="ml-2 text-yellow-600 normal-case tracking-normal font-normal">
            low confidence
          </span>
        )}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
          low
            ? 'border-yellow-300 bg-yellow-50'
            : 'border-gray-200 bg-white'
        }`}
      />
    </div>
  );
}
