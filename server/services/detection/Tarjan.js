function findSCC(graph) {
  const visited = new Set()
  const stack = []

  // 1️⃣ DFS to fill stack
  function dfs1(node) {
    visited.add(node)

    const neighbors = graph.adjList.get(node) || []
    for (let nei of neighbors) {
      if (!visited.has(nei)) {
        dfs1(nei)
      }
    }

    stack.push(node)
  }

  // Run on all nodes
  for (let node of graph.nodes) {
    if (!visited.has(node)) {
      dfs1(node)
    }
  }

  // 2️⃣ DFS on reversed graph
  const visitedRev = new Set()
  const sccs = []

  function dfs2(node, comp) {
    visitedRev.add(node)
    comp.push(node)

    const neighbors = graph.reverseAdjList.get(node) || []
    for (let nei of neighbors) {
      if (!visitedRev.has(nei)) {
        dfs2(nei, comp)
      }
    }
  }

  // Process stack
  while (stack.length) {
    const node = stack.pop()

    if (!visitedRev.has(node)) {
      const comp = []
      dfs2(node, comp)
      sccs.push(comp)
    }
  }

  return sccs
}

module.exports = findSCC
