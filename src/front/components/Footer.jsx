// src/front/components/Footer.jsx

export const Footer = () => (
	<>
		<style>{`
            @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500&display=swap');
            .tq-footer { background: #0c1a2e; color: #fff; font-family: 'Barlow', sans-serif; }
            .tq-footer-brand { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 900; color: #fff; letter-spacing: .02em; }
            .tq-footer-brand em { color: #4ade80; font-style: normal; }
            .tq-footer-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.75; }
            .tq-footer-col-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: rgba(255,255,255,.3); margin-bottom: 14px; }
            .tq-footer-link { display: block; font-size: 13px; color: rgba(255,255,255,.5); text-decoration: none; margin-bottom: 9px; transition: color .15s; }
            .tq-footer-link:hover { color: #fff; }
            .tq-footer-social { width: 32px; height: 32px; background: rgba(255,255,255,.08); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: rgba(255,255,255,.5); text-decoration: none; transition: background .15s; }
            .tq-footer-social:hover { background: rgba(255,255,255,.16); color: #fff; }
            .tq-footer-divider { border-color: rgba(255,255,255,.07) !important; }
            .tq-footer-copy { font-size: 12px; color: rgba(255,255,255,.25); }
            .tq-footer-tagline { font-size: 12px; color: rgba(255,255,255,.2); }
        `}</style>
		<footer className="tq-footer pt-5 pb-4">
			<div className="container-fluid px-4 px-lg-5">
				<div className="row g-4 mb-5">
					{/* Brand */}
					<div className="col-12 col-lg-4">
						<div className="tq-footer-brand mb-3">Trade<em>Quote</em></div>
						<p className="tq-footer-desc mb-3">
							The all-in-one business platform built for painting and flooring subcontractors. Estimates, jobs, invoices, and a public portfolio — all in one place.
						</p>
						<div className="d-flex gap-2">
							<a href="#" className="tq-footer-social" aria-label="Facebook">f</a>
							<a href="#" className="tq-footer-social" aria-label="LinkedIn">in</a>
							<a href="#" className="tq-footer-social" aria-label="Instagram">ig</a>
						</div>
					</div>
					{/* Product */}
					<div className="col-6 col-sm-4 col-lg-2 offset-lg-2">
						<div className="tq-footer-col-title">Product</div>
						<a href="#features" className="tq-footer-link">Estimates</a>
						<a href="#features" className="tq-footer-link">Invoices</a>
						<a href="#features" className="tq-footer-link">Job tracking</a>
						<a href="#portfolio" className="tq-footer-link">Portfolio</a>
						<a href="#pricing" className="tq-footer-link">Pricing</a>
					</div>
					{/* For trades */}
					<div className="col-6 col-sm-4 col-lg-2">
						<div className="tq-footer-col-title">For trades</div>
						<a href="#" className="tq-footer-link">Painters</a>
						<a href="#" className="tq-footer-link">Flooring pros</a>
						<a href="#" className="tq-footer-link">Subcontractors</a>
						<a href="#" className="tq-footer-link">Small crews</a>
					</div>
					{/* Company */}
					<div className="col-6 col-sm-4 col-lg-2">
						<div className="tq-footer-col-title">Company</div>
						<a href="#" className="tq-footer-link">About</a>
						<a href="#" className="tq-footer-link">Blog</a>
						<a href="#" className="tq-footer-link">Support</a>
						<a href="#" className="tq-footer-link">Privacy policy</a>
						<a href="#" className="tq-footer-link">Terms of service</a>
					</div>
				</div>
				<hr className="tq-footer-divider" />
				<div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 pt-2">
					<div className="tq-footer-copy">
						© {new Date().getFullYear()} TradeQuote. All rights reserved. Built for painters & flooring pros.
					</div>
					<div className="tq-footer-tagline">Made with care in the USA 🇺🇸</div>
				</div>
			</div>
		</footer>
	</>
);