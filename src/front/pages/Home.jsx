// src/front/pages/Home.jsx
// Full landing page using Bootstrap 5 + your existing LoginProvider

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { LoginProvider } from "./LoginProvider";

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
			<style>{`
                /* ── GOOGLE FONT ── */
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap');

                :root {
                    --tq-navy: #1e3a5f;
                    --tq-navy-dark: #0f2340;
                    --tq-green: #16a34a;
                    --tq-green-pale: #f0fdf4;
                }

                /* Headings use Barlow Condensed */
                .tq-heading {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: -.01em;
                    line-height: 1.0;
                }

                /* ── NAVBAR ── */
                .tq-navbar {
                    background: #fff !important;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 0 !important;
                    height: 68px;
                }
                .tq-navbar .navbar-brand {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 22px;
                    font-weight: 900;
                    color: var(--tq-navy) !important;
                    letter-spacing: .02em;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .tq-navbar .navbar-brand em {
                    color: var(--tq-green);
                    font-style: normal;
                }
                .tq-nav-logo-icon {
                    width: 36px; height: 36px;
                    background: var(--tq-navy);
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                }
                .tq-nav-logo-icon svg { width: 20px; height: 20px; fill: #fff; }
                .tq-navbar .nav-link {
                    font-size: 14px;
                    font-weight: 500;
                    color: #64748b !important;
                    padding: 8px 14px !important;
                    transition: color .15s;
                }
                .tq-navbar .nav-link:hover { color: var(--tq-navy) !important; }
                .tq-btn-nav-signin {
                    font-size: 13px; font-weight: 600;
                    color: var(--tq-navy) !important;
                    border: 1.5px solid #e2e8f0 !important;
                    border-radius: 6px !important;
                    padding: 8px 18px !important;
                    background: transparent !important;
                    transition: all .15s !important;
                }
                .tq-btn-nav-signin:hover {
                    background: #f8fafc !important;
                    color: var(--tq-navy) !important;
                }
                .tq-btn-nav-cta {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 14px; font-weight: 800;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    background: var(--tq-navy) !important;
                    color: #fff !important;
                    border-radius: 6px !important;
                    padding: 9px 20px !important;
                    border: none !important;
                    transition: background .15s !important;
                }
                .tq-btn-nav-cta:hover { background: var(--tq-green) !important; }

                /* ── HERO ── */
                .tq-hero {
                    background: var(--tq-navy-dark);
                    min-height: 90vh;
                    display: flex;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }
                .tq-hero::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: radial-gradient(circle at 20% 50%, rgba(22,163,74,.12) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(255,255,255,.03) 0%, transparent 40%);
                }
                .tq-hero-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
                .tq-hero-eyebrow {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: rgba(22,163,74,.15);
                    border: 1px solid rgba(22,163,74,.35);
                    color: #4ade80;
                    font-size: 11px; font-weight: 700;
                    padding: 5px 14px; border-radius: 4px;
                    letter-spacing: .12em; text-transform: uppercase;
                    margin-bottom: 20px;
                }
                .tq-pulse {
                    width: 6px; height: 6px;
                    background: #4ade80; border-radius: 50%;
                    animation: tqPulse 2s infinite; flex-shrink: 0;
                }
                @keyframes tqPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
                .tq-hero h1 {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: clamp(40px, 7vw, 76px);
                    font-weight: 900; color: #fff;
                    line-height: .95; letter-spacing: -.01em;
                    text-transform: uppercase; margin-bottom: 20px;
                }
                .tq-hero h1 .tq-accent { color: #4ade80; }
                .tq-hero-desc {
                    font-size: clamp(15px, 1.8vw, 17px);
                    color: rgba(255,255,255,.65); line-height: 1.8;
                    margin-bottom: 32px;
                }
                .tq-btn-hero {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 15px; font-weight: 800;
                    letter-spacing: .08em; text-transform: uppercase;
                    background: var(--tq-green) !important;
                    color: #fff !important;
                    border: none !important;
                    padding: 14px 28px !important;
                    border-radius: 6px !important;
                    transition: background .2s, transform .15s !important;
                }
                .tq-btn-hero:hover {
                    background: #15803d !important;
                    transform: translateY(-1px);
                }
                .tq-btn-hero-out {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 15px; font-weight: 700;
                    letter-spacing: .08em; text-transform: uppercase;
                    background: transparent !important;
                    color: #fff !important;
                    border: 1px solid rgba(255,255,255,.3) !important;
                    padding: 13px 24px !important;
                    border-radius: 6px !important;
                    transition: all .2s !important;
                }
                .tq-btn-hero-out:hover {
                    background: rgba(255,255,255,.08) !important;
                    border-color: rgba(255,255,255,.6) !important;
                }
                .tq-hero-trust {
                    display: flex; gap: 24px; flex-wrap: wrap;
                    margin-top: 40px; padding-top: 32px;
                    border-top: 1px solid rgba(255,255,255,.1);
                }
                .tq-trust-pill {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 13px; color: rgba(255,255,255,.5); font-weight: 500;
                }
                .tq-trust-pill svg { width: 15px; height: 15px; fill: #4ade80; flex-shrink: 0; }

                /* ── DASHBOARD MOCKUP ── */
                .tq-mockup-card {
                    background: #fff; border-radius: 14px;
                    box-shadow: 0 28px 70px rgba(0,0,0,.5);
                    overflow: hidden;
                }
                .tq-mockup-bar {
                    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
                    padding: 11px 16px; display: flex; align-items: center; gap: 6px;
                }
                .tq-wdot { width: 10px; height: 10px; border-radius: 50%; }
                .tq-mockup-url {
                    flex: 1; background: #e2e8f0; border-radius: 4px;
                    height: 22px; margin: 0 8px;
                    display: flex; align-items: center; padding: 0 10px;
                    font-size: 11px; color: #94a3b8;
                }
                .tq-mockup-body { padding: 18px; }
                .tq-mockup-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 14px; }
                .tq-metric-box {
                    background: #f8fafc; border-radius: 8px;
                    padding: 11px 8px; text-align: center; border: 1px solid #e2e8f0;
                }
                .tq-metric-val {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 22px; font-weight: 900; color: var(--tq-navy);
                }
                .tq-metric-lbl { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
                .tq-est-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 0; border-bottom: 1px solid #f8fafc;
                }
                .tq-est-row:last-child { border-bottom: none; }
                .tq-est-av {
                    width: 26px; height: 26px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 9px; font-weight: 800; color: #fff; flex-shrink: 0;
                }
                .tq-status { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 20px; text-transform: uppercase; }
                .tq-s-new { background: #fef2f2; color: #dc2626; }
                .tq-s-sent { background: #f0fdf4; color: #16a34a; }
                .tq-s-pend { background: #fffbeb; color: #d97706; }
                .tq-notif-float {
                    position: absolute; top: -14px; right: -14px;
                    background: #fff; border-radius: 10px;
                    padding: 10px 14px;
                    box-shadow: 0 8px 28px rgba(0,0,0,.18);
                    display: flex; align-items: center; gap: 9px;
                    min-width: 200px;
                    animation: tqFloat .6s ease .3s both;
                }
                @keyframes tqFloat { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
                .tq-notif-live {
                    width: 8px; height: 8px; background: #22c55e;
                    border-radius: 50%; animation: tqPulse 2s infinite; flex-shrink: 0;
                }

                /* ── TRUST STRIP ── */
                .tq-trust-strip {
                    background: #fff;
                    border-top: 1px solid #e2e8f0;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 20px clamp(20px,5vw,80px);
                }
                .tq-ts-inner {
                    max-width: 1000px; margin: 0 auto;
                    display: flex; justify-content: center;
                    align-items: center;
                    gap: clamp(20px,5vw,52px); flex-wrap: wrap;
                }
                .tq-ts-item { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; color: #374151; }
                .tq-ts-icon {
                    width: 30px; height: 30px; background: var(--tq-navy-dark);
                    border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .tq-ts-icon svg { width: 15px; height: 15px; fill: #fff; }

                /* ── SECTION BASE ── */
                .tq-section { padding: clamp(60px,8vw,100px) clamp(20px,5vw,80px); }
                .tq-sec-label {
                    font-size: 11px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: .15em; color: var(--tq-green); margin-bottom: 8px;
                }
                .tq-sec-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: clamp(28px,4.5vw,50px); font-weight: 900;
                    color: var(--tq-navy); text-transform: uppercase;
                    letter-spacing: -.01em; line-height: 1.0; margin-bottom: 14px;
                }
                .tq-sec-body { font-size: 16px; color: #64748b; line-height: 1.8; }

                /* ── FEATURE CARDS ── */
                .tq-feat-card {
                    background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px; padding: 26px 22px;
                    height: 100%;
                    transition: transform .2s, box-shadow .2s;
                }
                .tq-feat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.09); }
                .tq-feat-icon {
                    width: 50px; height: 50px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 18px;
                }
                .tq-feat-icon svg { width: 24px; height: 24px; fill: #fff; }
                .tq-feat-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 19px; font-weight: 800; color: var(--tq-navy);
                    text-transform: uppercase; letter-spacing: .02em; margin-bottom: 8px;
                }
                .tq-feat-desc { font-size: 14px; color: #64748b; line-height: 1.75; }
                .tq-feat-tag {
                    display: inline-block; margin-top: 14px;
                    background: var(--tq-green-pale); color: #15803d;
                    font-size: 10px; font-weight: 700; padding: 3px 10px;
                    border-radius: 4px; letter-spacing: .08em; text-transform: uppercase;
                }

                /* ── HOW IT WORKS ── */
                .tq-step {
                    display: flex; gap: 18px;
                    padding: 20px 0; border-bottom: 1px solid #e2e8f0;
                }
                .tq-step:last-child { border-bottom: none; }
                .tq-step-num {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: #e2e8f0; color: #64748b;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 15px; font-weight: 900; flex-shrink: 0;
                }
                .tq-step.active .tq-step-num { background: var(--tq-green); color: #fff; }
                .tq-step-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 17px; font-weight: 800; color: var(--tq-navy);
                    text-transform: uppercase; margin-bottom: 4px;
                }
                .tq-step-desc { font-size: 13px; color: #64748b; line-height: 1.7; }
                .tq-how-preview {
                    background: #fff; border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 32px rgba(0,0,0,.07);
                    overflow: hidden;
                }
                .tq-how-top {
                    background: var(--tq-navy-dark); padding: 13px 18px;
                    display: flex; align-items: center; gap: 6px;
                }

                /* ── PORTFOLIO SECTION ── */
                .tq-port-section { background: var(--tq-navy-dark); }
                .tq-port-list-item {
                    display: flex; align-items: flex-start; gap: 12px;
                    background: rgba(255,255,255,.05);
                    border: 1px solid rgba(255,255,255,.09);
                    border-radius: 10px; padding: 13px 14px; margin-bottom: 10px;
                }
                .tq-port-icon {
                    width: 32px; height: 32px; border-radius: 7px;
                    background: rgba(22,163,74,.2);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .tq-port-icon svg { width: 16px; height: 16px; }

                /* ── PRICING ── */
                .tq-plan-card {
                    background: #fff; border: 1.5px solid #e2e8f0;
                    border-radius: 14px; padding: 30px 24px;
                    position: relative; height: 100%;
                    transition: box-shadow .2s;
                }
                .tq-plan-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,.09); }
                .tq-plan-card.featured { border-color: var(--tq-navy); border-width: 2px; }
                .tq-plan-badge {
                    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
                    background: var(--tq-navy); color: #fff;
                    font-size: 10px; font-weight: 800;
                    padding: 3px 16px; border-radius: 4px;
                    white-space: nowrap; letter-spacing: .08em; text-transform: uppercase;
                }
                .tq-plan-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #64748b; margin-bottom: 8px; }
                .tq-plan-price {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 48px; font-weight: 900; color: #1a2332;
                    line-height: 1; margin-bottom: 6px;
                }
                .tq-plan-price sup { font-size: 20px; font-weight: 700; vertical-align: top; margin-top: 10px; display: inline-block; }
                .tq-plan-price sub { font-size: 15px; font-weight: 500; color: #64748b; vertical-align: bottom; margin-bottom: 6px; display: inline-block; }
                .tq-plan-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
                .tq-plan-features { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 10px; }
                .tq-plan-features li { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #374151; line-height: 1.4; }
                .tq-plan-features li svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }
                .tq-plan-features li.off { color: #94a3b8; }
                .tq-plan-features li:not(.off) svg { fill: var(--tq-green); }
                .tq-plan-features li.off svg { fill: #cbd5e1; }
                .tq-plan-btn {
                    width: 100%; padding: 12px;
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 14px; font-weight: 800;
                    letter-spacing: .08em; text-transform: uppercase;
                    border-radius: 6px; cursor: pointer;
                    border: 2px solid var(--tq-navy);
                    background: transparent; color: var(--tq-navy);
                    transition: all .2s;
                }
                .tq-plan-btn:hover, .tq-plan-btn.primary { background: var(--tq-navy); color: #fff; }

                /* ── TESTIMONIALS ── */
                .tq-test-card {
                    background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px; padding: 24px 20px; height: 100%;
                }
                .tq-test-stars { font-size: 13px; color: #f59e0b; letter-spacing: 2px; margin-bottom: 12px; }
                .tq-test-quote { font-size: 14px; color: #374151; line-height: 1.8; font-style: italic; margin-bottom: 18px; }
                .tq-test-av {
                    width: 36px; height: 36px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 13px; font-weight: 900; color: #fff; flex-shrink: 0;
                }

                /* ── CTA ── */
                .tq-cta-section {
                    background: var(--tq-green);
                    padding: clamp(60px,8vw,100px) clamp(20px,5vw,80px);
                }
                .tq-cta-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: clamp(32px,5.5vw,64px); font-weight: 900;
                    color: #fff; text-transform: uppercase;
                    letter-spacing: -.01em; line-height: 1.0; margin-bottom: 16px;
                }
                .tq-cta-sub { font-size: 17px; color: rgba(255,255,255,.75); line-height: 1.75; margin-bottom: 32px; }
                .tq-btn-cta-white {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 15px; font-weight: 900;
                    letter-spacing: .08em; text-transform: uppercase;
                    background: #fff !important; color: var(--tq-green) !important;
                    border: none !important; border-radius: 6px !important;
                    padding: 14px 32px !important;
                    transition: transform .15s, box-shadow .15s !important;
                }
                .tq-btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.15) !important; }
                .tq-btn-cta-out {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 15px; font-weight: 800;
                    letter-spacing: .08em; text-transform: uppercase;
                    background: transparent !important;
                    color: #fff !important;
                    border: 2px solid rgba(255,255,255,.45) !important;
                    border-radius: 6px !important;
                    padding: 13px 28px !important;
                    transition: border-color .2s !important;
                }
                .tq-btn-cta-out:hover { border-color: #fff !important; }

                /* ── LOGIN MODAL CUSTOM ── */
                .tq-modal-header { background: var(--tq-navy-dark); border-bottom: none; }
                .tq-modal-title-text {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 20px; font-weight: 900;
                    color: #fff; text-transform: uppercase; letter-spacing: .04em;
                }
                .tq-modal-header .btn-close { filter: invert(1) brightness(2); }

                @media (max-width: 991px) {
                    .tq-hero { min-height: auto; padding-top: 64px; padding-bottom: 56px; }
                    .tq-hero-trust { gap: 14px; }
                    .tq-notif-float { display: none !important; }
                    .tq-mockup-card { box-shadow: 0 12px 40px rgba(0,0,0,.35); }
                }
                @media (max-width: 576px) {
                    .tq-hero { padding-top: 48px; padding-bottom: 48px; }
                    .tq-hero-trust { flex-direction: column; gap: 10px; padding-top: 20px; margin-top: 20px; }
                    .tq-hero h1 { font-size: 44px; }
                    .tq-mockup-metrics { grid-template-columns: repeat(3,1fr); }
                }
            `}</style>

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
							<li className="nav-item"><a className="nav-link" href="#features">Features</a></li>
							<li className="nav-item"><a className="nav-link" href="#how">How it works</a></li>
							<li className="nav-item"><a className="nav-link" href="#portfolio">Portfolio</a></li>
							<li className="nav-item"><a className="nav-link" href="#pricing">Pricing</a></li>
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

			{/* ── CTA ── */}
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