import { authFetch } from "./auth";

const BASE_URL = __BE_BASE_URL__;
const USERS_API_BASE = import.meta.env.DEV ? "/api/v1/users" : `${BASE_URL}/api/v1/users`;
/** Same-origin /api proxy in dev; full backend URL in production (set BE_BASE_URL at build time). */
const apiRootPrefix = import.meta.env.DEV ? "" : BASE_URL;

export const DEFAULT_HEALTH_CHECKIN = {
    latitude: 32.2226,
    longitude: -110.9747,
    city: "Tucson",
    region: "Arizona",
    country: "USA",
    neighborhood: "Downtown",
    location_accuracy_m: 1000,
    location_source: "manual",
    body_temperature_c: 36.8,
    feeling_score: 7,
    symptoms: [],
    symptom_severities: {
        cough: 0,
        sore_throat: 0,
        headache: 0,
        body_aches: 0,
        fatigue: 2,
        nausea: 0,
        congestion: 1,
        shortness_of_breath: 0,
    },
    vitals: {
        heart_rate_bpm: 74,
        spo2_percent: 98,
        respiratory_rate_bpm: 16,
        blood_pressure_systolic: 118,
        blood_pressure_diastolic: 76,
    },
    wellness: {
        sleep_hours: 7,
        sleep_quality_score: 7,
        hydration_level_score: 7,
        stress_level_score: 4,
    },
    exposure: {
        indoor_or_outdoor: "indoor",
        mask_worn: false,
        crowded_environment: false,
        recent_travel: false,
        travel_notes: "",
        animal_contact: false,
        animal_contact_notes: "",
    },
    testing: {
        tested_positive_recently: false,
        test_type: "none",
        test_result: "not_tested",
    },
    medications_taken: [],
    recent_medications_notes: "",
    chronic_conditions: [],
    special_notices: "",
    recorded_at: new Date().toISOString(),
};

const createError = (message, userMessage) => {
    const error = new Error(message);
    error.userMessage = userMessage;
    return error;
};

const formatApiDetail = (detail, fallbackMessage) => {
    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "field";
                return `${field}: ${item?.msg || "invalid value"}`;
            })
            .join(", ");
    }

    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }

    if (detail && typeof detail === "object") {
        return JSON.stringify(detail);
    }

    return fallbackMessage;
};

export const submitHealthCheckin = async (payload) => {
    let response;

    try {
        response = await authFetch(`${USERS_API_BASE}/self/health-checkins`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(payload),
        });
    } catch {
        throw createError(
            "Failed to fetch",
            "Could not connect to the server. Please make sure backend is running."
        );
    }

    if (!response.ok) {
        let detail = "Unable to save health details right now.";
        try {
            const data = await response.json();
            detail = formatApiDetail(data?.detail || data?.message, detail);
        } catch {
            // keep default detail
        }
        throw createError(detail, detail);
    }

    return response.json();
};

const readJsonOrThrow = async (response, fallbackMessage) => {
    if (response.ok) return response.json();

    let detail = fallbackMessage;
    try {
        const data = await response.json();
        detail = formatApiDetail(data?.detail || data?.message, fallbackMessage);
    } catch {
        // keep fallback
    }
    const error = createError(detail, detail);
    error.status = response.status;
    throw error;
};

export const fetchLatestHealthCheckin = async () => {
    try {
        const response = await authFetch(`${USERS_API_BASE}/self/health-checkins/latest`, {
            headers: { accept: "application/json" },
        });
        if (response.status === 404) return null;
        return await readJsonOrThrow(response, "Could not fetch latest health check-in.");
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch latest health check-in.");
    }
};

export const fetchHealthTrend = async (limit = 30) => {
    try {
        const response = await authFetch(`${USERS_API_BASE}/self/health-checkins/trend?limit=${limit}`, {
            headers: { accept: "application/json" },
        });
        return await readJsonOrThrow(response, "Could not fetch health trend.");
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch health trend.");
    }
};

