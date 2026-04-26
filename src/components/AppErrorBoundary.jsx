import React from "react";

export default class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            message: error?.message || "Unexpected error",
        };
    }

    componentDidCatch(error) {
        // Keep a console trace for debugging in browser devtools.
        // eslint-disable-next-line no-console
        console.error("App runtime error:", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
                    <div style={{ maxWidth: 680 }}>
                        <h2>Something went wrong</h2>
                        <p>The page hit a runtime issue after an action. Please refresh and try again.</p>
                        <p style={{ color: "#ff8f99" }}>{this.state.message}</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
