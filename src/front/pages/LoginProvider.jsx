import { useState } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const LoginProvider = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    const { store, dispatch } = useGlobalReducer();

    const navigate = useNavigate()

    const closeModal = () => {
        const modalElement = document.getElementById('loginModal');
        if (modalElement) {
            const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement);
            if (bootstrapModal) {
                bootstrapModal.hide();
            } else {
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = 'auto';
            }
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/provider/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            const data = await resp.json()

            if (resp.ok) {

                const enrichedProvider = {
                    ...data.provider,
                    contractorInfo: {
                        businessName: data.provider.businessName || data.provider.name || "",
                        phone: data.provider.phone || "",
                        email: data.provider.email || "",
                        address: data.provider.address || ""
                    }
                }

                localStorage.setItem('name', data.provider.name)
                localStorage.setItem('provider', JSON.stringify(enrichedProvider))
                localStorage.setItem('token', data.token)
                localStorage.setItem('refreshToken', data.refresh_token)

                dispatch({
                    type: 'login-provider',
                    payload: {
                        provider: enrichedProvider,
                        token: data.token
                    }
                })

                closeModal();

                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Login succesfully",
                    showConfirmButton: false,
                    timer: 1500
                });

                console.log('Provider logged in:', enrichedProvider);

                navigate('/providerDashboard')
            } else {
                setErrorMessage(data.msg)
            }

        } catch (error) {
            console.error('Error de connexion en el servidedor', error)
            setErrorMessage('Error de connexion al servidedor')
        }

    }

    return (
        <div>
            {errorMessage && (
                <div className="alert alert-danger">
                    {errorMessage}
                </div>
            )}
            <form onSubmit={handleLogin}
                className="row g-3">
                <div className="col-12">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" id="inputEmail4"
                        onChange={(e) => setEmail(e.target.value)} value={email}
                    />
                </div>
                <div className="col-12">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" id="inputPassword4"
                        onChange={(e) => setPassword(e.target.value)} value={password}
                    />
                </div>
                <div className="col-12 text-center">
                    <button type="submit" className="ps-4 pe-4 btn btn-primary fs-3" >Sign in</button>
                </div>
            </form>
            <div className="text-center mt-2">
                <button className="bg-white border-top-0 border-start-0 border-end-0 border-bottom border-danger">Create/Forgot password</button>
            </div>
        </div>
    )
}
