import { useEffect, useState } from "react";

export default function SessionWarningModal({ show, onStayLoggedIn, onLogoutNow }) {
    const [secondsLeft, setSecondsLeft] = useState(5 * 60); // 5 min grace period shown to user

    useEffect(() => {
        if (!show) return;

        setSecondsLeft(5 * 60);
        const interval = setInterval(() => {
            setSecondsLeft(s => (s > 0 ? s - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [show]);

    if (!show) return null;

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Session about to expire</h5>
                    </div>
                    <div className="modal-body">
                        <p>You've been inactive for a while. For your security, you'll be logged out in:</p>
                        <p className="fs-4 fw-bold text-center">
                            {minutes}:{seconds.toString().padStart(2, "0")}
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-outline-secondary" onClick={onLogoutNow}>
                            Log out now
                        </button>
                        <button className="btn btn-dark" onClick={onStayLoggedIn}>
                            Stay logged in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}