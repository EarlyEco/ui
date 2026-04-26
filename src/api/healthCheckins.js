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

const slugValueFromText = (s) =>
    String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");

const titleCaseWords = (s) =>
    String(s || "")
        .trim()
        .replace(/[-_]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

/** City string for `city=` query when the location slug is not Phoenix/Tucson. */
const formatCityQueryParam = (location) => {
    const fixed = cityQueryFromLocation(location);
    if (fixed) return fixed;
    return titleCaseWords(slugValueFromText(location));
};

const normalizeLocationOptionEntry = (raw) => {
    if (raw == null) return null;
    if (typeof raw === "string") {
        const value = slugValueFromText(raw);
        if (!value || value === "all-locations" || value === "current-location") return null;
        return { value, label: titleCaseWords(raw) || titleCaseWords(value) };
    }
    if (typeof raw === "object") {
        const rawVal = raw.value ?? raw.slug ?? raw.id ?? raw.city ?? raw.label ?? raw.name;
        if (rawVal == null || String(rawVal).trim() === "") return null;
        const value = slugValueFromText(String(rawVal));
        if (!value || value === "all-locations" || value === "current-location") return null;
        const label = String(
            raw.label ?? raw.name ?? raw.city ?? raw.display_name ?? titleCaseWords(value)
        ).trim();
        const lat = Number(raw.lat ?? raw.latitude ?? raw.center_lat);
        const lon = Number(raw.lon ?? raw.longitude ?? raw.lng ?? raw.center_lon);
        const entry = { value, label: label || titleCaseWords(value) };
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            entry.lat = lat;
            entry.lon = lon;
        }
        return entry;
    }
    return null;
};

/** Fallback map centers when the API does not send coordinates for a city. */
export const DEFAULT_COMMUNITY_REGION_LOCATIONS = [
    { value: "phoenix", label: "Phoenix", lat: 33.4484, lon: -112.074 },
    { value: "tucson", label: "Tucson", lat: 32.2226, lon: -110.9747 },
];

const SNAPSHOT_LOCATION_OPTION_KEYS = [
    "available_cities",
    "location_options",
    "supported_locations",
    "locations_filter",
    "cities",
    "location_labels",
    "location_dropdown",
];

export const parseLocationOptionsFromSnapshot = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return [];
    const out = [];
    for (const key of SNAPSHOT_LOCATION_OPTION_KEYS) {
        const v = snapshot[key];
        if (!Array.isArray(v)) continue;
        for (const item of v) {
            const n = normalizeLocationOptionEntry(item);
            if (n) out.push(n);
        }
    }
    const nested = snapshot?.filters?.cities ?? snapshot?.filters?.locations;
    if (Array.isArray(nested)) {
        for (const item of nested) {
            const n = normalizeLocationOptionEntry(item);
            if (n) out.push(n);
        }
    }
    return out;
};

export const mergeCommunityLocationEntries = (
    apiRows,
    snapshotRows,
    baseRegionals = DEFAULT_COMMUNITY_REGION_LOCATIONS
) => {
    const byValue = new Map();
    const push = (entry) => {
        const e = normalizeLocationOptionEntry(entry);
        if (!e?.value) return;
        const prev = byValue.get(e.value);
        if (prev) {
            byValue.set(e.value, {
                ...prev,
                ...e,
                lat: Number.isFinite(e.lat) ? e.lat : prev.lat,
                lon: Number.isFinite(e.lon) ? e.lon : prev.lon,
            });
        } else {
            byValue.set(e.value, { ...e });
        }
    };
    baseRegionals.forEach(push);
    (apiRows || []).forEach(push);
    (snapshotRows || []).forEach(push);
    const regionals = [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label));
    return [
        { value: "current-location", label: "Current Location" },
        { value: "all-locations", label: "All Locations" },
        ...regionals,
    ];
};

export const fetchCommunityLocationOptions = async () => {
    const paths = ["/api/v1/community-health/locations", "/api/v1/community-health/location-options"];
    for (const path of paths) {
        try {
            const response = await fetch(`${apiRootPrefix}${path}`, {
                headers: { accept: "application/json" },
            });
            if (!response.ok) continue;
            const data = await response.json();
            const arr = Array.isArray(data)
                ? data
                : data?.locations ??
                  data?.cities ??
                  data?.items ??
                  data?.data ??
                  data?.results ??
                  [];
            if (!Array.isArray(arr) || arr.length === 0) continue;
            const normalized = arr.map(normalizeLocationOptionEntry).filter(Boolean);
            if (normalized.length) return normalized;
        } catch {
            // try next path
        }
    }
    return [];
};

const cityCentroidFromLocationKey = (location) => {
    const key = String(location || "").toLowerCase().replace(/_/g, "-");
    if (key.includes("phoenix")) return { lat: 33.4484, lon: -112.074 };
    if (key.includes("tucson")) return { lat: 32.2226, lon: -110.9747 };
    return null;
};

const DEFAULT_MOCK_MAP_CENTER = { lat: 32.7, lon: -111.7 };

