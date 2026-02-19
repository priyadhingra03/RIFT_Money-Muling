function findCycles(graph) {
  const cycles = []
  const visited = new Set()

  function dfs(start, current, path, depth) {
    if (depth > 5) return

    path.push(current)

    const neighbors = graph.adjList.get(current) || []

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

  for (let node of graph.nodes) {
    dfs(node, node, [], 0)
  }

  return removeDuplicateCycles(cycles)
}

function normalizeCycle(cycle) {
  const sorted = [...cycle].sort()
  return sorted.join("-")
}

function removeDuplicateCycles(cycles) {
  const unique = new Map()

  for (let cycle of cycles) {
    const key = normalizeCycle(cycle)
    if (!unique.has(key)) {
      unique.set(key, cycle)
    }
  }

  return Array.from(unique.values())
}

module.exports = findCycles
