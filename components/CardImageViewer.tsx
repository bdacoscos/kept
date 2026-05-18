type Props = {
  src: string;
  alt?: string;
};

export default function CardImageViewer({ src, alt = 'Business card' }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full object-contain max-h-64"
      />
    </div>
  );
}
