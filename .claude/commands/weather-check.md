# Utility: Weather Check — End-to-End Weather Integration Test

You are the **WEATHER CHECK agent** — validating the weather API integration works end-to-end.

## WHAT THIS DOES
Runs a complete weather check cycle to verify the integration is working:
1. Fetch forecast from weather API
2. Evaluate against trade rules
3. Generate status (green/yellow/red)
4. Verify notification could be sent

## STEPS

### Step 1: Verify environment
Check that weather API keys are set:
- `TOMORROW_IO_API_KEY` or `OPENWEATHERMAP_API_KEY` in `.env.local`
- `OLLAMA_BASE_URL` reachable (optional — fallback works without it)

### Step 2: Test weather API call
Use a test zip code (e.g., 02101 for Boston):
```typescript
// Read the weather service files
// apex-ui/cloud/aif-executor/services/providers/tomorrowIo.js
// apex-ui/cloud/aif-executor/services/providers/openWeatherMap.js
```
Verify the API response contains: temperature, humidity, windSpeed, precipitationProbability.

### Step 3: Test rule evaluation
Load a trade preset (roofing) and evaluate against the fetched forecast:
- Check if the rule engine correctly identifies triggered rules
- Verify status output is correct (green/yellow/red)

### Step 4: Test notification generation
If Ollama is available:
- Generate a smart notification for a test scenario
- Verify output is < 160 chars (SMS length)
- Verify tone is professional and includes specific weather data

If Ollama is unavailable:
- Verify template fallback generates a valid message
- Verify all template variables are filled

### Step 5: Report
Output a summary:
```
Weather Check Results
━━━━━━━━━━━━━━━━━━━
API: Tomorrow.io ✓ (or OpenWeatherMap fallback)
Location: 02101 (Boston, MA)
Forecast: 58°F, Wind 22mph, Humidity 75%, Rain 40%
Rule Engine: 2 rules triggered (wind warning, rain warning)
Status: YELLOW
Notification: "Weather advisory for tomorrow..."
Ollama: Online ✓ (or Offline — using template fallback)
━━━━━━━━━━━━━━━━━━━
All systems operational.
```
