import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const SignUpProvider = () => {

    const navigate = useNavigate()
    const [form, setform] = useState({ name: '', email: '', password: '', })
    const [errorMsg, setErrorMsg] = useState(null)

    useEffect(() => {
        sessionStorage.removeItem('modalOpened');
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await response.json()

            if (response.ok) {
                Swal.fire({
                    title: "Registered successfully!",
                    text: "Your account has been created. Opening login...",
                    icon: "success",
                    confirmButtonText: "Go to Login",
                    confirmButtonColor: "#035aa6"
                }).then((result) => {
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
            Swal.fire({
                title: "Network Error",
                text: "Network error. Please try again.",
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className="card shadow-lg border-0 animate-fade-in-up">
                            <div className="card-header bg-gradient text-white text-center py-4">
                                <h3 className="mb-0">
                                    <i className="bi bi-person-plus-fill me-2"></i>
                                    SIGN UP PROVIDER
                                </h3>
                                <p className="mb-0 mt-2 opacity-75 d-none d-md-block">
                                    Create your account to get started
                                </p>
                                <p className="mb-0 mt-2 opacity-75 d-block d-md-none small">
                                    Join us today
                                </p>
                            </div>
                            <div className="card-body p-3 p-md-4">
                                <form onSubmit={handleRegister}>
                                    <div className="mb-4">
                                        <label htmlFor="inputName" className="form-label fw-semibold">
                                            <i className="bi bi-person me-1"></i> Full Name
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-person"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                id="inputName"
                                                placeholder="Enter your full name"
                                                onChange={handleChange}
                                                name="name"
                                                value={form.name}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="inputEmail" className="form-label fw-semibold">
                                            <i className="bi bi-envelope me-1"></i> Email Address
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-envelope"></i>
                                            </span>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg"
                                                id="inputEmail"
                                                placeholder="Enter your email"
                                                onChange={handleChange}
                                                name="email"
                                                value={form.email}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="inputPassword" className="form-label fw-semibold">
                                            <i className="bi bi-lock me-1"></i> Password
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-lock"></i>
                                            </span>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg"
                                                id="inputPassword"
                                                placeholder="Create a strong password"
                                                onChange={handleChange}
                                                name="password"
                                                value={form.password}
                                                required
                                                minLength="6"
                                            />
                                        </div>
                                        <div className="form-text">Minimum 6 characters</div>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary btn-lg">
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Sign Up
                                        </button>
                                    </div>
                                </form>

                                <div className="text-center mt-4">
                                    <p className="mb-0 text-muted">
                                        Already have an account?
                                        <button
                                            className="btn btn-link p-0 ms-1 text-decoration-none"
                                            onClick={() => {
                                                navigate("/?openLogin=true");
                                            }}
                                        >
                                            Login here
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