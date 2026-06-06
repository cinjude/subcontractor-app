import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginProvider } from "../pages/LoginProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Navbar = () => {

	const { store, dispatch } = useGlobalReducer()
	const navigate = useNavigate()
	const location = useLocation();
	if (location.pathname === "/") return null;

	console.log('este es store.provider del store:', store.provider)

	const handleLogout = () => {

		localStorage.removeItem('provider'),
			localStorage.removeItem('token')
		sessionStorage.removeItem('modalOpened'); // Limpiar también el modal
		dispatch({ type: 'logout' })
		navigate("/?openLogin=true");
	}

	// Limpiar modal al desmontar o cambiar de ruta
	useEffect(() => {
		return () => {
			const modalElement = document.getElementById('loginModal');
			if (modalElement) {
				const modal = window.bootstrap.Modal.getInstance(modalElement);
				if (modal) {
					modal.hide();
				}
			}
			// Limpiar cualquier backdrop residual
			const backdrop = document.querySelector('.modal-backdrop');
			if (backdrop) backdrop.remove();
			document.body.classList.remove('modal-open');
			document.body.style.overflow = 'auto';
		};
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(location.search);

		// Solo abrir el modal si viene de otra página (no al recargar)
		const shouldOpenModal = params.get("openLogin") === "true" &&
			!sessionStorage.getItem('modalOpened');

		if (shouldOpenModal) {
			// Pequeño delay para asegurar que el DOM esté listo
			setTimeout(() => {
				// Limpiar cualquier modal backdrop existente primero
				const existingBackdrop = document.querySelector('.modal-backdrop');
				if (existingBackdrop) {
					existingBackdrop.remove();
				}
				document.body.classList.remove('modal-open');
				document.body.style.overflow = 'auto';

				const modalElement = document.getElementById('loginModal');
				if (modalElement) {
					const busModal = new window.bootstrap.Modal(modalElement);
					busModal.show();

					sessionStorage.setItem('modalOpened', 'true');
				}
			}, 100);
		}

		if (params.get("openLogin") === "true") {
			const newUrl = window.location.pathname;
			window.history.replaceState({}, '', newUrl);
		}
	}, [location]);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		if (params.get('action') === 'login') {

			const loginButton = document.querySelector('[data-bs-target="#loginModal"]');
			if (loginButton) loginButton.click();

			window.history.replaceState({}, document.title, "/");
		}
	}, [location]);

	return (
		<nav className="navbar bg-body-tertiary">
			<div className="container-fluid">
				<a className="navbar-brand">Navbar</a>
				<div className="d-flex align-items-center">
					{
						!store.provider ? (
							<button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
								<span>  <FontAwesomeIcon icon={faUser} size="" color="" /> </span> SIGN IN
							</button>
						) : (
							<div className="dropdown">
								<button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
									{store.provider?.name || store.provider?.email || User}
								</button>
								<ul className="dropdown-menu mt-2">
									<li ><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
								</ul>
							</div>
						)
					}
				</div>

				<div className="modal fade" id="loginModal" tabIndex="-1" aria-hidden="true">
					<div className="modal-dialog modal-dialog-scrollable">
						<div className="modal-content pb-4">
							<div className="modal-header">
								<h1 className="modal-title fs-5" id="staticBackdropLabel">SIGN IN</h1>
								<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							<div className="modal-body">
								<LoginProvider />
							</div>
							<div>
								<h5 className="p-3"> If you don't have an account:</h5>
							</div>
							<div className="text-center p-2">
								<Link
									className="border border-primary rounded-1 p-3 text-decoration-none"
									to={'/signupprovider'}
									onClick={(e) => {
										e.preventDefault();
										// Cerrar el modal
										const modalElement = document.getElementById('loginModal');
										if (modalElement) {
											const modal = window.bootstrap.Modal.getInstance(modalElement);
											if (modal) {
												modal.hide();
											} else {
												// Método alternativo para cerrar
												modalElement.classList.remove('show');
												modalElement.style.display = 'none';
												const backdrop = document.querySelector('.modal-backdrop');
												if (backdrop) backdrop.remove();
												document.body.classList.remove('modal-open');
												document.body.style.overflow = 'auto';
											}
										}
										// Navegar a signup
										navigate('/signupprovider');
									}}
								>
									<strong>SIGN UP HERE</strong>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</nav >
	);
};