import { WeatherSchedulingClient } from "./WeatherSchedulingClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weather Scheduling | Rain Check",
  description:
    "AI-powered weather scheduling for service businesses. Auto-reschedule jobs based on trade-specific weather thresholds.",
};

export default function WeatherSchedulingPage() {
  return <WeatherSchedulingClient />;
}





