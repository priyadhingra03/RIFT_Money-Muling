class Graph {
  constructor() {
    this.nodes = new Set()

    this.adjList = new Map()          // sender -> [receivers]
    this.reverseAdjList = new Map()   // receiver -> [senders]

    this.inDegree = {}
    this.outDegree = {}

    this.transactionCount = {}        // total transactions per account

    this.transactions = []            // store full transaction objects
  }

  addTransaction(tx) {
    const { sender_id, receiver_id } = tx

    // Add nodes
    this.nodes.add(sender_id)
    this.nodes.add(receiver_id)

    // Initialize maps if not present
    if (!this.adjList.has(sender_id)) {
      this.adjList.set(sender_id, [])
    }

    if (!this.reverseAdjList.has(receiver_id)) {
      this.reverseAdjList.set(receiver_id, [])
    }

    // Add directed edge
    this.adjList.get(sender_id).push(receiver_id)
    this.reverseAdjList.get(receiver_id).push(sender_id)

    // Update degrees
    this.outDegree[sender_id] = (this.outDegree[sender_id] || 0) + 1
    this.inDegree[receiver_id] = (this.inDegree[receiver_id] || 0) + 1

    // Transaction count
    this.transactionCount[sender_id] =
      (this.transactionCount[sender_id] || 0) + 1

    this.transactionCount[receiver_id] =
      (this.transactionCount[receiver_id] || 0) + 1

    // Store transaction
    this.transactions.push(tx)
  }
}

module.exports = Graph