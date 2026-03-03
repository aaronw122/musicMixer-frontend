type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const EXAMPLES = [
  'Layer the vocals over a chill beat, boost the bass',
  'Make it sound like a club remix with heavy drums',
  'Slow it down and keep it mellow',
];

export function PromptInput({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">
        Describe your mashup
      </label>
      <div className="mb-3 space-y-1">
        {EXAMPLES.map((ex) => (
          <p key={ex} className="text-xs text-gray-600 italic">
            &ldquo;{ex}&rdquo;
          </p>
        ))}
      </div>
      <textarea
        id="prompt"
        rows={3}
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        placeholder="What kind of remix do you want?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={1000}
      />
      <p className="mt-1 text-xs text-gray-600 text-right">{value.length}/1000</p>
    </div>
  );
}
