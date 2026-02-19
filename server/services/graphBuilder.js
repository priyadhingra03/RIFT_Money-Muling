class Graph {
  constructor() {
    this.nodes = {}              // account_id -> metadata object

    this.adjList = {}
    this.reverseAdjList = {}

    this.edges = []
    this.transactions = []
  }

  addTransaction(tx) {
    const { sender_id, receiver_id, timestamp, amount } = tx

    // Initialize sender
    if (!this.nodes[sender_id]) {
      this.nodes[sender_id] = {
        total_sent: 0,
        total_received: 0,
        amount_sent: 0,
        amount_received: 0,
        transaction_count: 0,
        first_tx: timestamp,
        last_tx: timestamp
      }
    }

    // Initialize receiver
    if (!this.nodes[receiver_id]) {
      this.nodes[receiver_id] = {
        total_sent: 0,
        total_received: 0,
        amount_sent: 0,
        amount_received: 0,
        transaction_count: 0,
        first_tx: timestamp,
        last_tx: timestamp
      }
    }

    const amt = parseFloat(amount) || 0

    // Update sender
    this.nodes[sender_id].total_sent += 1
    this.nodes[sender_id].amount_sent += amt
    this.nodes[sender_id].transaction_count += 1
    this.nodes[sender_id].first_tx =
      Math.min(this.nodes[sender_id].first_tx, timestamp)
    this.nodes[sender_id].last_tx =
      Math.max(this.nodes[sender_id].last_tx, timestamp)

    // Update receiver
    this.nodes[receiver_id].total_received += 1
    this.nodes[receiver_id].amount_received += amt
    this.nodes[receiver_id].transaction_count += 1
    this.nodes[receiver_id].first_tx =
      Math.min(this.nodes[receiver_id].first_tx, timestamp)
    this.nodes[receiver_id].last_tx =
      Math.max(this.nodes[receiver_id].last_tx, timestamp)

    // Adjacency
    if (!this.adjList[sender_id]) this.adjList[sender_id] = []
    if (!this.reverseAdjList[receiver_id]) this.reverseAdjList[receiver_id] = []

    this.adjList[sender_id].push(receiver_id)
    this.reverseAdjList[receiver_id].push(sender_id)

    this.edges.push(tx)
    this.transactions.push(tx)
  }
}

module.exports = Graph