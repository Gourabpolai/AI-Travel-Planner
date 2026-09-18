import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, sendOtp } from "../api/authApi";

export const isTokenExpired = (token) => {
    if (!token || typeof token !== "string") return true;
    try {
        const parts = token.split(".");
        if (parts.length < 2) return true;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (!payload || typeof payload.exp !== "number") {
            return false;
        }
        const nowInSeconds = Math.floor(Date.now() / 1000);
        return payload.exp <= nowInSeconds;
    } catch {
        return true;
    }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        const t = localStorage.getItem("token");
        return t && !isTokenExpired(t) ? t : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!storedToken) {
            if (storedUser) {
                localStorage.removeItem("user");
            }
            setUser(null);
            setToken(null);
        } else if (isTokenExpired(storedToken)) {
            console.warn("TripSync: Stored JWT session has expired. Clearing invalid auth state.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setToken(null);
        } else if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (e) {
                console.error("TripSync: Error parsing stored user:", e);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
                setToken(null);
            }
        } else {
            setUser(null);
            setToken(null);
        }

        setLoading(false);
    }, []);

    // Listen for 401 session expiration dispatched by Axios response interceptor
    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
        };

        window.addEventListener("tripsync:session-expired", handleSessionExpired);
        return () => {
            window.removeEventListener("tripsync:session-expired", handleSessionExpired);
        };
    }, []);

    const login = (userData, jwtToken) => {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userData));

        setToken(jwtToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    const signIn = async (email, password) => {
        try {
            const data = await loginUser({ email, password });
            login(data.user, data.token);
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err.response?.data?.message || err.message || "Failed to sign in" };
        }
    };

    const signUp = async (nameOrData, email, password, otp) => {
        try {
            let payload;
            if (typeof nameOrData === 'object' && nameOrData !== null) {
                payload = nameOrData;
            } else {
                payload = { name: nameOrData, email, password, otp };
            }
            const data = await registerUser(payload);
            login(data.user, data.token);
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err.response?.data?.message || err.message || "Failed to sign up" };
        }
    };

    const requestOtp = async (email) => {
        try {
            const data = await sendOtp(email);
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err.response?.data?.message || err.message || "Failed to send OTP" };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                session: token ? { user } : null,
                loading,
                login,
                logout,
                signOut: logout,
                signIn,
                signUp,
                requestOtp,
                isAuthenticated: !!token && !isTokenExpired(token),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);