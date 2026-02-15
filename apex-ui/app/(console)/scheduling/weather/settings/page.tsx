import WeatherSettingsPage from "./WeatherSettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weather Rules Settings | Apex AI",
  description: "Customize weather thresholds for each trade preset.",
};

export default function SettingsPage() {
  return <WeatherSettingsPage />;
}
