// src/pages/dashboardProvider/DashboardHome.jsx
// Professional business overview dashboard — Bootstrap classes + DashboardHome.css
// for anything Bootstrap can't express directly (gradients, brand colors).

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "./DashboardHome.css";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");
const authH = () => ({ Authorization: `Bearer ${token()}` });

const money = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

/* ── Portfolio Share Card ──────────────────────────────────────────────── */
function PortfolioShareCard({ slug }) {
    const [copied, setCopied] = useState(false);

    if (!slug) {
        return (
            <div className="portfolio-card d-flex align-items-center gap-3 flex-wrap">
                <div className="flex-fill" style={{ minWidth: 200 }}>
                    <p className="text-white fw-bold mb-1" style={{ fontSize: 14 }}>
                        📸 Set up your public portfolio
                    </p>
                    <p className="mb-0" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                        Add a portfolio URL slug so clients can view your work online
                    </p>
                </div>
                <Link to="/providerdashboard/portfolio/settings" className="btn-portfolio-cta">
                    🎨 Set up portfolio →
                </Link>
            </div>
        );
    }

    const portfolioUrl = `${window.location.origin}/portfolio/${slug}`;

    const copyLink = () => {
        navigator.clipboard.writeText(portfolioUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareVia = (platform) => {
        const text = `Check out my professional work portfolio!`;
        const urls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + portfolioUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portfolioUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(portfolioUrl)}`,
            email: `mailto:?subject=${encodeURIComponent("My professional portfolio")}&body=${encodeURIComponent(text + "\n\n" + portfolioUrl)}`,
            sms: `sms:?body=${encodeURIComponent(text + " " + portfolioUrl)}`,
        };
        window.open(urls[platform], "_blank", "noopener");
    };

    const shareButtons = [
        { id: "whatsapp", label: "WhatsApp", cls: "share-btn-whatsapp", emoji: "💬" },
        { id: "facebook", label: "Facebook", cls: "share-btn-facebook", emoji: "📘" },
        { id: "twitter", label: "Twitter", cls: "share-btn-twitter", emoji: "🐦" },
        { id: "email", label: "Email", cls: "share-btn-email", emoji: "✉️" },
        { id: "sms", label: "Text/SMS", cls: "share-btn-sms", emoji: "📱" },
    ];

    return (
        <div className="portfolio-card">
            <div className="d-flex align-items-start justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <p className="text-white fw-bold mb-1" style={{ fontSize: 15 }}>
                        📸 Your portfolio is live
                    </p>
                    <p className="mb-0" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        Share this link with clients and on social media
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="portfolio-card-ghost-btn">
                        👁 Preview →
                    </a>
                    <Link to="/providerdashboard/portfolio/settings" className="portfolio-card-ghost-btn">
                        🎨 Edit
                    </Link>
                </div>
            </div>

            <div className="portfolio-link-box">
                <span className="portfolio-link-text">{portfolioUrl}</span>
                <button onClick={copyLink} className={`portfolio-copy-btn ${copied ? "copied" : ""}`}>
                    {copied ? "✓ Copied!" : "Copy link"}
                </button>
            </div>

            <div className="d-flex gap-2 flex-wrap">
                {shareButtons.map(btn => (
                    <button key={btn.id} onClick={() => shareVia(btn.id)} className={`share-btn ${btn.cls}`}>
                        {btn.emoji} {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }) {
    return (
        <div className="col-6 col-lg-3">
            <div className="card border h-100 shadow-sm">
                <div className="card-body py-3 px-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: 11, letterSpacing: ".05em" }}>{label}</span>
                        <span className="stat-card-icon">{icon}</span>
                    </div>
                    <p className={`fw-bold mb-0 stat-card-value ${accent || "text-dark"}`}>{value}</p>
                    {sub && <p className="text-muted mb-0 mt-1" style={{ fontSize: 12 }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

/* ── Activity feed item ─────────────────────────────────────────────────── */
const TYPE_CFG = {
    invoice: { icon: "🧾", label: "Invoice", bubbleCls: "bubble-invoice" },
    estimate: { icon: "📋", label: "Estimate", bubbleCls: "bubble-estimate" },
    job: { icon: "🛠️", label: "Job", bubbleCls: "bubble-job" },
};

function ActivityRow({ item, onClick }) {
    const cfg = TYPE_CFG[item.kind];
    return (
        <button
            onClick={onClick}
            className="activity-row d-flex align-items-center justify-content-between w-100 border-0 bg-transparent text-start px-0 py-2 border-bottom"
        >
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                <span className={`activity-icon-bubble ${cfg.bubbleCls} d-flex align-items-center justify-content-center rounded-circle flex-shrink-0`}>
                    {cfg.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                    <p className="fw-medium mb-0 text-truncate text-dark" style={{ fontSize: 13.5 }}>{item.title}</p>
                    <p className="text-muted mb-0" style={{ fontSize: 11.5 }}>{cfg.label} · {fmtDate(item.date)}</p>
                </div>
            </div>
            {item.amount != null && (
                <span className="fw-semibold flex-shrink-0 ms-2 text-dark" style={{ fontSize: 13.5 }}>{money(item.amount)}</span>
            )}
        </button>
    );
}

/* ── Simple revenue bar chart ───────────────────────────────────────────── */
function RevenueChart({ data }) {
    if (!data.some(d => d.revenue > 0)) {
        return (
            <div className="chart-empty-state d-flex align-items-center justify-content-center text-muted text-center px-3" style={{ fontSize: 13 }}>
                No paid invoices yet — your revenue chart will appear here once you get paid.
            </div>
        );
    }
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={48} />
                <Tooltip
                    formatter={(value) => [money(value), "Revenue"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ── MAIN ───────────────────────────────────────────────────────────────── */
export const DashboardHome = () => {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [slug, setSlug] = useState("");

    const [invStats, setInvStats] = useState(null);
    const [estStats, setEstStats] = useState(null);
    const [jobStats, setJobStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    }, []);

    // Portfolio slug
    useEffect(() => {
        const tk = token();
        if (!tk) return;
        fetch(`${BASE}/api/portfolio/settings`, { headers: authH() })
            .then(r => r.json())
            .then(d => {
                if (d.settings?.website_slug) {
                    const s = d.settings.website_slug;
                    if (s && s !== "False" && s !== "None") setSlug(String(s));
                }
            })
            .catch(() => { });
    }, []);

    // All dashboard data
    useEffect(() => {
        const tk = token();
        if (!tk) { setLoading(false); return; }

        const safeJson = (p) => p.then(r => r.json()).catch(() => null);

        Promise.all([
            safeJson(fetch(`${BASE}/api/invoices/stats?year=all&month=all`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/estimates/stats`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/jobs/stats`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/invoices?status=all&year=all&month=all&sort=newest&per_page=6`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/estimates?status=all&per_page=6`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/jobs?per_page=6`, { headers: authH() })),
            safeJson(fetch(`${BASE}/api/invoices?status=paid&year=all&month=all&sort=newest&per_page=100`, { headers: authH() })),
        ]).then(([invoiceStats, estimateStats, jobsStats, recentInvoicesRes, recentEstimatesRes, recentJobsRes, paidInvoicesRes]) => {

            setInvStats(invoiceStats);
            setEstStats(estimateStats);
            setJobStats(jobsStats);

            // ── Build combined activity feed ──
            const invItems = (recentInvoicesRes?.invoices || []).map(inv => ({
                kind: "invoice",
                id: inv.id,
                title: `#${inv.invoice_number} — ${inv.customer_name || "Client"}`,
                date: inv.create_at || inv.issue_date,
                amount: inv.total_amount,
                route: `/providerdashboard/invoices/${inv.id}`,
            }));
            const estItems = (recentEstimatesRes?.estimates || []).map(est => ({
                kind: "estimate",
                id: est.id,
                title: `${est.customer_name || "Client"} — ${(est.estimate_type || "estimate")}`,
                date: est.create_at,
                amount: est.quoted_amount,
                route: `/providerdashboard/estimates/${est.id}`,
            }));
            const jobItems = (recentJobsRes?.jobs || []).map(job => ({
                kind: "job",
                id: job.id,
                title: job.title || "Job",
                date: job.createdAt || job.schedule_date,
                amount: job.budget,
                route: `/providerdashboard/jobs`,
            }));

            const combined = [...invItems, ...estItems, ...jobItems]
                .filter(i => i.date)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 8);
            setActivity(combined);

            // ── Build 6-month revenue chart from paid invoices ──
            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-US", { month: "short" }), revenue: 0 });
            }
            const paidInvoices = paidInvoicesRes?.invoices || [];
            paidInvoices.forEach(inv => {
                const d = new Date(inv.paid_at || inv.issue_date);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                const bucket = months.find(m => m.key === key);
                if (bucket) bucket.revenue += Number(inv.total_amount || 0);
            });
            setChartData(months);

        }).finally(() => setLoading(false));
    }, []);

    const totalOutstanding = (invStats?.total_outstanding || 0) + (invStats?.total_overdue || 0);
    const activeJobsCount = jobStats?.in_progress ?? null;
    const pendingEstimatesCount = estStats?.new ?? null;

    return (
        <>
            <PortfolioShareCard slug={slug} />

            <div className="dashboard-welcome-section">
                <div className="dashboard-welcome-content">
                    <h1 className="dashboard-welcome-title">
                        Welcome back, {store.provider?.name || "Contractor"}!
                    </h1>
                    <p className="dashboard-welcome-subtitle">
                        Here's what's happening with your business today.
                    </p>
                </div>
            </div>

            {/* ── Stats row ───────────────────────────────────────────────── */}
            <div className="row g-2 g-lg-3 mb-4">
                <StatCard
                    icon="✅" label="Paid revenue"
                    value={loading ? "—" : money(invStats?.total_paid)}
                    sub={invStats ? `${invStats.count_paid || 0} invoices` : null}
                    accent="text-success"
                />
                <StatCard
                    icon="⏳" label="Outstanding"
                    value={loading ? "—" : money(totalOutstanding)}
                    sub={invStats ? `${(invStats.count_sent || 0) + (invStats.count_overdue || 0)} unpaid` : null}
                    accent="text-primary"
                />
                <StatCard
                    icon="🛠️" label="Active jobs"
                    value={loading ? "—" : (activeJobsCount ?? 0)}
                    sub={jobStats ? `${jobStats.pending || 0} pending · ${jobStats.completed || 0} done` : null}
                    accent="text-dark"
                />
                <StatCard
                    icon="📋" label="Pending estimates"
                    value={loading ? "—" : (pendingEstimatesCount ?? 0)}
                    sub={estStats ? `$${Number(estStats.total_quoted || 0).toLocaleString()} quoted` : null}
                    accent="text-dark"
                />
            </div>

            {/* ── Chart + Activity feed ──────────────────────────────────── */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
                            <span className="fw-semibold" style={{ fontSize: 14 }}>📈 Revenue — last 6 months</span>
                            <Link to="/providerdashboard/invoices" className="text-decoration-none" style={{ fontSize: 12.5 }}>View invoices →</Link>
                        </div>
                        <div className="card-body px-2 py-3">
                            {loading
                                ? <div className="d-flex justify-content-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div>
                                : <RevenueChart data={chartData} />
                            }
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3 px-3">
                            <span className="fw-semibold" style={{ fontSize: 14 }}>🕓 Recent activity</span>
                        </div>
                        <div className="card-body px-3 py-2 activity-feed-scroll">
                            {loading ? (
                                <div className="d-flex justify-content-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div>
                            ) : activity.length === 0 ? (
                                <p className="text-muted text-center py-4 mb-0" style={{ fontSize: 13 }}>No activity yet — create your first estimate to get started.</p>
                            ) : (
                                activity.map((item, i) => (
                                    <ActivityRow key={`${item.kind}-${item.id}-${i}`} item={item} onClick={() => navigate(item.route)} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick actions ───────────────────────────────────────────── */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="dashboard-section-title mb-3">Quick Actions</h2>
                    <div className="dashboard-quick-actions">
                        <Link to="/providerdashboard/estimate/new" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-file-text"></i>
                            </div>
                            <h4>New Estimate</h4>
                            <p>Create estimate for a client</p>
                        </Link>
                        <Link to="/providerdashboard/invoices/new" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-receipt"></i>
                            </div>
                            <h4>New Invoice</h4>
                            <p>Bill a client for completed work</p>
                        </Link>
                        <Link to="/providerdashboard/jobs" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-briefcase"></i>
                            </div>
                            <h4>View Jobs</h4>
                            <p>Manage your active jobs</p>
                        </Link>
                        <Link to="/providerdashboard/customers" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-person-plus"></i>
                            </div>
                            <h4>Customers</h4>
                            <p>View your client list</p>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};