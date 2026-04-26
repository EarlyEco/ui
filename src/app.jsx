import Signup from "./components/Signup";
import { useMemo, useState } from "react";
import { getSessionToken } from "./api/auth";
import { submitHealthCheckin } from "./api/healthCheckins";
import HealthCheckinModal from "./components/HealthCheckinModal";
import Signin from "./components/signin";

export default function App() {
    const [activeView, setActiveView] = useState("signup");
    const [isSignedIn, setIsSignedIn] = useState(Boolean(getSessionToken()));
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [healthInfo, setHealthInfo] = useState(null);
    const [healthSubmitMessage, setHealthSubmitMessage] = useState("");
    const [isSubmittingHealth, setIsSubmittingHealth] = useState(false);
    const currentYear = useMemo(() => new Date().getFullYear(), []);

    const handleSigninSuccess = () => {
        setIsSignedIn(true);
        setHealthSubmitMessage("");
        setIsHealthModalOpen(true);
    };

    const handleHealthSubmit = async (payload) => {
        setIsSubmittingHealth(true);
        setHealthSubmitMessage("");
        try {
            const result = await submitHealthCheckin(payload);
            setHealthInfo(result);
            setHealthSubmitMessage("✅ Health details saved successfully.");
            setIsHealthModalOpen(false);
        } catch (error) {
            setHealthSubmitMessage(`❌ ${error?.userMessage || "Unable to save health details right now."}`);
            throw error;
        } finally {
            setIsSubmittingHealth(false);
        }
    };

    return (
        <div className="app-shell">
            <div className="ambient-glow glow-one" />
            <div className="ambient-glow glow-two" />

            <header className="hero">
                <p className="eyebrow">EARLY ECO ACCESS</p>
                <h1>Future-Ready Auth Portal</h1>
                <p className="hero-subtitle">
                    Fast onboarding with a sleek, responsive interface designed for modern users.
                </p>
            </header>

            <section className="panel">
                <div className="tab-row">
                    <button
                        className={`tab-button ${activeView === "signup" ? "active" : ""}`}
                        onClick={() => setActiveView("signup")}
                        type="button"
                    >
                        Create Account
                    </button>
                    <button
                        className={`tab-button ${activeView === "signin" ? "active" : ""}`}
                        onClick={() => setActiveView("signin")}
                        type="button"
                    >
                        Sign In
                    </button>
                </div>

                <div className="form-area">
                    {activeView === "signup" ? (
                        <Signup onSignupSuccess={() => setActiveView("signin")} />
                    ) : (
                        <Signin onSigninSuccess={handleSigninSuccess} />
                    )}
                </div>
            </section>

            {isSignedIn && (
                <section className="panel health-panel">
                    <div className="card-heading">
                        <h2>Your Health Information</h2>
                        <p>Submit and review your latest health check-in details.</p>
                    </div>
                    <button className="primary-button" type="button" onClick={() => setIsHealthModalOpen(true)}>
                        Add / Update Health Check-In
                    </button>

                    {healthSubmitMessage && (
                        <p className={`status-message ${healthSubmitMessage.startsWith("✅") ? "success" : "error"}`}>
                            {healthSubmitMessage}
                        </p>
                    )}

                    {healthInfo && (
                        <pre className="health-json-view">{JSON.stringify(healthInfo, null, 2)}</pre>
                    )}
                </section>
            )}

            <HealthCheckinModal
                open={isHealthModalOpen}
                onClose={() => setIsHealthModalOpen(false)}
                onSubmit={handleHealthSubmit}
                submitting={isSubmittingHealth}
            />

            <footer className="app-footer">Secure by design - {currentYear}</footer>
        </div>
    );
}