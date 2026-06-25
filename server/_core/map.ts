import { ENV } from "./env";

type MapsConfig = { baseUrl: string; apiKey: string; };

function getMapsConfig(): MapsConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) throw new Error("Google Maps proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY");
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

interface RequestOptions { method?: "GET" | "POST"; body?: Record<string, unknown>; }

export async function makeRequest<T = unknown>(endpoint: string, params: Record<string, unknown> = {}, options: RequestOptions = {}): Promise<T> {
  const { baseUrl, apiKey } = getMapsConfig();
  const url = new URL(`${baseUrl}/v1/maps/proxy${endpoint}`);
  url.searchParams.append("key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
  });
  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`);
  }
  return (await response.json()) as T;
}

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";
export type MapType = "roadmap" | "satellite" | "terrain" | "hybrid";
export type LatLng = { lat: number; lng: number; };
