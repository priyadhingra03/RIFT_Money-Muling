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

  // ----------------------------
  // CONFIGURATION (Single Digit Base Weights)
  // ----------------------------

  const BASE_WEIGHTS = {
    cycle: 7,
    shell: 6,
    "fan-in": 5,
    "fan-out": 5
  }

  // ----------------------------
  // Helper: Assign Ring ID
  // ----------------------------

  function generateRingId() {
    const id = "RING_" + String(ringCounter).padStart(3, "0")
    ringCounter++
    return id
  }

  // ----------------------------
  // Helper: Add Score to Accounts
  // ----------------------------

  function addScore(account, rawContribution, patternType, ringId) {
    if (!accountMap[account]) {
      accountMap[account] = {
        raw_score: 0,
        detected_patterns: new Set(),
        ring_ids: new Set()
      }
    }

    accountMap[account].raw_score += rawContribution
    accountMap[account].detected_patterns.add(patternType)
    accountMap[account].ring_ids.add(ringId)
  }

  // ----------------------------
  // 1️⃣ Process Cycles
  // ----------------------------

  for (let cycle of cycles) {
    const ringId = generateRingId()
    const length = cycle.length

    const multiplier = 1 + (length - 3) * 0.2
    const rawContribution = BASE_WEIGHTS.cycle * multiplier

    for (let account of cycle) {
      addScore(account, rawContribution, `cycle_length_${length}`, ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: cycle,
      pattern_type: "cycle",
      risk_score: 0
    })
  }

  // ----------------------------
  // 2️⃣ Process Fan-In
  // ----------------------------

  for (let ring of fanInRings) {
    const ringId = generateRingId()
    const members = ring.member_accounts
    const uniqueSenders = members.length - 1

    const multiplier = 1 + (uniqueSenders - 10) * 0.08
    const rawContribution = BASE_WEIGHTS["fan-in"] * multiplier

    for (let account of members) {
      addScore(account, rawContribution, "fan-in", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: "fan-in",
      risk_score: 0
    })
  }

  // ----------------------------
  // 3️⃣ Process Fan-Out
  // ----------------------------

  for (let ring of fanOutRings) {
    const ringId = generateRingId()
    const members = ring.member_accounts
    const uniqueReceivers = members.length - 1

    const multiplier = 1 + (uniqueReceivers - 10) * 0.08
    const rawContribution = BASE_WEIGHTS["fan-out"] * multiplier

    for (let account of members) {
      addScore(account, rawContribution, "fan-out", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: "fan-out",
      risk_score: 0
    })
  }

  // ----------------------------
  // 4️⃣ Process Shell Networks
  // ----------------------------

  for (let ring of shellRings) {
    const ringId = generateRingId()
    const members = ring.member_accounts
    const length = members.length

    const multiplier = 1 + (length - 3) * 0.2
    const rawContribution = BASE_WEIGHTS.shell * multiplier

    for (let account of members) {
      addScore(account, rawContribution, "shell", ringId)
    }

    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: "shell",
      risk_score: 0
    })
  }

  // ----------------------------
  // 5️⃣ Compute Theoretical Max Raw Score
  // ----------------------------

  const maxCycle = 7 * (1 + (5 - 3) * 0.2)       // length 5
  const maxShell = 6 * (1 + (5 - 3) * 0.2)
  const maxFanIn = 5 * (1 + (20 - 10) * 0.08)   // assuming 20 senders
  const maxFanOut = 5 * (1 + (20 - 10) * 0.08)

  const MAX_RAW = maxCycle + maxShell + maxFanIn + maxFanOut

  // ----------------------------
  // 6️⃣ Final Suspicion Score (Linear Normalization)
  // Never reaches 100
  // ----------------------------

  const suspiciousAccounts = []

  for (let account in accountMap) {
    const raw = accountMap[account].raw_score

    let finalScore = (raw / MAX_RAW) * 95

    if (finalScore >= 95) {
      finalScore = 95
    }

    finalScore = parseFloat(finalScore.toFixed(2))

    suspiciousAccounts.push({
      account_id: account,
      suspicion_score: finalScore,
      detected_patterns: Array.from(accountMap[account].detected_patterns),
      ring_id: Array.from(accountMap[account].ring_ids)[0]
    })
  }

  // Sort descending
  suspiciousAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score)

  // ----------------------------
  // 7️⃣ Compute Ring Risk Scores
  // ----------------------------

  for (let ring of fraudRings) {
    let total = 0

    for (let member of ring.member_accounts) {
      const acc = suspiciousAccounts.find(a => a.account_id === member)
      if (acc) total += acc.suspicion_score
    }

    const avg = total / ring.member_accounts.length
    const structuralMultiplier =
      1 + (ring.member_accounts.length - 3) * 0.1

    let ringScore = avg * structuralMultiplier

    if (ringScore >= 95) {
      ringScore = 95
    }

    ring.risk_score = parseFloat(ringScore.toFixed(2))
  }

  // ----------------------------
  // 8️⃣ Summary
  // ----------------------------

  const summary = {
    total_accounts_analyzed: graph.nodes.size,
    suspicious_accounts_flagged: suspiciousAccounts.length,
    fraud_rings_detected: fraudRings.length,
    processing_time_seconds: parseFloat(processingTimeSeconds.toFixed(2))
  }

  return {
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    summary: summary
  }
}

module.exports = scoringEngine