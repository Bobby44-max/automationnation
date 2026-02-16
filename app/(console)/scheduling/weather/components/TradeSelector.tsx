"use client";

const TRADES = [
  { value: "all", label: "All Trades" },
  { value: "roofing", label: "Roofing" },
  { value: "exterior_painting", label: "Ext. Painting" },
  { value: "landscaping", label: "Landscaping" },
  { value: "concrete", label: "Concrete" },
  { value: "pressure_washing", label: "Pressure Wash" },
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
      className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {TRADES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
