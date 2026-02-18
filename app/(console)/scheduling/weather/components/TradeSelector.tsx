"use client";

const TRADES = [
  { value: "all", label: "All Trades" },
  { value: "roofing", label: "Roofing" },
  { value: "exterior_painting", label: "Painting" },
  { value: "landscaping", label: "Landscape" },
  { value: "concrete", label: "Concrete" },
  { value: "pressure_washing", label: "Pressure" },
];

interface TradeSelectorProps {
  selected: string;
  onChange: (trade: string) => void;
}

export function TradeSelector({ selected, onChange }: TradeSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="rounded bg-[#151A1F] border border-white/[0.06] px-3 py-2 text-[13px] text-[#8B939E] min-h-[40px] focus:outline-none focus:ring-1 focus:ring-[#19AFFF] transition-colors"
    >
      {TRADES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
