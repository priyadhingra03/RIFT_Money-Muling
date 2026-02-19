import { useState } from "react"
import GraphDashboard from "./GraphDashboard"
import "./ResultsPage.css"

const PATTERN_META = {
    cycle: { emoji: "🔄", label: "Cycle", color: "#ff5252" },
    fan_in: { emoji: "📥", label: "Fan-In", color: "#ff9800" },
    fan_out: { emoji: "📤", label: "Fan-Out", color: "#2196f3" },
    shell: { emoji: "🐚", label: "Shell", color: "#9c27b0" },
}

const riskColor = (score) => {
    if (score >= 70) return "#ff5252"
    if (score >= 40) return "#ff9800"
    return "#4caf50"
}

const PatternBadge = ({ type }) => {
    const meta = PATTERN_META[type] || { emoji: "❓", label: type, color: "#aaa" }
    return (
        <span
            className="rp-badge"
            style={{
                background: meta.color + "22",
                color: meta.color,
                border: `1px solid ${meta.color}55`,
            }}
        >
            {meta.emoji} {meta.label}
        </span>
    )
}

const RiskBar = ({ score }) => (
    <div className="rp-risk-wrap">
        <div className="rp-risk-track">
            <div
                className="rp-risk-fill"
                style={{
                    width: `${Math.min(score, 100)}%`,
                    background: riskColor(score),
                }}
            />
        </div>
        <span className="rp-risk-num" style={{ color: riskColor(score) }}>
            {score}%
        </span>
    </div>
)

const SummaryChip = ({ label, value, accent }) => (
    <div className="rp-chip" style={accent ? { borderColor: accent + "55" } : {}}>
        <div className="rp-chip-val" style={accent ? { color: accent } : {}}>
            {value ?? "—"}
        </div>
        <div className="rp-chip-label">{label}</div>
    </div>
)

const ResultsPage = ({ data, onBack }) => {
    const [tab, setTab] = useState("table") // "table" | "graph"

    const fraudRings = data?.fraud_rings ?? []
    const suspiciousAccounts = data?.suspicious_accounts ?? []
    const summary = data?.summary ?? {}

    const downloadJSON = () => {
        // Export exactly what the server sent
        const output = {
            suspicious_accounts: data?.suspicious_accounts ?? [],
            fraud_rings: data?.fraud_rings ?? [],
            summary: data?.summary ?? {},
        }

        const jsonStr = JSON.stringify(output, null, 2)
        const a = Object.assign(document.createElement("a"), {
            href: "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr),
            download: "rift_analysis.json",
        })
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div className="rp-root">
            {/* ── Top bar ── */}
            <div className="rp-topbar">
                <div className="rp-topbar-left">
                    <button className="rp-btn-back" onClick={onBack}>← Back</button>
                    <span className="rp-title">RIFT <em>Results</em></span>
                </div>

                {/* Tabs */}
                <div className="rp-tabs">
                    <button
                        className={`rp-tab ${tab === "table" ? "rp-tab-active" : ""}`}
                        onClick={() => setTab("table")}
                    >
                        📋 Rings Table
                    </button>
                    <button
                        className={`rp-tab ${tab === "graph" ? "rp-tab-active" : ""}`}
                        onClick={() => setTab("graph")}
                    >
                        🕸 Graph View
                    </button>
                </div>

                {/* Download button */}
                <button className="rp-btn-dl" onClick={downloadJSON}>
                    ⬇ Export JSON
                </button>
            </div>

            {/* ── Summary stats (always visible) ── */}
            <div className="rp-summary">
                <SummaryChip label="Total Accounts" value={summary.total_accounts_analyzed} />
                <SummaryChip label="Flagged" value={summary.suspicious_accounts_flagged} accent="#ff5252" />
                <SummaryChip label="Fraud Rings" value={summary.fraud_rings_detected} accent="#ff9800" />
                <SummaryChip label="Processing Time" value={`${summary.processing_time_seconds ?? "—"}s`} />
            </div>

            {/* ── Table Tab ── */}
            {tab === "table" && (
                <div className="rp-section">
                    <h2 className="rp-section-title">🔴 Detected Fraud Rings</h2>

                    {fraudRings.length === 0 ? (
                        <p className="rp-empty">No fraud rings detected.</p>
                    ) : (
                        <div className="rp-table-wrap">
                            <table className="rp-table">
                                <thead>
                                    <tr>
                                        {["Ring ID", "Pattern Type", "Member Count", "Risk Score", "Member Account IDs"].map(h => (
                                            <th key={h} className="rp-th">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {fraudRings.map((ring, i) => (
                                        <tr
                                            key={ring.ring_id}
                                            className={`rp-tr ${i % 2 === 0 ? "rp-tr-alt" : ""}`}
                                        >
                                            {/* Ring ID */}
                                            <td className="rp-td rp-td-mono rp-td-id">
                                                {ring.ring_id}
                                            </td>

                                            {/* Pattern Type */}
                                            <td className="rp-td">
                                                <PatternBadge type={ring.pattern_type} />
                                            </td>

                                            {/* Member Count */}
                                            <td className="rp-td rp-td-center">
                                                <span className="rp-count">
                                                    {(ring.member_accounts ?? []).length}
                                                </span>
                                            </td>

                                            {/* Risk Score */}
                                            <td className="rp-td rp-td-risk">
                                                <RiskBar score={ring.risk_score ?? 0} />
                                            </td>

                                            {/* Member Account IDs */}
                                            <td className="rp-td rp-td-members">
                                                <div className="rp-members">
                                                    {(ring.member_accounts ?? []).map(acc => (
                                                        <span key={acc} className="rp-acc-chip">
                                                            {acc}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Graph Tab ── */}
            {tab === "graph" && (
                <div className="rp-graph-panel">
                    <GraphDashboard data={data} embedded={true} />
                </div>
            )}
        </div>
    )
}

export default ResultsPage
