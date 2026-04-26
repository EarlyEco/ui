const BASE_URL = __BE_BASE_URL__;
const API_BASE = import.meta.env.DEV ? "/api/v1/auth" : `${BASE_URL}/api/v1/auth`;
const TOKEN_KEY = "auth_token";

const createError = (message, status, userMessage) => {
    const error = new Error(message);
    error.status = status;
    error.userMessage = userMessage;
    return error;
};

export const setSessionToken = (token) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
};

export const getSessionToken = () => {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;

    const persistentToken = localStorage.getItem(TOKEN_KEY);
    if (persistentToken) {
        sessionStorage.setItem(TOKEN_KEY, persistentToken);
    }
    return persistentToken;
};

export const clearSessionToken = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
};

const parseError = async (res, fallbackMessage) => {
    let detail = fallbackMessage;

    try {
        const data = await res.json();
        const apiDetail = data?.detail;

        if (Array.isArray(apiDetail)) {
            detail = apiDetail
                .map((item) => {
                    const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "field";
                    return `${field}: ${item?.msg || "invalid value"}`;
                })
                .join(", ");
        } else {
            detail = apiDetail || data?.message || fallbackMessage;
        }
    } catch {
        // Keep fallback message when body is not JSON
    }

    const status = res.status;

    if (status === 401) {
        throw createError(detail, status, "Incorrect email or password. Please try again.");
    }

    if (status === 404) {
        throw createError(detail, status, "We could not find this account. Please sign up first.");
    }

    if (status === 409) {
        throw createError(detail, status, "This email is already registered. Please sign in instead.");
    }

    if (status === 422) {
        throw createError(detail, status, "Some details are missing or invalid. Please check your form and try again.");
    }

    if (status >= 500) {
        throw createError(detail, status, "Server is busy right now. Please try again in a moment.");
    }

    throw createError(detail, status, "Request failed. Please try again.");
};

const postJson = async (path, payload, fallbackMessage) => {
    let res;

    try {
        res = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        throw createError(
            "Failed to fetch",
            0,
            "Unable to connect to server. Please check internet/backend and try again."
        );
    }

    if (!res.ok) await parseError(res, fallbackMessage);
    return res.json();
};

export const getAuthHeaders = () => {
    const token = getSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authFetch = (url, options = {}) => {
    const headers = {
        ...(options.headers || {}),
        ...getAuthHeaders(),
    };

    return fetch(url, { ...options, headers });
};

export const signup = async (data) => {
    return postJson("/signup", data, "Signup failed");
};

export const signin = async (data) => {
    const payload = await postJson("/signin", data, "Signin failed");
    if (payload?.access_token) {
        setSessionToken(payload.access_token);
    }

    return payload;
};

export const fetchMe = async () => {
    const token = getSessionToken();
    if (!token) {
        throw createError("Missing auth token", 401, "Please sign in again to load profile details.");
    }

    const usersApiBase = import.meta.env.DEV ? "/api/v1/users" : `${BASE_URL}/api/v1/users`;
    const candidates = [
        `${API_BASE}/me`,
        `${API_BASE}/me/`,
        `${usersApiBase}/self`,
        `${usersApiBase}/self/`,
    ];
    let lastError = null;

    for (const endpoint of candidates) {
        try {
            const res = await authFetch(endpoint, {
                headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                await parseError(res, "Unable to load profile.");
            }

            const payload = await res.json();
            const normalized = payload?.user || payload?.data || payload;
            if (normalized && typeof normalized === "object") {
                return normalized;
            }
            return {};
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError?.userMessage) {
        throw lastError;
    }

    throw createError("Failed to fetch", 0, "Unable to load profile right now.");
};

export const logout = async () => {
    const token = getSessionToken();
    if (!token) {
        clearSessionToken();
        return { status: "ok" };
    }

    let res;
    try {
        res = await fetch(`${API_BASE}/logout?token=${encodeURIComponent(token)}`, {
            method: "POST",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
    } catch {
        // Even if backend is unreachable, clear local token.
        clearSessionToken();
        return { status: "ok", message: "Local session cleared." };
    }

    clearSessionToken();
    if (!res.ok) {
        return { status: "ok", message: "Local session cleared." };
    }

    try {
        return await res.json();
    } catch {
        return { status: "ok" };
    }
};