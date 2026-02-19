function findSmurfPatterns(graph) {
  const fanInRings = []
  const fanOutRings = []

  const transactions = [...graph.transactions].sort(
    (a, b) => a.timestamp - b.timestamp
  )

  // FAN-IN
  const receiverMap = {}

  for (let tx of transactions) {
    if (!receiverMap[tx.receiver_id]) {
      receiverMap[tx.receiver_id] = []
    }
    receiverMap[tx.receiver_id].push(tx)
  }

  for (let receiver in receiverMap) {
    const txList = receiverMap[receiver]

    for (let i = 0; i < txList.length; i++) {
      const windowSenders = new Set()

      for (let j = i; j < txList.length; j++) {
        const timeDiff =
          (txList[j].timestamp - txList[i].timestamp) / (1000 * 60 * 60)

        if (timeDiff > 72) break

        windowSenders.add(txList[j].sender_id)
      }

      if (windowSenders.size >= 10) {
        fanInRings.push({
          pattern_type: "fan_in",
          member_accounts: [receiver, ...windowSenders]
        })
        break
      }
    }
  }

  // FAN-OUT
  const senderMap = {}

  for (let tx of transactions) {
    if (!senderMap[tx.sender_id]) {
      senderMap[tx.sender_id] = []
    }
    senderMap[tx.sender_id].push(tx)
  }

  for (let sender in senderMap) {
    const txList = senderMap[sender]

    for (let i = 0; i < txList.length; i++) {
      const windowReceivers = new Set()

      for (let j = i; j < txList.length; j++) {
        const timeDiff =
          (txList[j].timestamp - txList[i].timestamp) / (1000 * 60 * 60)

        if (timeDiff > 72) break

        windowReceivers.add(txList[j].receiver_id)
      }

      if (windowReceivers.size >= 10) {
        fanOutRings.push({
          pattern_type: "fan_out",
          member_accounts: [sender, ...windowReceivers]
        })
        break
      }
    }
  }

  return {
    fanInRings,
    fanOutRings
  }
}

module.exports = findSmurfPatterns