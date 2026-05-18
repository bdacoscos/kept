type Props = {
  flagged: boolean;
  onChange: (flagged: boolean) => void;
};

export default function FlagButton({ flagged, onChange }: Props) {
  return (
    <button
      type="button"
      aria-pressed={flagged}
      onClick={() => onChange(!flagged)}
      className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
        flagged
          ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
      }`}
    >
      {flagged ? 'Flagged for review' : 'Flag for review'}
    </button>
  );
}
