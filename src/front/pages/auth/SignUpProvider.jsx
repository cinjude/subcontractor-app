// src/front/pages/auth/SignUpProvider.jsx
// PATCHED — cleans up any Bootstrap modal state left over from the home page

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const SignUpProvider = () => {

    const navigate = useNavigate()
    const [form, setform] = useState({ name: '', email: '', password: '', })
    const [errorMsg, setErrorMsg] = useState(null)

    useEffect(() => {
        // ── CRITICAL: clean up any Bootstrap modal backdrop left from home page ──
        // This fires when user navigates from home page modal to signup page
        const cleanup = () => {
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            sessionStorage.removeItem('modalOpened');
        };
        cleanup();

        // Also cleanup on unmount
        return cleanup;
    }, []);

    const handleChange = (e) => {
        setform({ ...form, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/provider/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await response.json()

            if (response.ok) {
                Swal.fire({
                    title: "Registered successfully!",
                    text: "Your account has been created.",
                    icon: "success",
                    confirmButtonText: "Go to Login",
                    confirmButtonColor: "#1e3a5f"
                }).then(() => {
                    navigate("/?openLogin=true");
                });
            } else {
                const errorMessage = data.msg || data.error || data.message || "There was an issue with your registration.";
                setErrorMsg(errorMessage);
                Swal.fire({
                    title: "Error",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }

        } catch (error) {
            console.error("Error connexion when sign up.", error);
            setErrorMsg("Network error. Please try again.");
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5">
                        <div className="card shadow border-0" style={{ borderRadius: 16, overflow: "hidden" }}>
                            <div className="card-header text-white text-center py-4 border-0" style={{ background: "#0f2340" }}>
                                <h3 className="mb-0 fw-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: ".04em", fontSize: 24 }}>
                                    Create your account
                                </h3>
                                <p className="mb-0 mt-2 opacity-75 small">Start your free TradeQuote account</p>
                            </div>
                            <div className="card-body p-4">
                                {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}
                                <form onSubmit={handleRegister}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Full Name</label>
                                        <input type="text" className="form-control form-control-lg" placeholder="Enter your full name" onChange={handleChange} name="name" value={form.name} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Email Address</label>
                                        <input type="email" className="form-control form-control-lg" placeholder="Enter your email" onChange={handleChange} name="email" value={form.email} required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold small">Password</label>
                                        <input type="password" className="form-control form-control-lg" placeholder="Create a strong password" onChange={handleChange} name="password" value={form.password} required minLength="6" />
                                        <div className="form-text">Minimum 6 characters</div>
                                    </div>
                                    <div className="d-grid">
                                        <button type="submit" className="btn btn-lg text-white fw-bold" style={{ background: "#16a34a", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 8 }}>
                                            Create free account
                                        </button>
                                    </div>
                                </form>
                                <div className="text-center mt-4 pt-3 border-top">
                                    <p className="mb-0 text-muted small">
                                        Already have an account?{" "}
                                        <button className="btn btn-link p-0 text-decoration-none fw-bold" style={{ color: "#1e3a5f" }} onClick={() => navigate("/?openLogin=true")}>
                                            Sign in here
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}