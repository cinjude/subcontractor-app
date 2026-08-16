import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";
import useSessionTimeout from "../../hooks/useSessionTimeout.js";
import { refreshAccessToken } from "./services/authService.js";
import SessionWarningModal from "./SessionWarningModal.jsx";

export default function SessionGuard({ children }) {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);

    const handleLogout = useCallback(() => {
        setShowWarning(false);
        dispatch({ type: "logout" });
        navigate("/");
    }, [dispatch, navigate]);

    const handleWarning = useCallback(() => {
        setShowWarning(true);
    }, []);

    const handleStayLoggedIn = async () => {
        try {
            const newToken = await refreshAccessToken(store.refreshToken);
            dispatch({ type: "refresh-token", payload: newToken });
            setShowWarning(false);
            // resets the idle timers naturally because this counts as "activity" via the button click
        } catch (err) {
            console.error("Could not refresh on demand", err);
            handleLogout();
        }
    };

    useSessionTimeout({ onWarning: handleWarning, onLogout: handleLogout });

    return (
        <>
            {children}
            <SessionWarningModal
                show={showWarning}
                onStayLoggedIn={handleStayLoggedIn}
                onLogoutNow={handleLogout}
            />
        </>
    );
}


