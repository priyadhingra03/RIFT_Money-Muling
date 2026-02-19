const badge = {
    cycle: { color: "#ff5252", label: "🔄 Cycle" },
    fan_in: { color: "#ff9800", label: "📥 Fan-In" },
    fan_out: { color: "#2196f3", label: "📤 Fan-Out" },
    shell: { color: "#9c27b0", label: "🐚 Shell" }
}

const RingTable = ({ fraudRings, suspiciousAccounts, summary }) => {
    return (
        <div style={{ color: "#cdd9e5", padding: "0 4px" }}>
            {/* Summary Bar */}
            {summary && (
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginBottom: 20,
                        flexWrap: "wrap"
                    }}
                >
                    {[
                        { label: "Total Accounts", value: summary.total_accounts_analyzed },
                        {
                            label: "Flagged",
                            value: summary.suspicious_accounts_flagged,
                            highlight: true
                        },
                        { label: "Fraud Rings", value: summary.fraud_rings_detected },
                        {
                            label: "Processing Time",
                            value: `${summary.processing_time_seconds}s`
                        }
                    ].map(s => (
                        <div
                            key={s.label}
                            style={{
                                flex: 1,
                                minWidth: 120,
                                background: "#0d2137",
                                border: `1px solid ${s.highlight ? "#ff525244" : "#1e3a5f"}`,
                                borderRadius: 8,
                                padding: "12px 16px",
                                textAlign: "center"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: s.highlight ? "#ff5252" : "#00e5ff"
                                }}
                            >
                                {s.value}
                            </div>
                            <div style={{ fontSize: 11, color: "#5a7a95", marginTop: 2 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Fraud Rings Table */}
            <h3
                style={{
                    color: "#00e5ff",
                    margin: "0 0 10px",
                    fontSize: 14,
                    fontWeight: 600
                }}
            >
                🔴 Detected Fraud Rings
            </h3>
            {!fraudRings || fraudRings.length === 0 ? (
                <p style={{ color: "#5a7a95" }}>No fraud rings detected.</p>
            ) : (
                <div style={{ overflowX: "auto", marginBottom: 24 }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#0a1929" }}>
                                {["Ring ID", "Pattern", "Risk Score", "Members"].map(h => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "10px 14px",
                                            textAlign: "left",
                                            color: "#4a7fa8",
                                            fontWeight: 600,
                                            borderBottom: "1px solid #1e3a5f"
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {fraudRings.map((ring, i) => {
                                const b = badge[ring.pattern_type] || {
                                    color: "#aaa",
                                    label: ring.pattern_type
                                }
                                return (
                                    <tr
                                        key={ring.ring_id}
                                        style={{
                                            background: i % 2 === 0 ? "#0d2137" : "transparent",
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "10px 14px",
                                                borderBottom: "1px solid #1a3050",
                                                fontFamily: "monospace",
                                                color: "#e0eaf4"
                                            }}
                                        >
                                            {ring.ring_id}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 14px",
                                                borderBottom: "1px solid #1a3050"
                                            }}
                                        >
                                            <span
                                                style={{
                                                    background: b.color + "22",
                                                    color: b.color,
                                                    border: `1px solid ${b.color}55`,
                                                    borderRadius: 4,
                                                    padding: "2px 8px",
                                                    fontSize: 12
                                                }}
                                            >
                                                {b.label}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 14px",
                                                borderBottom: "1px solid #1a3050",
                                                color:
                                                    ring.risk_score >= 70
                                                        ? "#ff5252"
                                                        : ring.risk_score >= 40
                                                            ? "#ff9800"
                                                            : "#4caf50",
                                                fontWeight: 700
                                            }}
                                        >
                                            {ring.risk_score}%
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 14px",
                                                borderBottom: "1px solid #1a3050",
                                                maxWidth: 280
                                            }}
                                        >
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {ring.member_accounts.map(acc => (
                                                    <span
                                                        key={acc}
                                                        style={{
                                                            background: "#1e3a5f",
                                                            borderRadius: 4,
                                                            padding: "2px 6px",
                                                            fontSize: 11,
                                                            fontFamily: "monospace",
                                                            color: "#90c9f9"
                                                        }}
                                                    >
                                                        {acc}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Suspicious Accounts Table */}
            <h3
                style={{
                    color: "#00e5ff",
                    margin: "0 0 10px",
                    fontSize: 14,
                    fontWeight: 600
                }}
            >
                ⚠️ Top Suspicious Accounts
            </h3>
            {!suspiciousAccounts || suspiciousAccounts.length === 0 ? (
                <p style={{ color: "#5a7a95" }}>No suspicious accounts found.</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#0a1929" }}>
                                {["Account", "Suspicion Score", "Patterns", "Ring"].map(h => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "10px 14px",
                                            textAlign: "left",
                                            color: "#4a7fa8",
                                            fontWeight: 600,
                                            borderBottom: "1px solid #1e3a5f"
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {suspiciousAccounts.slice(0, 20).map((acc, i) => (
                                <tr
                                    key={acc.account_id}
                                    style={{
                                        background: i % 2 === 0 ? "#0d2137" : "transparent"
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid #1a3050",
                                            fontFamily: "monospace",
                                            color: "#e0eaf4"
                                        }}
                                    >
                                        {acc.account_id}
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid #1a3050"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 6,
                                                    background: "#1e3a5f",
                                                    borderRadius: 3,
                                                    maxWidth: 80,
                                                    overflow: "hidden"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${acc.suspicion_score}%`,
                                                        background:
                                                            acc.suspicion_score >= 70
                                                                ? "#ff5252"
                                                                : acc.suspicion_score >= 40
                                                                    ? "#ff9800"
                                                                    : "#4caf50",
                                                        borderRadius: 3
                                                    }}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color:
                                                        acc.suspicion_score >= 70
                                                            ? "#ff5252"
                                                            : acc.suspicion_score >= 40
                                                                ? "#ff9800"
                                                                : "#4caf50"
                                                }}
                                            >
                                                {acc.suspicion_score}%
                                            </span>
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid #1a3050"
                                        }}
                                    >
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                            {acc.detected_patterns.map(p => {
                                                const b = badge[p.split("_").slice(0, 2).join("_")] ||
                                                    badge[p.split("_")[0]] || { color: "#aaa", label: p }
                                                return (
                                                    <span
                                                        key={p}
                                                        style={{
                                                            background: b.color + "22",
                                                            color: b.color,
                                                            border: `1px solid ${b.color}55`,
                                                            borderRadius: 4,
                                                            padding: "1px 6px",
                                                            fontSize: 11
                                                        }}
                                                    >
                                                        {p}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid #1a3050",
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            color: "#ff9800"
                                        }}
                                    >
                                        {acc.ring_id || "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default RingTable
