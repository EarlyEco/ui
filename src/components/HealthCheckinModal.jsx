import { useState } from "react";
import { DEFAULT_HEALTH_CHECKIN } from "../api/healthCheckins";

export default function HealthCheckinModal({ open, onClose, onSubmit, submitting }) {
    const [form, setForm] = useState({
        ...DEFAULT_HEALTH_CHECKIN,
        recorded_at: new Date().toISOString(),
    });
    const [localError, setLocalError] = useState("");

    if (!open) return null;

    const setTopLevel = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setNested = (group, key, value) => {
        setForm((prev) => ({
            ...prev,
            [group]: {
                ...prev[group],
                [key]: value,
            },
        }));
    };

    const onNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    };

    const onCsvListChange = (key, value) => {
        const list = value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        setTopLevel(key, list);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError("");

        try {
            await onSubmit({
                ...form,
                recorded_at: form.recorded_at || new Date().toISOString(),
            });
        } catch (error) {
            setLocalError(error?.userMessage || error?.message || "Unable to submit health details.");
        }
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
                <div className="modal-header">
                    <h3>Daily Health Check-In</h3>
                    <button type="button" className="ghost-button" onClick={onClose}>
                        Close
                    </button>
                </div>

                <p className="modal-subtitle">
                    Fill your health details and submit. This will be sent to your health check-in endpoint.
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="section-title">Location</div>
                    <div className="field-grid">
                        <label className="field">
                            <span>Latitude</span>
                            <input type="number" value={form.latitude} onChange={(e) => setTopLevel("latitude", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Longitude</span>
                            <input type="number" value={form.longitude} onChange={(e) => setTopLevel("longitude", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>City</span>
                            <input value={form.city} onChange={(e) => setTopLevel("city", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Region</span>
                            <input value={form.region} onChange={(e) => setTopLevel("region", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Country</span>
                            <input value={form.country} onChange={(e) => setTopLevel("country", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Neighborhood</span>
                            <input value={form.neighborhood} onChange={(e) => setTopLevel("neighborhood", e.target.value)} />
                        </label>
                    </div>

                    <div className="section-title">Symptoms and Scores</div>
                    <div className="field-grid">
                        <label className="field">
                            <span>Body Temperature (C)</span>
                            <input type="number" value={form.body_temperature_c} onChange={(e) => setTopLevel("body_temperature_c", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Feeling Score</span>
                            <input type="number" value={form.feeling_score} onChange={(e) => setTopLevel("feeling_score", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Symptoms (comma separated)</span>
                            <input value={form.symptoms.join(", ")} onChange={(e) => onCsvListChange("symptoms", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Cough Severity</span>
                            <input type="number" value={form.symptom_severities.cough} onChange={(e) => setNested("symptom_severities", "cough", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Sore Throat Severity</span>
                            <input type="number" value={form.symptom_severities.sore_throat} onChange={(e) => setNested("symptom_severities", "sore_throat", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Headache Severity</span>
                            <input type="number" value={form.symptom_severities.headache} onChange={(e) => setNested("symptom_severities", "headache", onNumber(e.target.value))} />
                        </label>
                    </div>

                    <div className="section-title">Vitals and Wellness</div>
                    <div className="field-grid">
                        <label className="field">
                            <span>Heart Rate (bpm)</span>
                            <input type="number" value={form.vitals.heart_rate_bpm} onChange={(e) => setNested("vitals", "heart_rate_bpm", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>SpO2 (%)</span>
                            <input type="number" value={form.vitals.spo2_percent} onChange={(e) => setNested("vitals", "spo2_percent", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Respiratory Rate</span>
                            <input type="number" value={form.vitals.respiratory_rate_bpm} onChange={(e) => setNested("vitals", "respiratory_rate_bpm", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Sleep Hours</span>
                            <input type="number" value={form.wellness.sleep_hours} onChange={(e) => setNested("wellness", "sleep_hours", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Sleep Quality Score</span>
                            <input type="number" value={form.wellness.sleep_quality_score} onChange={(e) => setNested("wellness", "sleep_quality_score", onNumber(e.target.value))} />
                        </label>
                        <label className="field">
                            <span>Stress Level Score</span>
                            <input type="number" value={form.wellness.stress_level_score} onChange={(e) => setNested("wellness", "stress_level_score", onNumber(e.target.value))} />
                        </label>
                    </div>

                    <div className="section-title">Exposure and Testing</div>
                    <div className="field-grid">
                        <label className="field">
                            <span>Indoor or Outdoor</span>
                            <input value={form.exposure.indoor_or_outdoor} onChange={(e) => setNested("exposure", "indoor_or_outdoor", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Travel Notes</span>
                            <input value={form.exposure.travel_notes} onChange={(e) => setNested("exposure", "travel_notes", e.target.value)} />
                        </label>
                        <label className="field checkbox-field">
                            <span>Mask Worn</span>
                            <input type="checkbox" checked={form.exposure.mask_worn} onChange={(e) => setNested("exposure", "mask_worn", e.target.checked)} />
                        </label>
                        <label className="field checkbox-field">
                            <span>Crowded Environment</span>
                            <input type="checkbox" checked={form.exposure.crowded_environment} onChange={(e) => setNested("exposure", "crowded_environment", e.target.checked)} />
                        </label>
                        <label className="field checkbox-field">
                            <span>Recent Travel</span>
                            <input type="checkbox" checked={form.exposure.recent_travel} onChange={(e) => setNested("exposure", "recent_travel", e.target.checked)} />
                        </label>
                        <label className="field checkbox-field">
                            <span>Tested Positive Recently</span>
                            <input type="checkbox" checked={form.testing.tested_positive_recently} onChange={(e) => setNested("testing", "tested_positive_recently", e.target.checked)} />
                        </label>
                    </div>

                    <div className="section-title">Other Details</div>
                    <div className="field-grid">
                        <label className="field">
                            <span>Medications (comma separated)</span>
                            <input value={form.medications_taken.join(", ")} onChange={(e) => onCsvListChange("medications_taken", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Chronic Conditions (comma separated)</span>
                            <input value={form.chronic_conditions.join(", ")} onChange={(e) => onCsvListChange("chronic_conditions", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Special Notices</span>
                            <input value={form.special_notices} onChange={(e) => setTopLevel("special_notices", e.target.value)} />
                        </label>
                        <label className="field">
                            <span>Recorded At</span>
                            <input
                                type="datetime-local"
                                value={form.recorded_at?.slice(0, 16) || ""}
                                onChange={(e) =>
                                    setTopLevel(
                                        "recorded_at",
                                        e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                                    )
                                }
                            />
                        </label>
                    </div>

                    {localError && <p className="status-message error">{localError}</p>}
                    <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Submit Health Check-In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
