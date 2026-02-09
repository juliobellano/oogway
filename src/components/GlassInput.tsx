import { useState, type FormEvent } from 'react';

interface GlassInputProps {
  onSubmit?: (url: string) => void;
}

export default function GlassInput({ onSubmit }: GlassInputProps) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim() && onSubmit) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mt-20">
      <div
        className={`
          glass rounded-full h-14 md:h-16 flex items-center px-6
          transition-all duration-300
          ${isFocused ? 'glass-focus' : ''}
        `}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste the YouTube link to begin training..."
          className="
            flex-1 bg-transparent font-mono text-sm md:text-base
            text-[#E5E7EB] placeholder:text-[#6B7280]
            focus:outline-none
          "
        />
        <button
          type="submit"
          className="
            ml-4 text-[#00A86B] hover:brightness-125
            transition-all duration-200
            flex items-center justify-center
          "
          aria-label="Submit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