/** Deterministic demo pins when the API has no map geometry (replace when backend ships real coords). */
export const buildMockCommunityMapPeers = (centerLat, centerLon, count = 9) => {
    if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon)) return [];
    const severities = ["info", "warning", "critical"];
    const labels = [
        "Demo peer: anonymized user A",
        "Demo peer: anonymized user B",
        "Demo peer: anonymized user C",
        "Demo peer: anonymized user D",
        "Demo peer: anonymized user E",
        "Demo peer: anonymized user F",
        "Demo peer: anonymized user G",
        "Demo peer: anonymized user H",
        "Demo peer: anonymized user I",
    ];
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.35;
        const radiusDeg = 0.007 + (i % 4) * 0.0035;
        const lat = centerLat + Math.cos(angle) * radiusDeg;
        const lon = centerLon + Math.sin(angle) * radiusDeg * 1.12;
        return {
            id: `mock-community-peer-${i}`,
            lat,
            lon,
            severity: severities[i % severities.length],
            label: labels[i % labels.length],
            cases: 1 + (i % 6),
            is_mock: true,
        };
    });
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
    "peer_locations",
    "check_in_locations",
    "map_points",
    "recent_location_pins",
];

const pickLatLonFromRecord = (item) => {
    if (!item || typeof item !== "object") return null;
    let lat = Number(item.lat ?? item.latitude ?? item.y);
    let lon = Number(item.lon ?? item.longitude ?? item.lng ?? item.x);
    const coordPair = item.coordinates ?? item.coord;
    if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && Array.isArray(coordPair) && coordPair.length >= 2) {
        lon = Number(coordPair[0]);
        lat = Number(coordPair[1]);
    }
    const gc = item.geometry?.coordinates;
    if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && Array.isArray(gc) && gc.length >= 2) {
        lon = Number(gc[0]);
        lat = Number(gc[1]);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { ...item, lat, lon };
};

const geoJsonPointFeaturesToRows = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return [];
    const out = [];
    let idx = 0;
    for (const key of ["geojson", "geo_json"]) {
        const raw = snapshot[key];
        if (!raw || raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) continue;
        for (const f of raw.features) {
            if (f?.geometry?.type !== "Point" || !Array.isArray(f.geometry.coordinates)) continue;
            const lon = Number(f.geometry.coordinates[0]);
            const lat = Number(f.geometry.coordinates[1]);
            const p = f.properties && typeof f.properties === "object" ? f.properties : {};
            out.push({
                ...p,
                lat,
                lon,
                id: f.id ?? p.id ?? `geo-${idx}`,
            });
            idx += 1;
        }
    }
    return out;
};

const dedupeHotspotRows = (rows) => {
    const seen = new Set();
    const out = [];
    rows.forEach((item, index) => {
        const normalized = pickLatLonFromRecord(item);
        if (!normalized) return;
        const id =
            normalized.id != null
                ? String(normalized.id)
                : `${normalized.lat.toFixed(5)}|${normalized.lon.toFixed(5)}|${index}`;
        if (seen.has(id)) return;
        seen.add(id);
        out.push(normalized);
    });
    return out;
};

const mergeHotspotArraysFromSnapshot = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return [];
    const merged = [];
    for (const key of HOTSPOT_ARRAY_KEYS) {
        const arr = snapshot[key];
        if (Array.isArray(arr)) merged.push(...arr);
    }
    merged.push(...geoJsonPointFeaturesToRows(snapshot));
    return dedupeHotspotRows(merged);
};

/** Normalize map-points JSON (may repeat the same pins under several keys). */
const extractArraysFromMapPointsPayload = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const merged = [];
    const keys = ["points", "hotspots", "locations", "anonymized_locations", "clusters"];
    for (const k of keys) {
        if (Array.isArray(data[k])) merged.push(...data[k]);
    }
    return merged;
};

/** Companion endpoint merged with overview pins (404 ignored). Same query string as overview. */
const fetchCommunityMapPoints = async (apiRootPrefix, searchParamsString) => {
    const path = "/api/v1/community-health/map-points";
    try {
        const response = await fetch(`${apiRootPrefix}${path}?${searchParamsString}`, {
            headers: { accept: "application/json" },
        });
        if (response.status === 404 || !response.ok) return [];
        const data = await response.json();
        return extractArraysFromMapPointsPayload(data);
    } catch {
        return [];
    }
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
            params.set("city", cityQueryFromLocation(location) || formatCityQueryParam(location));
        } else if (cityFromLocation) {
            params.set("city", cityFromLocation);
        }

        const overviewUrl = `${apiRootPrefix}/api/v1/community-health/overview?${params.toString()}`;
        const query = params.toString();
        const [snapshot, mapPointRows] = await Promise.all([
            (async () => {
                const response = await fetch(overviewUrl, {
                    headers: { accept: "application/json" },
                });
                return readJsonOrThrow(response, "Could not fetch community snapshot.");
            })(),
            fetchCommunityMapPoints(apiRootPrefix, query),
        ]);
        let hotspots = dedupeHotspotRows([
            ...mergeHotspotArraysFromSnapshot(snapshot),
            ...mapPointRows,
        ]);
        let mapPeersAreMock = false;
        if (hotspots.length === 0) {
            let center = null;
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                center = { lat: latitude, lon: longitude };
            } else {
                center = cityCentroidFromLocationKey(location);
            }
            if (!center) center = DEFAULT_MOCK_MAP_CENTER;
            hotspots = buildMockCommunityMapPeers(center.lat, center.lon);
            mapPeersAreMock = hotspots.length > 0;
        }
        return { snapshot, hotspots, mapPeersAreMock };
    } catch (error) {
        if (error?.userMessage) throw error;
        throw createError("Failed to fetch", "Could not fetch community snapshot.");
    }
};
