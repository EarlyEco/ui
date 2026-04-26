import { useMemo, useState } from "react";
import { DEFAULT_HEALTH_CHECKIN } from "../api/healthCheckins";

export default function HealthCheckinModal({ open, onClose, onSubmit, submitting }) {
    const initialValue = useMemo(
        () =>
            JSON.stringify(
                {
                    ...DEFAULT_HEALTH_CHECKIN,
                    recorded_at: new Date().toISOString(),
                },
                null,
                2
            ),
        []
    );
    const [rawJson, setRawJson] = useState(initialValue);
    const [localError, setLocalError] = useState("");

    if (!open) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError("");

        try {
            const payload = JSON.parse(rawJson);
            await onSubmit(payload);
        } catch (error) {
            if (error instanceof SyntaxError) {
                setLocalError("Please enter valid JSON in the health details form.");
                return;
            }
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
                    Update the values below and submit. This sends data to your backend health check-in endpoint.
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="field">
                        <span>Health Data (JSON)</span>
                        <textarea
                            className="json-textarea"
                            value={rawJson}
                            onChange={(event) => setRawJson(event.target.value)}
                            rows={20}
                            spellCheck={false}
                        />
                    </label>

                    {localError && <p className="status-message error">{localError}</p>}
                    <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Submit Health Check-In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
