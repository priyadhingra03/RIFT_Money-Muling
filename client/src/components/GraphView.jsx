import { useEffect, useRef, useState } from "react"
import cytoscape from "cytoscape"

const GraphView = ({ graphData, fraudRings }) => {
    const containerRef = useRef(null)
    const cyRef = useRef(null)
    const [selectedNode, setSelectedNode] = useState(null)

    const fraudAccounts = new Set(
        (fraudRings || []).flatMap(r => r.member_accounts)
    )

    useEffect(() => {
        if (!containerRef.current || !graphData) return

        const nodes = (graphData.nodes || []).map(n => ({
            data: {
                id: n.id,
                label: n.id,
                suspicious: n.suspicious ? "yes" : "no",
                inFraudRing: fraudAccounts.has(n.id) ? "yes" : "no",
                score: n.score,
                total_sent: n.total_sent,
                total_received: n.total_received,
                transaction_count: n.transaction_count
            }
        }))

        const edges = (graphData.edges || []).map(e => ({
            data: {
                id: e.id,
                source: e.source,
                target: e.target,
                amount: e.amount
            }
        }))

        // Destroy previous instance
        if (cyRef.current) {
            cyRef.current.destroy()
        }

        const cy = cytoscape({
            container: containerRef.current,
            elements: [...nodes, ...edges],
            style: [
                {
                    selector: "node",
                    style: {
                        label: "data(label)",
                        "background-color": "#1e3a5f",
                        color: "#fff",
                        "font-size": "10px",
                        width: 36,
                        height: 36,
                        "text-valign": "center",
                        "text-halign": "center",
                        "border-width": 2,
                        "border-color": "#345078",
                        "text-outline-width": 1,
                        "text-outline-color": "#0a1929"
                    }
                },
                {
                    selector: "node[suspicious = 'yes']",
                    style: {
                        "background-color": "#b71c1c",
                        "border-color": "#ff5252",
                        "border-width": 3,
                        width: 44,
                        height: 44
                    }
                },
                {
                    selector: "node[inFraudRing = 'yes']",
                    style: {
                        "border-color": "#ff6f00",
                        "border-width": 3
                    }
                },
                {
                    selector: "node:selected",
                    style: {
                        "border-color": "#00e5ff",
                        "border-width": 4
                    }
                },
                {
                    selector: "edge",
                    style: {
                        width: 1.5,
                        "line-color": "#2c4a6e",
                        "target-arrow-color": "#4a7fa8",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier",
                        opacity: 0.8
                    }
                }
            ],
            layout: {
                name: "cose",
                animate: false,
                randomize: true,
                nodeRepulsion: 8000,
                idealEdgeLength: 80
            }
        })

        cy.on("tap", "node", evt => {
            setSelectedNode(evt.target.data())
        })
        cy.on("tap", evt => {
            if (evt.target === cy) setSelectedNode(null)
        })

        cyRef.current = cy

        return () => {
            cy.destroy()
        }
    }, [graphData, fraudRings])

    return (
        <div style={{ display: "flex", gap: 12, height: "520px" }}>
            {/* Graph Container */}
            <div
                style={{
                    flex: 1,
                    background: "#0a1929",
                    borderRadius: 10,
                    border: "1px solid #1e3a5f",
                    overflow: "hidden",
                    position: "relative"
                }}
            >
                <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

                {/* Legend */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: 12,
                        display: "flex",
                        gap: 14,
                        fontSize: 11,
                        color: "#aaa",
                        background: "rgba(10,25,41,0.85)",
                        padding: "6px 10px",
                        borderRadius: 6
                    }}
                >
                    <LegendDot color="#1e3a5f" border="#345078" label="Normal" />
                    <LegendDot color="#b71c1c" border="#ff5252" label="Suspicious" />
                    <LegendDot color="#1e3a5f" border="#ff6f00" label="Fraud Ring" />
                </div>
            </div>

            {/* Node Detail Panel */}
            {selectedNode && (
                <div
                    style={{
                        width: 240,
                        background: "#0d2137",
                        borderRadius: 10,
                        border: "1px solid #1e3a5f",
                        padding: "20px 16px",
                        color: "#cdd9e5",
                        fontSize: 13,
                        overflowY: "auto",
                        flexShrink: 0
                    }}
                >
                    <div
                        style={{
                            fontWeight: 700,
                            color: "#00e5ff",
                            fontSize: 15,
                            marginBottom: 14,
                            borderBottom: "1px solid #1e3a5f",
                            paddingBottom: 8
                        }}
                    >
                        🔍 Node Details
                    </div>
                    <Detail label="Account ID" value={selectedNode.id} />
                    <Detail
                        label="Suspicion Score"
                        value={
                            <ScoreSpan score={selectedNode.score}>
                                {selectedNode.score}%
                            </ScoreSpan>
                        }
                    />
                    <Detail label="Sent (txs)" value={selectedNode.total_sent} />
                    <Detail label="Received (txs)" value={selectedNode.total_received} />
                    <Detail label="Total Txs" value={selectedNode.transaction_count} />
                    <Detail
                        label="Status"
                        value={
                            selectedNode.suspicious === "yes" ? (
                                <span style={{ color: "#ff5252" }}>⚠️ Suspicious</span>
                            ) : (
                                <span style={{ color: "#4caf50" }}>✅ Clean</span>
                            )
                        }
                    />
                    {selectedNode.inFraudRing === "yes" && (
                        <Detail
                            label="Fraud Ring"
                            value={<span style={{ color: "#ff9800" }}>🔴 Member</span>}
                        />
                    )}
                    <div style={{ marginTop: 16 }}>
                        <button
                            onClick={() => setSelectedNode(null)}
                            style={{
                                width: "100%",
                                background: "#1e3a5f",
                                color: "#90c9f9",
                                border: "1px solid #345078",
                                borderRadius: 6,
                                padding: "6px 0",
                                cursor: "pointer",
                                fontSize: 12
                            }}
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const ScoreSpan = ({ score, children }) => (
    <span
        style={{
            color: score >= 70 ? "#ff5252" : score >= 40 ? "#ff9800" : "#4caf50",
            fontWeight: 700
        }}
    >
        {children}
    </span>
)

const LegendDot = ({ color, border, label }) => (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
            style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                border: `2px solid ${border}`
            }}
        />
        {label}
    </span>
)

const Detail = ({ label, value }) => (
    <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#607a90", fontSize: 11, marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{value ?? "—"}</div>
    </div>
)

export default GraphView
