
export default function StatCard({ label, value, icon, accent }) {
    return (
        <div className="col-6 col-md-3">
            <div className="card border h-100">
                <div className="card-body py-3 px-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: 11, letterSpacing: ".05em" }}>{label}</span>
                        <span>{icon}</span>
                    </div>
                    <p className={`fw-bold mb-0 ${accent || "text-dark"}`} style={{ fontSize: 22 }}>{value}</p>
                </div>
            </div>
        </div>
    );
}