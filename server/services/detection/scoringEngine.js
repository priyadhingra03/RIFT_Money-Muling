function scoringEngine({
  graph,
  cycles,
  fanInRings,
  fanOutRings,
  shellRings,
  processingTimeSeconds
}) {
  const accountMap = {}
  const fraudRings = []

  let ringCounter = 1

  const MAX_RAW_SCORE = 110

  function generateRingId() {
    const id = "RING_" + String(ringCounter).padStart(3, "0")
    ringCounter++
    return id
  }

  function addScore(account, value, pattern, ringId) {
    if (!accountMap[account]) {
      accountMap[account] = {
        raw_score: 0,
        detected_patterns: new Set(),
        ring_ids: new Set()
      }
    }

    accountMap[account].raw_score += value
    accountMap[account].detected_patterns.add(pattern)
    accountMap[account].ring_ids.add(ringId)
  }

  // ----------------------------
  // 1️⃣ Cycles (+40)
  // ----------------------------

  for (let cycle of cycles) {
    const ringId = generateRingId()

    for (let account of cycle) {
      addScore(account, 40, `cycle_length_${cycle.length}`, ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: cycle,
      pattern_type: "cycle",
      risk_score: 0
    })
  }

  // ----------------------------
  // 2️⃣ Fan-In (+25)
  // ----------------------------

  for (let ring of fanInRings) {
    const ringId = generateRingId()

    for (let account of ring.member_accounts) {
      addScore(account, 25, "fan_in", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: ring.member_accounts,
      pattern_type: "fan_in",
      risk_score: 0
    })
  }

  // ----------------------------
  // 3️⃣ Fan-Out (+25)
  // ----------------------------

  for (let ring of fanOutRings) {
    const ringId = generateRingId()

    for (let account of ring.member_accounts) {
      addScore(account, 25, "fan_out", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: ring.member_accounts,
      pattern_type: "fan_out",
      risk_score: 0
    })
  }

  // ----------------------------
  // 4️⃣ Shell (+15)
  // ----------------------------

  for (let ring of shellRings) {
    const ringId = generateRingId()

    for (let account of ring.member_accounts) {
      addScore(account, 15, "shell_layer", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: ring.member_accounts,
      pattern_type: "shell",
      risk_score: 0
    })
  }

  // ----------------------------
  // 5️⃣ High Velocity (+5)
  // ----------------------------

  for (let accountId in graph.nodes) {
    const node = graph.nodes[accountId]

    if (!node || !node.first_tx || !node.last_tx) continue

    const durationHours =
      (node.last_tx - node.first_tx) / (1000 * 60 * 60)

    let isHighVelocity = false

    if (durationHours <= 0) {
      isHighVelocity = node.transaction_count > 5
    } else {
      isHighVelocity =
        node.transaction_count / Math.max(durationHours, 1) > 0.5
    }

    if (isHighVelocity) {
      addScore(accountId, 5, "high_velocity", null)
    }
  }

  // ----------------------------
  // 6️⃣ Normalize Scores
  // ----------------------------

  const suspiciousAccounts = []

  for (let account in accountMap) {
    const raw = accountMap[account].raw_score

    let normalized = (raw / MAX_RAW_SCORE) * 100
    normalized = parseFloat(normalized.toFixed(1))

    suspiciousAccounts.push({
      account_id: account,
      suspicion_score: normalized,
      detected_patterns: Array.from(accountMap[account].detected_patterns),
      ring_id: Array.from(accountMap[account].ring_ids).filter(Boolean)[0] || null
    })
  }

  suspiciousAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score)

  // ----------------------------
  // 7️⃣ Ring Risk Score (Average)
  // ----------------------------

  for (let ring of fraudRings) {
    let total = 0
    let count = 0

    for (let member of ring.member_accounts) {
      const acc = suspiciousAccounts.find(a => a.account_id === member)
      if (acc) {
        total += acc.suspicion_score
        count++
      }
    }

    ring.risk_score = parseFloat((total / count).toFixed(1))
  }

  // ----------------------------
  // 8️⃣ Summary
  // ----------------------------

  const summary = {
    total_accounts_analyzed: Object.keys(graph.nodes).length,
    suspicious_accounts_flagged: suspiciousAccounts.length,
    fraud_rings_detected: fraudRings.length,
    processing_time_seconds: parseFloat(processingTimeSeconds.toFixed(2))
  }

  // ----------------------------
  // 9️⃣ Build graph_data for frontend
  // ----------------------------

  const suspiciousSet = new Set(suspiciousAccounts.map(a => a.account_id))

  const graphNodes = Object.keys(graph.nodes).map(id => {
    const accInfo = suspiciousAccounts.find(a => a.account_id === id)
    return {
      id,
      label: id,
      suspicious: suspiciousSet.has(id),
      score: accInfo?.suspicion_score || 0,
      detected_patterns: accInfo?.detected_patterns || [],
      ring_id: accInfo?.ring_id || null,
      ...graph.nodes[id]
    }
  })

  const graphEdges = graph.edges.map((tx, i) => ({
    id: `e${i}`,
    source: tx.sender_id,
    target: tx.receiver_id,
    amount: tx.amount,
    timestamp: tx.timestamp,
    transaction_type: tx.transaction_type || null
  }))

  return {
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    summary,
    graph_data: {
      nodes: graphNodes,
      edges: graphEdges
    }
  }
}

module.exports = scoringEngine