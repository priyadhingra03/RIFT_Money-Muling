function findCycles(graph) {
  const cycles = []

  function dfs(start, current, path, depth) {
    if (depth > 5) return

    path.push(current)

    const neighbors = graph.adjList[current] || []

    for (let neighbor of neighbors) {
      if (neighbor === start && path.length >= 3) {
        cycles.push([...path])
      }

      if (!path.includes(neighbor)) {
        dfs(start, neighbor, path, depth + 1)
      }
    }

    path.pop()
  }

  for (let node of Object.keys(graph.nodes)) {
    dfs(node, node, [], 0)
  }

  return removeDuplicateCycles(cycles)
}

// -------- Helper: Normalize cycle --------
function normalizeCycle(cycle) {
  // Find the canonical (lexicographically smallest) rotation
  let minRotation = cycle.join("-")
  
  for (let i = 1; i < cycle.length; i++) {
    const rotated = [...cycle.slice(i), ...cycle.slice(0, i)]
    const rotatedStr = rotated.join("-")
    if (rotatedStr < minRotation) {
      minRotation = rotatedStr
    }
  }
  
  return minRotation
}

// -------- Helper: Remove duplicates --------
function removeDuplicateCycles(cycles) {
  const unique = new Set()
  const result = []

  for (let cycle of cycles) {
    const key = normalizeCycle(cycle)
    if (!unique.has(key)) {
      unique.add(key)
      result.push(cycle)
    }
  }

  return result
}

module.exports = findCycles