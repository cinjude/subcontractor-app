// src/front/pages/Home.jsx
// Full landing page using Bootstrap 5 + your existing LoginProvider

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { LoginProvider } from "./auth/LoginProvider";
import './home.css';

export const Home = () => {
	const { store } = useGlobalReducer();
	const navigate = useNavigate();
	const location = useLocation();

	// Cleanup: always remove modal backdrop on mount/unmount
	useEffect(() => {
		const cleanup = () => {
			document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
			document.body.classList.remove("modal-open");
			document.body.style.overflow = "";
			document.body.style.paddingRight = "";
			sessionStorage.removeItem("modalOpened");
		};
		cleanup(); // Clean on mount in case coming back from signup page
		return cleanup; // Clean on unmount
	}, []);

	// Open login modal if redirected with ?openLogin=true or ?action=login
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		if (params.get("openLogin") === "true" || params.get("action") === "login") {
			window.history.replaceState({}, "", "/");
			setTimeout(() => {
				const el = document.getElementById("loginModalHome");
				if (el && window.bootstrap) {
					document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
					document.body.classList.remove("modal-open");
					document.body.style.overflow = "";
					document.body.style.paddingRight = "";
					const modal = new window.bootstrap.Modal(el, { backdrop: true, keyboard: true });
					modal.show();
				}
			}, 200);
		}
	}, [location]);

	// Redirect if already logged in
	useEffect(() => {
		if (store.provider) navigate("/providerDashboard");
	}, [store.provider]);

	const openLogin = () => {
		const el = document.getElementById("loginModalHome");
		if (el && window.bootstrap) {
			document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
			document.body.classList.remove("modal-open");
			document.body.style.overflow = "";
			new window.bootstrap.Modal(el).show();
		}
	};

	return (
		<>
			{/* ── NAVBAR ── */}
			<nav className="navbar navbar-expand-lg sticky-top tq-navbar shadow-sm">
				<div className="container-fluid px-4 px-lg-5">
					<Link className="navbar-brand" to="/">
						<div className="tq-nav-logo-icon">
							<svg viewBox="0 0 24 24"><path d="M3 12L12 3l9 9v9H3z" /></svg>
						</div>
						Trade<em>Quote</em>
					</Link>
					<button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#tqNavbar">
						<span className="navbar-toggler-icon" />
					</button>
					<div className="collapse navbar-collapse" id="tqNavbar">
						<ul className="navbar-nav mx-auto">
							<li className="nav-item"><a className="nav-link text-success" href="#features">Features</a></li>
							<li className="nav-item"><a className="nav-link text-warning" href="#how">How it works</a></li>
							<li className="nav-item"><a className="nav-link" href="#portfolio">Portfolio</a></li>
							<li className="nav-item "><a className="nav-link fs-2 text-success" href="#pricing">Pricing</a></li>
						</ul>
						<div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
							{store.provider ? (
								<button className="btn tq-btn-nav-cta" onClick={() => navigate("/providerDashboard")}>
									Dashboard →
								</button>
							) : (
								<>
									<button className="btn tq-btn-nav-signin" onClick={openLogin}>
										Sign in
									</button>
									<button className="btn tq-btn-nav-cta" onClick={() => navigate("/signupprovider")}>
										Get started free
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* ── HERO ── */}
			<section className="tq-hero">
				<div className="tq-hero-grid" />
				<div className="container-fluid px-4 px-lg-5" style={{ position: "relative", zIndex: 2 }}>
					<div className="row align-items-center g-5">
						{/* Left */}
						<div className="col-12 col-lg-6">
							<div className="tq-hero-eyebrow">
								<div className="tq-pulse" />
								Built for painters &amp; flooring pros
							</div>
							<h1 className="tq-hero">
								Run your<br />trade business<br /><span className="tq-accent">like a pro.</span>
							</h1>
							<p className="tq-hero-desc">
								Estimates, invoices, jobs, customers, and a stunning public portfolio — everything your painting or flooring business needs, in one simple dashboard.
							</p>
							<div className="d-flex flex-wrap gap-3">
								<button className="btn tq-btn-hero" onClick={() => navigate("/signupprovider")}>
									⚡ Start free today
								</button>
								<a className="btn tq-btn-hero-out" href="#how">
									See how it works ↓
								</a>
							</div>
							<div className="tq-hero-trust">
								<div className="tq-trust-pill">
									<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									No credit card required
								</div>
								<div className="tq-trust-pill">
									<svg viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
									Works on any device
								</div>
								<div className="tq-trust-pill">
									<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
									Setup in 5 minutes
								</div>
							</div>
						</div>

						{/* ── MOBILE MOCKUP: visible only below lg, sits under hero text ── */}
						<div className="col-12 d-lg-none mt-4">
							<div className="tq-mockup-card mx-auto" style={{ maxWidth: 400 }}>
								<div className="tq-mockup-bar">
									<div className="tq-wdot" style={{ background: "#ef4444" }} />
									<div className="tq-wdot" style={{ background: "#f59e0b", marginLeft: 4 }} />
									<div className="tq-wdot" style={{ background: "#22c55e", marginLeft: 4 }} />
									<div className="tq-mockup-url">tradequote.app/dashboard</div>
								</div>
								<div className="tq-mockup-body">
									<div className="d-flex justify-content-between align-items-center mb-2">
										<span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 800, color: "#1e3a5f", textTransform: "uppercase" }}>Welcome back,  Artllen</span>
										<small style={{ color: "#94a3b8" }}>June 2026</small>
									</div>
									<div className="tq-mockup-metrics mb-3">
										<div className="tq-metric-box"><div className="tq-metric-val">$14.2k</div><div className="tq-metric-lbl">Revenue</div></div>
										<div className="tq-metric-box"><div className="tq-metric-val">9</div><div className="tq-metric-lbl">Jobs</div></div>
										<div className="tq-metric-box"><div className="tq-metric-val">31</div><div className="tq-metric-lbl">Estimates</div></div>
									</div>
									<div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 8 }}>Recent requests</div>
									{[
										{ init: "SJ", bg: "#1e3a5f", name: "Sarah Johnson", type: "Interior painting", amount: "$3,200", cls: "tq-s-new", st: "New" },
										{ init: "MW", bg: "#16a34a", name: "Mike Wilson", type: "Hardwood flooring", amount: "$7,200", cls: "tq-s-sent", st: "Sent" },
										{ init: "LD", bg: "#d97706", name: "Lisa Davis", type: "Exterior painting", amount: "$4,800", cls: "tq-s-pend", st: "Pending" },
									].map((r, idx) => (
										<div key={idx} className="tq-est-row">
											<div className="d-flex align-items-center gap-2">
												<div className="tq-est-av" style={{ background: r.bg }}>{r.init}</div>
												<div>
													<div style={{ fontSize: 12, fontWeight: 700, color: "#1a2332" }}>{r.name}</div>
													<div style={{ fontSize: 10, color: "#94a3b8" }}>{r.type}</div>
												</div>
											</div>
											<div className="text-end">
												<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 900, color: "#1e3a5f" }}>{r.amount}</div>
												<span className={`tq-status ${r.cls}`}>{r.st}</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Right — Dashboard Mockup (desktop) */}
						<div className="col-12 col-lg-6 d-none d-lg-block">
							<div style={{ position: "relative" }}>
								<div className="tq-notif-float">
									<div className="tq-notif-live" />
									<div>
										<div style={{ fontSize: 12, fontWeight: 700, color: "#1a2332" }}>New estimate request!</div>
										<div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>Sarah M. — Interior painting · just now</div>
									</div>
								</div>
								<div className="tq-mockup-card">
									<div className="tq-mockup-bar">
										<div className="tq-wdot" style={{ background: "#ef4444" }} />
										<div className="tq-wdot" style={{ background: "#f59e0b", marginLeft: 4 }} />
										<div className="tq-wdot" style={{ background: "#22c55e", marginLeft: 4 }} />
										<div className="tq-mockup-url">tradequote.app/dashboard</div>
									</div>
									<div className="tq-mockup-body">
										<div className="d-flex justify-content-between align-items-center mb-3">
											<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 800, color: "#1e3a5f", textTransform: "uppercase" }}>Welcome back, John</div>
											<small style={{ color: "#94a3b8" }}>June 2026</small>
										</div>
										<div className="tq-mockup-metrics">
											<div className="tq-metric-box"><div className="tq-metric-val">$14.2k</div><div className="tq-metric-lbl">Revenue</div></div>
											<div className="tq-metric-box"><div className="tq-metric-val">9</div><div className="tq-metric-lbl">Jobs</div></div>
											<div className="tq-metric-box"><div className="tq-metric-val">31</div><div className="tq-metric-lbl">Estimates</div></div>
										</div>
										<div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 8 }}>Recent requests</div>
										{[
											{ init: "JC", bg: "#1e3a5f", name: "Jamson Cane", type: "Interior painting", amount: "$3,200", cls: "tq-s-new", st: "New" },
											{ init: "RJ", bg: "#16a34a", name: "Roberto James ", type: "Hardwood flooring", amount: "$7,200", cls: "tq-s-sent", st: "Sent" },
											{ init: "LD", bg: "#d97706", name: "Lisa Davis", type: "Exterior painting", amount: "$4,800", cls: "tq-s-pend", st: "Pending" },
										].map((r, i) => (
											<div key={i} className="tq-est-row">
												<div className="d-flex align-items-center gap-2">
													<div className="tq-est-av" style={{ background: r.bg }}>{r.init}</div>
													<div>
														<div style={{ fontSize: 12, fontWeight: 700, color: "#1a2332" }}>{r.name}</div>
														<div style={{ fontSize: 10, color: "#94a3b8" }}>{r.type}</div>
													</div>
												</div>
												<div className="text-end">
													<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 900, color: "#1e3a5f" }}>{r.amount}</div>
													<span className={`tq-status ${r.cls}`}>{r.st}</span>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── TRUST STRIP ── */}
			<div className="tq-trust-strip">
				<div className="tq-ts-inner">
					{[
						{ svg: <path d="M13 2L3 14h9l-1 8 10-12h-9z" />, text: "Setup in 5 minutes" },
						{ svg: <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />, text: "Works on any device" },
						{ svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, text: "Secure & private" },
						{ svg: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" />, text: "Built for US contractors" },
						{ svg: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />, text: "Real human support" },
					].map((t, i) => (
						<div key={i} className="tq-ts-item">
							<div className="tq-ts-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">{t.svg}</svg>
							</div>
							{t.text}
						</div>
					))}
				</div>
			</div>

			{/* ── FEATURES ── */}
			<section className="tq-section" id="features" style={{ background: "#fafbfd" }}>
				<div className="container-fluid px-4 px-lg-5">
					<div className="text-center mb-5">
						<div className="tq-sec-label">Everything you need</div>
						<div className="tq-sec-title">Stop losing money to<br />disorganized work</div>
						<p className="tq-sec-body mx-auto" style={{ maxWidth: 560 }}>
							TradeQuote gives painters and flooring contractors every tool to win more jobs, get paid faster, and look professional to every client.
						</p>
					</div>
					<div className="row g-4">
						{[
							{ bg: "#1e3a5f", svg: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />, title: "Smart estimates", desc: "Create detailed estimates in minutes. Sqft calculator, flooring materials, labor rates, and tax — automated. Send as PDF via email.", tag: "Saves 2hrs per estimate" },
							{ bg: "#16a34a", svg: <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />, title: "Job management", desc: "Track every job from lead to final payment. Set milestones, upload site photos, and keep every client in the loop automatically.", tag: "Zero missed deadlines" },
							{ bg: "#1e3a5f", svg: <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />, title: "Invoices & billing", desc: "Convert estimates to invoices in one click. Send branded PDF invoices via email. Clients pay faster when it looks professional.", tag: "Get paid 3x faster" },
							{ bg: "#1e3a5f", svg: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" />, title: "Customer CRM", desc: "Keep all your clients organized. Full history of jobs, estimates, and invoices per customer. Never forget a follow-up again.", tag: "All history in one place" },
							{ bg: "#16a34a", svg: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />, title: "Public portfolio", desc: "Get a stunning public website with your work photos, before & after drag sliders, and a built-in estimate request form.", tag: "Win clients while you sleep" },
							{ bg: "#1e3a5f", svg: <path d="M18 20V10M12 20V4M6 20v-6" />, title: "Business insights", desc: "See your revenue, top services, and job pipeline at a glance. Make smarter pricing and service decisions.", tag: "Know your numbers" },
						].map((f, i) => (
							<div key={i} className="col-12 col-sm-6 col-lg-4">
								<div className="tq-feat-card">
									<div className="tq-feat-icon" style={{ background: f.bg }}>
										<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">{f.svg}</svg>
									</div>
									<div className="tq-feat-title">{f.title}</div>
									<div className="tq-feat-desc">{f.desc}</div>
									<div className="tq-feat-tag">{f.tag}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── HOW IT WORKS ── */}
			<section className="tq-section" id="how" style={{ background: "#fff", borderTop: "1px solid #e2e8f0" }}>
				<div className="container-fluid px-4 px-lg-5">
					<div className="mb-5">
						<div className="tq-sec-label">How it works</div>
						<div className="tq-sec-title">From lead to payment<br />in 4 simple steps</div>
						<p className="tq-sec-body" style={{ maxWidth: 500 }}>No learning curve. Just a clean workflow built around how painters and flooring contractors actually work.</p>
					</div>
					<div className="row g-5 align-items-center">
						<div className="col-12 col-lg-5">
							{[
								{ t: "Client submits request", d: "Client fills your portfolio form or you add them manually. Full contact info lands in your dashboard instantly with a notification." },
								{ t: "Build & send the estimate", d: "Use the built-in calculator for painting sqft or flooring materials. Set your rates once, reuse forever. Send a branded PDF in under 5 minutes." },
								{ t: "Job approved — work begins", d: "Convert the estimate to an active job with one click. Track progress, upload photos, and keep your client updated automatically." },
								{ t: "Invoice & get paid", d: "Convert the job to an invoice in seconds. Send via email as PDF. Once paid, add photos to your portfolio and win the next client." },
							].map((s, i) => (
								<div key={i} className={`tq-step ${i === 0 ? "active" : ""}`}>
									<div className="tq-step-num">{i + 1}</div>
									<div>
										<div className="tq-step-title">{s.t}</div>
										<div className="tq-step-desc">{s.d}</div>
									</div>
								</div>
							))}
						</div>
						<div className="col-12 col-lg-7">
							<div className="tq-how-preview">
								<div className="tq-how-top">
									<div className="tq-wdot" style={{ background: "#ef4444" }} />
									<div className="tq-wdot" style={{ background: "#f59e0b", marginLeft: 4 }} />
									<div className="tq-wdot" style={{ background: "#22c55e", marginLeft: 4 }} />
									<span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.55)", marginLeft: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Estimate Requests</span>
								</div>
								<div className="p-4">
									{[
										{ name: "Chachoo Cintil", type: "Interior painting · 1,400 sqft", amount: "$3,200", cls: "tq-s-new", st: "New" },
										{ name: "Djim Cadly", type: "Hardwood flooring · 900 sqft", amount: "$7,200", cls: "tq-s-sent", st: "Sent" },
										{ name: "Lisa Davis", type: "Exterior painting · 2,100 sqft", amount: "$4,800", cls: "tq-s-pend", st: "Pending" },
										{ name: "Tom Brown", type: "Vinyl flooring · 600 sqft", amount: "$2,100", cls: "tq-s-sent", st: "Sent" },
									].map((r, i) => (
										<div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: i < 3 ? "1px solid #f8fafc" : "none" }}>
											<div>
												<div style={{ fontSize: 13, fontWeight: 700, color: "#1a2332" }}>{r.name}</div>
												<div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em" }}>{r.type}</div>
											</div>
											<div className="text-end">
												<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 900, color: "#1e3a5f" }}>{r.amount}</div>
												<span className={`tq-status ${r.cls}`}>{r.st}</span>
											</div>
										</div>
									))}
									<div className="d-flex justify-content-between align-items-center mt-3 p-3 rounded" style={{ background: "#f8fafc" }}>
										<span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Total pipeline</span>
										<span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: "#16a34a" }}>$17,300</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── PORTFOLIO ── */}
			<section className="tq-section tq-port-section" id="portfolio">
				<div className="container-fluid px-4 px-lg-5">
					<div className="row g-5 align-items-center">
						<div className="col-12 col-lg-6">
							<div className="tq-sec-label" style={{ color: "#4ade80" }}>Public portfolio</div>
							<div className="tq-sec-title" style={{ color: "#fff" }}>Your work deserves<br />to be seen</div>
							<p className="tq-sec-body mb-4" style={{ color: "rgba(255,255,255,.6)" }}>Every TradeQuote account includes a beautiful public portfolio page — your own professional website, ready to share with clients and on social media instantly.</p>
							{[
								{ t: "Before & after drag sliders", d: "Interactive comparison sliders that show clients exactly what your work looks like", svg: <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /> },
								{ t: "Built-in estimate request form", d: "Clients request estimates directly from your portfolio — lands in your dashboard with a notification", svg: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
								{ t: "Your colors, your brand", d: "Choose your hero color, button accent, logo, and cover photo. Looks like a $5,000 website in 10 minutes", svg: <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /> },
								{ t: "One link to share everywhere", d: "Share on WhatsApp, Facebook, Instagram, or text. Win clients 24/7 without extra effort", svg: <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /> },
							].map((p, i) => (
								<div key={i} className="tq-port-list-item">
									<div className="tq-port-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">{p.svg}</svg>
									</div>
									<div>
										<div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.t}</div>
										<div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>{p.d}</div>
									</div>
								</div>
							))}
						</div>
						{/* Portfolio mockup */}
						<div className="col-12 col-lg-6">
							<div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 28px 70px rgba(0,0,0,.5)" }}>
								<div className="d-flex align-items-center justify-content-between p-3" style={{ background: "#1e3a5f" }}>
									<div className="d-flex align-items-center gap-2">
										<div style={{ width: 34, height: 34, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>AP</div>
										<div>
											<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: ".06em" }}>Avila Pro Painting</div>
											<div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em" }}>Quality · Detail · Trust</div>
										</div>
									</div>
									<div style={{ background: "#16a34a", color: "#fff", padding: "6px 12px", borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>Free estimate</div>
								</div>
								<div style={{ background: "linear-gradient(135deg,#0f2340,#1e3a5f)", padding: "20px 18px" }}>
									<div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 6 }}>Professional Contractor</div>
									<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1, marginBottom: 8 }}>We bring<br />color to life.</div>
									<div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginBottom: 12 }}>Professional painting & flooring · Dover, DE</div>
									<div style={{ background: "#16a34a", color: "#fff", padding: "6px 12px", borderRadius: 4, fontSize: 10, fontWeight: 800, display: "inline-block", textTransform: "uppercase", letterSpacing: ".06em" }}>Request estimate →</div>
								</div>
								<div style={{ background: "#fff", padding: "14px 18px" }}>
									<div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: "#1e3a5f", textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>Before &amp; After</div>
									<div className="row g-1">
										{[["#64748b", "🏚️", "Before"], ["#2a4f7c", "🏠", "After"], ["#92400e", "🪵", "Before"], ["#166534", "✨", "After"]].map(([bg, e, label], i) => (
											<div key={i} className="col-6">
												<div style={{ background: `linear-gradient(135deg,${bg}88,${bg})`, borderRadius: 6, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, position: "relative" }}>
													{e}
													<div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 7, fontWeight: 800, padding: "2px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
									<small style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 10 }}>tradequote.app/avila-pro</small>
									<div className="d-flex gap-1">
										{[["#25D366", "W"], ["#1877F2", "f"], ["#E4405F", "ig"]].map(([bg, l], i) => (
											<div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 800 }}>{l}</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── PRICING ── */}
			<section className="tq-section" id="pricing" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
				<div className="container-fluid px-4 px-lg-5">
					<div className="text-center mb-5">
						<div className="tq-sec-label">Simple pricing</div>
						<div className="tq-sec-title">No contracts.<br />No surprises.</div>
						<p className="tq-sec-body mx-auto" style={{ maxWidth: 500 }}>Start free and upgrade when you're ready. Every plan includes your public portfolio website and mobile access.</p>
					</div>
					<div className="row g-4 justify-content-center">
						{[
							{ name: "Starter", price: "0", desc: "Perfect to get started and see if TradeQuote fits your workflow.", features: ["5 estimates per month", "3 active jobs", "Customer CRM", "Public portfolio page"], off: ["Invoices", "PDF email delivery", "Business analytics"], btn: "Get started free", primary: false },
							{ name: "Professional", price: "$$", desc: "For active contractors ready to grow and get paid faster every week.", features: ["Unlimited estimates", "Unlimited jobs", "Customer CRM", "Public portfolio page", "Invoices & PDF email", "Business analytics", "Priority support"], off: [], btn: "Start 14-day free trial", primary: true, featured: true },
							{ name: "Business", price: "$$$", desc: "For established contractors managing a full team and multiple crews.", features: ["Everything in Pro", "Multi-user access", "Custom branding", "Stripe payment links", "Advanced reporting", "API access", "Dedicated account manager"], off: [], btn: "Contact sales", primary: false },
						].map((p, i) => (
							<div key={i} className="col-12 col-md-6 col-lg-4">
								<div className={`tq-plan-card ${p.featured ? "featured" : ""}`}>
									{p.featured && <div className="tq-plan-badge">Most popular</div>}
									<div className="tq-plan-name">{p.name}</div>
									<div className="tq-plan-price"><sup>$</sup>{p.price}<sub>/mo</sub></div>
									<div className="tq-plan-desc">{p.desc}</div>
									<hr style={{ borderColor: "#e2e8f0" }} />
									<ul className="tq-plan-features">
										{p.features.map((f, j) => (
											<li key={j}><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>{f}</li>
										))}
										{p.off.map((f, j) => (
											<li key={j} className="off"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /></svg>{f}</li>
										))}
									</ul>
									<button className={`tq-plan-btn ${p.primary ? "primary" : ""}`} onClick={() => navigate("/signupprovider")}>
										{p.btn}
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── TESTIMONIALS ── */}
			<section className="tq-section" style={{ background: "#fff", borderTop: "1px solid #e2e8f0" }}>
				<div className="container-fluid px-4 px-lg-5">
					<div className="text-center mb-5">
						<div className="tq-sec-label">What contractors say</div>
						<div className="tq-sec-title">Real results,<br />real pros</div>
					</div>
					<div className="row g-4">
						{[
							{ av: "MR", bg: "#1e3a5f", name: "Marcus R.", role: "Painting contractor · Atlanta, GA", quote: "I used to spend 2 hours writing estimates in Word. Now I send a professional PDF in under 5 minutes. My close rate went from 40% to 65% in the first month." },
							{ av: "SL", bg: "#16a34a", name: "Sandra L.", role: "Flooring specialist · Miami, FL", quote: "The portfolio page alone paid for the subscription. Three new clients found me through my TradeQuote link this month — one was a $12,000 flooring job." },
							{ av: "JA", bg: "#d97706", name: "James A.", role: "Painting & flooring · Dover, DE", quote: "Before TradeQuote I had jobs falling through the cracks constantly. Now every job, customer, and invoice is in one place. I finally feel in control." },
						].map((t, i) => (
							<div key={i} className="col-12 col-md-4">
								<div className="tq-test-card">
									<div className="tq-test-stars">★★★★★</div>
									<div className="tq-test-quote">"{t.quote}"</div>
									<div className="d-flex align-items-center gap-2">
										<div className="tq-test-av" style={{ background: t.bg }}>{t.av}</div>
										<div>
											<div style={{ fontSize: 13, fontWeight: 700, color: "#1a2332" }}>{t.name}</div>
											<div style={{ fontSize: 11, color: "#94a3b8" }}>{t.role}</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className="tq-cta-section text-center">
				<div style={{ maxWidth: 680, margin: "0 auto" }}>
					<div className="tq-cta-title">Ready to grow<br />your business?</div>
					<p className="tq-cta-sub">Join hundreds of painters and flooring contractors already using TradeQuote to win more jobs, look more professional, and get paid faster.</p>
					<div className="d-flex flex-wrap gap-3 justify-content-center">
						<button className="btn tq-btn-cta-white" onClick={() => navigate("/signupprovider")}>
							Start free — no credit card needed
						</button>
						<button className="btn tq-btn-cta-out" onClick={openLogin}>
							Sign in to your account
						</button>
					</div>
				</div>
			</div>

			{/* ── LOGIN MODAL (Bootstrap) ── */}
			<div className="modal fade" id="loginModalHome" tabIndex="-1" aria-hidden="true">
				<div className="modal-dialog modal-dialog-centered">
					<div className="modal-content border-0" style={{ borderRadius: 14, overflow: "hidden" }}>
						<div className="modal-header tq-modal-header">
							<h5 className="modal-title tq-modal-title-text">Sign in to TradeQuote</h5>
							<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
						</div>
						<div className="modal-body p-4">
							<LoginProvider />
						</div>
						<div className="modal-footer border-0 pt-0 pb-4 justify-content-center flex-column text-center">
							<p className="text-muted mb-2" style={{ fontSize: 13 }}>Don't have an account?</p>
							<Link to="/signupprovider"
								data-bs-dismiss="modal"
								style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 800, color: "#1e3a5f", textDecoration: "none", textTransform: "uppercase", letterSpacing: ".06em" }}>
								Create free account →
							</Link>
						</div>
					</div>
				</div>
			</div>

		</>
	);
};