export const fetchHealthCheckinList = async ({ limit = 10, since, until } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (since) params.set("since", since);
    if (until) params.set("until", until);

    try {
        const response = await authFetch(`${USERS_API_BASE}/self/health-checkins?${params.toString()}`, {
            headers: { accept: "application/json" },
        });
        return await readJsonOrThrow(response, "Could not fetch check-in history.");
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch check-in history.");
    }
};

export const fetchHealthCheckinById = async (checkinId) => {
    try {
        const response = await authFetch(`${USERS_API_BASE}/self/health-checkins/${checkinId}`, {
            headers: { accept: "application/json" },
        });
        return await readJsonOrThrow(response, "Could not fetch check-in details.");
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch check-in details.");
    }
};

export const fetchHealthSuggestions = async (lookbackHours = 48) => {
    const params = new URLSearchParams({ lookback_hours: String(lookbackHours) });
    try {
        const response = await authFetch(`${USERS_API_BASE}/self/health-suggestions?${params.toString()}`, {
            headers: { accept: "application/json" },
        });
        return await readJsonOrThrow(response, "Could not fetch health suggestions.");
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch health suggestions.");
    }
};

const cityQueryFromLocation = (location) => {
    const key = String(location || "")
        .toLowerCase()
        .replace(/_/g, " ")
        .trim();
    if (key === "phoenix") return "Phoenix";
    if (key === "tucson") return "Tucson";
    return null;
};

/** Overview may expose pins under different keys; merge without duplicates. */
const HOTSPOT_ARRAY_KEYS = [
    "hotspots",
    "risk_hotspots",
    "location_hotspots",
    "map_hotspots",
    "anonymized_locations",
    "anonymous_locations",
    "report_locations",
    "location_clusters",
    "clusters",
];

const mergeHotspotArraysFromSnapshot = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return [];
    const merged = [];
    for (const key of HOTSPOT_ARRAY_KEYS) {
        const arr = snapshot[key];
        if (Array.isArray(arr)) merged.push(...arr);
    }
    const seen = new Set();
    const deduped = [];
    for (const item of merged) {
        const lat = Number(item?.lat ?? item?.latitude);
        const lon = Number(item?.lon ?? item?.longitude ?? item?.lng);
        const id = item?.id != null ? String(item.id) : `${lat.toFixed(5)},${lon.toFixed(5)}`;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        deduped.push(item);
    }
    return deduped;
};

/** Default overview radius; keep map ring in app.jsx in sync (meters = km * 1000). */
export const COMMUNITY_OVERVIEW_RADIUS_KM = 5;

export const fetchCommunitySnapshot = async ({
    lookbackHours = 24,
    location = "all-locations",
    latitude,
    longitude,
    radiusKm = COMMUNITY_OVERVIEW_RADIUS_KM,
} = {}) => {
    const baseParams = () =>
        new URLSearchParams({
            lookback_hours: String(lookbackHours),
            radius_km: String(radiusKm),
        });

    try {
        const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
        const cityFromLocation = cityQueryFromLocation(location);
        const params = baseParams();

        if (hasCoordinates) {
            params.set("latitude", String(latitude));
            params.set("longitude", String(longitude));
            const city = cityQueryFromLocation(location);
            if (city) params.set("city", city);
        } else if (location && location !== "all-locations" && location !== "current-location") {
            params.set("city", cityQueryFromLocation(location) || String(location));
        } else if (cityFromLocation) {
            params.set("city", cityFromLocation);
        }

        const response = await fetch(`${apiRootPrefix}/api/v1/community-health/overview?${params.toString()}`, {
            headers: { accept: "application/json" },
        });
        const snapshot = await readJsonOrThrow(response, "Could not fetch community snapshot.");
        const hotspots = mergeHotspotArraysFromSnapshot(snapshot);
        return { snapshot, hotspots };
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch community snapshot.");
    }
};
