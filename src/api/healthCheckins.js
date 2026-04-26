import { authFetch } from "./auth";

const BASE_URL = __BE_BASE_URL__;
const USERS_API_BASE = import.meta.env.DEV ? "/api/v1/users" : `${BASE_URL}/api/v1/users`;

export const DEFAULT_HEALTH_CHECKIN = {
    latitude: -90,
    longitude: -180,
    city: "string",
    region: "string",
    country: "string",
    neighborhood: "string",
    location_accuracy_m: 50000,
    location_source: "string",
    body_temperature_c: 30,
    feeling_score: 1,
    symptoms: ["string"],
    symptom_severities: {
        cough: 10,
        sore_throat: 10,
        headache: 10,
        body_aches: 10,
        fatigue: 10,
        nausea: 10,
        congestion: 10,
        shortness_of_breath: 10,
    },
    vitals: {
        heart_rate_bpm: 30,
        spo2_percent: 70,
        respiratory_rate_bpm: 5,
        blood_pressure_systolic: 60,
        blood_pressure_diastolic: 30,
    },
    wellness: {
        sleep_hours: 24,
        sleep_quality_score: 1,
        hydration_level_score: 1,
        stress_level_score: 1,
    },
    exposure: {
        indoor_or_outdoor: "string",
        mask_worn: true,
        crowded_environment: true,
        recent_travel: true,
        travel_notes: "string",
        animal_contact: true,
        animal_contact_notes: "string",
    },
    testing: {
        tested_positive_recently: true,
        test_type: "string",
        test_result: "string",
    },
    medications_taken: ["string"],
    recent_medications_notes: "string",
    chronic_conditions: ["string"],
    special_notices: "string",
    recorded_at: new Date().toISOString(),
};

const createError = (message, userMessage) => {
    const error = new Error(message);
    error.userMessage = userMessage;
    return error;
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
            detail = data?.detail || data?.message || detail;
        } catch {
            // keep default detail
        }
        throw createError(detail, detail);
    }

    return response.json();
};
