import { useEffect, useRef, useState, useCallback } from "react"
import cytoscape from "cytoscape"
import "./GraphDashboard.css"

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => {
    if (n === null || n === undefined) return "—"
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${Number(n).toFixed(0)}`
}

const fmtDate = (ts) => {
    if (!ts) return "—"
    const d = new Date(ts)
    if (isNaN(d)) return "—"
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

const riskLabel = (score) => {
    if (score >= 70) return { label: "HIGH RISK", cls: "risk-high" }
    if (score >= 40) return { label: "MED RISK", cls: "risk-med" }
    return { label: "LOW RISK", cls: "risk-low" }
}

const PATTERN_COLORS = {
    cycle: "#a855f7",
    fan_in: "#f59e0b",
    fan_out: "#3b82f6",
    shell: "#ec4899",
    high_velocity: "#10b981",
}

// ─── main component ─────────────────────────────────────────────────────────

const GraphDashboard = ({ data, onBack, embedded = false }) => {
    const containerRef = useRef(null)
    const cyRef = useRef(null)
    const [tooltip, setTooltip] = useState(null)
    const [layout, setLayout] = useState("cose")
    const summary = data.summary || {}

    const fraudAccounts = new Set(
        (data.fraud_rings || []).flatMap(r => r.member_accounts)
    )

    useEffect(() => {
        if (!containerRef.current || !data.graph_data) return

        const elements = [
            ...(data.graph_data.nodes || []).map(n => ({
                data: {
                    id: n.id,
                    label: n.id,
                    suspicious: n.suspicious ? "yes" : "no",
                    inFraudRing: fraudAccounts.has(n.id) ? "yes" : "no",
                    // All tooltip fields stored directly on node
                    score: n.score ?? 0,
                    detected_patterns: n.detected_patterns ?? [],
                    ring_id: n.ring_id ?? null,
                    total_sent: n.total_sent ?? 0,
                    total_received: n.total_received ?? 0,
                    amount_sent: n.amount_sent ?? 0,
                    amount_received: n.amount_received ?? 0,
                    transaction_count: n.transaction_count ?? 0,
                    first_tx: n.first_tx ?? null,
                    last_tx: n.last_tx ?? null,
                }
            })),
            ...(data.graph_data.edges || []).map(e => ({
                data: { id: e.id, source: e.source, target: e.target }
            }))
        ]

        if (cyRef.current) cyRef.current.destroy()

        const cy = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                // ── Default node ──
                {
                    selector: "node",
                    style: {
                        label: "data(label)",
                        "background-color": "#64748b",
                        color: "#1e293b",
                        "font-size": "11px",
                        "font-weight": "600",
                        width: 28,
                        height: 28,
                        "text-valign": "bottom",
                        "text-halign": "center",
                        "text-margin-y": 4,
                        "border-width": 2,
                        "border-color": "#94a3b8",
                        "text-background-color": "#ffffff",
                        "text-background-opacity": 0.85,
                        "text-background-padding": "2px",
                    }
                },
                // ── Suspicious (red) ──
                {
                    selector: "node[suspicious = 'yes']",
                    style: {
                        "background-color": "#ef4444",
                        "border-color": "#b91c1c",
                        width: 36,
                        height: 36,
                    }
                },
                // ── Fraud ring (orange border, blue fill) ──
                {
                    selector: "node[inFraudRing = 'yes'][suspicious = 'no']",
                    style: {
                        "background-color": "#3b82f6",
                        "border-color": "#f97316",
                        "border-width": 3,
                    }
                },
                // ── Hovered / selected ──
                {
                    selector: "node:selected",
                    style: {
                        "border-color": "#7c3aed",
                        "border-width": 3,
                    }
                },
                // ── Edges ──
                {
                    selector: "edge",
                    style: {
                        width: 1.2,
                        "line-color": "#cbd5e1",
                        "target-arrow-color": "#94a3b8",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier",
                        opacity: 0.8,
                    }
                }
            ],
            layout: {
                name: layout,
                animate: false,
                randomize: true,
                nodeRepulsion: 12000,
                idealEdgeLength: 100,
                padding: 50,
            }
        })

        // ── Hover ──
        cy.on("mouseover", "node", evt => {
            const nd = evt.target.data()
            const domEvt = evt.originalEvent
            const rect = containerRef.current.getBoundingClientRect()
            const mx = (domEvt?.clientX ?? 0) - rect.left
            const my = (domEvt?.clientY ?? 0) - rect.top
            const ttW = 320, ttH = 460
            const x = mx + ttW + 24 > rect.width ? mx - ttW - 8 : mx + 16
            const y = Math.max(8, Math.min(my - 20, rect.height - ttH - 8))
            setTooltip({ x, y, nd })
        })

        cy.on("mouseout", "node", () => setTooltip(null))
        cy.on("viewport", () => setTooltip(null))

        cyRef.current = cy

        // When embedded in a tab the container finalises its pixel size
        // after the first browser paint — resize() re-measures it, then
        // fit() centres all nodes in the newly-known viewport.
        const fitTimer = setTimeout(() => {
            cy.resize()
            cy.fit(undefined, 40)
        }, 120)

        return () => { clearTimeout(fitTimer); cy.destroy() }
    }, [data, layout])

    const switchLayout = (name) => {
        setLayout(name)
        if (cyRef.current)
            cyRef.current.layout({ name, animate: true, randomize: true, nodeRepulsion: 12000 }).run()
    }

    const handleFit = () => cyRef.current?.fit(undefined, 50)

    const handleDownload = () => {
        const output = {
            suspicious_accounts: [...(data.suspicious_accounts ?? [])]
                .sort((a, b) => (b.suspicion_score ?? 0) - (a.suspicion_score ?? 0))
                .map(acc => ({
                    account_id: acc.account_id,
                    suspicion_score: acc.suspicion_score,
                    detected_patterns: acc.detected_patterns ?? [],
                    ring_id: acc.ring_id ?? null,
                })),
            fraud_rings: (data.fraud_rings ?? []).map(r => ({
                ring_id: r.ring_id,
                member_accounts: r.member_accounts ?? [],
                pattern_type: r.pattern_type,
                risk_score: r.risk_score,
            })),
            summary: data.summary ?? {},
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
        <div className="gd-root" style={embedded ? {
            width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
            background: "#060f1a"
        } : {}}>

            {/* ── Top Bar (hidden when embedded) ── */}
            {!embedded && (
                <div className="gd-topbar">
                    <div className="gd-topbar-left">
                        <button className="gd-back" onClick={onBack}>← Back</button>
                        <span className="gd-title">RIFT <em>Graph Analysis</em></span>
                    </div>

                    <div className="gd-summary">
                        <SChip label="Accounts" value={summary.total_accounts_analyzed ?? "—"} />
                        <SChip label="Flagged" value={summary.suspicious_accounts_flagged ?? "—"} color="#ef4444" />
                        <SChip label="Rings" value={summary.fraud_rings_detected ?? "—"} color="#f97316" />
                        <SChip label="Time" value={`${summary.processing_time_seconds ?? "—"}s`} />
                    </div>

                    <div className="gd-controls">
                        <span className="gd-ctrl-label">Layout</span>
                        {["cose", "circle", "grid", "breadthfirst"].map(l => (
                            <button key={l}
                                className={`gd-lbtn ${layout === l ? "active" : ""}`}
                                onClick={() => switchLayout(l)}>{l}</button>
                        ))}
                        <button className="gd-lbtn" onClick={handleFit}>Fit ⊡</button>
                        <button className="gd-lbtn gd-dl" onClick={handleDownload}>⬇ JSON</button>
                    </div>
                </div>
            )}

            {/* ── Embedded controls (layout bar only) ── */}
            {embedded && (
                <div className="gd-embed-controls">
                    <span className="gd-ctrl-label">Layout</span>
                    {["cose", "circle", "grid", "breadthfirst"].map(l => (
                        <button key={l}
                            className={`gd-lbtn ${layout === l ? "active" : ""}`}
                            onClick={() => switchLayout(l)}>{l}</button>
                    ))}
                    <button className="gd-lbtn" onClick={handleFit}>Fit ⊡</button>
                    <button className="gd-lbtn gd-dl" onClick={handleDownload}>⬇ JSON</button>
                </div>
            )}

            {/* ── Canvas ── */}
            <div className="gd-canvas-wrap" style={embedded ? {
                flex: 1, position: "relative", overflow: "hidden", minHeight: 0
            } : {}}>
                <div ref={containerRef} className="gd-canvas" />

                {/* Legend */}
                <div className="gd-legend">
                    <LDot bg="#64748b" border="#94a3b8" label="Normal" />
                    <LDot bg="#ef4444" border="#b91c1c" label="Suspicious" />
                    <LDot bg="#3b82f6" border="#f97316" label="Fraud Ring" />
                </div>

                {/* ── Hover Tooltip ── */}
                {tooltip && <Tooltip nd={tooltip.nd} x={tooltip.x} y={tooltip.y} />}
            </div>
        </div>
    )
}

// ─── Tooltip component (matches reference image) ─────────────────────────────

const Tooltip = ({ nd, x, y }) => {
    const risk = riskLabel(nd.score)
    const net = (nd.amount_received ?? 0) - (nd.amount_sent ?? 0)
    const patterns = nd.detected_patterns ?? []

    return (
        <div className="tt" style={{ left: x, top: y }}>

            {/* Header */}
            <div className="tt-header">
                <span className="tt-icon">👤</span>
                <div>
                    <div className="tt-label">ACCOUNT ID</div>
                    <div className="tt-account">{nd.id}</div>
                </div>
            </div>

            <div className="tt-divider" />

            {/* Score + Risk */}
            <div className="tt-score-row">
                <div className="tt-score-circle">
                    <span className="tt-score-num">{nd.score}</span>
                    <span className="tt-score-denom">/100</span>
                    <div className="tt-score-sub">Suspicion Score</div>
                </div>
                <span className={`tt-risk ${risk.cls}`}>{risk.label}</span>
            </div>

            {/* Patterns */}
            {patterns.length > 0 && (
                <>
                    <div className="tt-section">▲ DETECTED PATTERNS</div>
                    <div className="tt-patterns">
                        {patterns.map(p => (
                            <span key={p} className="tt-pat"
                                style={{
                                    background: (PATTERN_COLORS[p.split("_")[0]] || "#6366f1") + "22",
                                    color: PATTERN_COLORS[p.split("_")[0]] || "#6366f1",
                                    border: `1px solid ${PATTERN_COLORS[p.split("_")[0]] || "#6366f1"}55`
                                }}>
                                {p.replace(/_/g, " ").toUpperCase()}
                            </span>
                        ))}
                    </div>
                </>
            )}

            <div className="tt-divider" />

            {/* Stats grid */}
            <div className="tt-grid">
                <TCell icon="📈" label="RECEIVED" value={fmt(nd.amount_received)} color="#10b981" />
                <TCell icon="📉" label="SENT" value={fmt(nd.amount_sent)} color="#ef4444" />
                <TCell icon="⚡" label="TRANSACTIONS" value={nd.transaction_count} color="#f59e0b" />
                <TCell icon="#" label="NET FLOW" value={fmt(net)}
                    color={net >= 0 ? "#10b981" : "#ef4444"} />
            </div>

            {/* Activity period */}
            {nd.first_tx && (
                <>
                    <div className="tt-divider" />
                    <div className="tt-section">🕐 ACTIVITY PERIOD</div>
                    <div className="tt-period">
                        {fmtDate(nd.first_tx)}
                        <span className="tt-arrow"> → </span>
                        {fmtDate(nd.last_tx)}
                    </div>
                </>
            )}

            {/* Ring info */}
            {nd.ring_id && (
                <div className="tt-ring">🔴 Ring: <strong>{nd.ring_id}</strong></div>
            )}
        </div>
    )
}

// ─── small helpers ────────────────────────────────────────────────────────────

const SChip = ({ label, value, color }) => (
    <div className="gd-chip">
        <span className="gd-chip-val" style={color ? { color } : {}}>{value}</span>
        <span className="gd-chip-label">{label}</span>
    </div>
)

const LDot = ({ bg, border, label }) => (
    <span className="gd-ld">
        <span className="gd-ld-dot" style={{ background: bg, borderColor: border }} />
        {label}
    </span>
)

const TCell = ({ icon, label, value, color }) => (
    <div className="tt-cell">
        <div className="tt-cell-label">{icon} {label}</div>
        <div className="tt-cell-val" style={{ color }}>{value}</div>
    </div>
)

export default GraphDashboard
