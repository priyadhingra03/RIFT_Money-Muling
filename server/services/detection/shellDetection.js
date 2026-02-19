function findShellNetworks(graph) {
  const shellRings = []

  function dfs(current, path) {
    if (path.length > 5) return   // limit depth to avoid explosion

    const neighbors = graph.adjList.get(current) || []

    for (let neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        const newPath = [...path, neighbor]

        // Check if path length >= 4 nodes (3 hops)
        if (newPath.length >= 4) {
          const intermediateNodes = newPath.slice(1, -1)

          const valid = intermediateNodes.every(node => {
            const count = graph.transactionCount[node] || 0
            return count >= 2 && count <= 3
          })

          if (valid) {
            shellRings.push({
              pattern_type: "shell",
              member_accounts: newPath
            })
          }
        }

        dfs(neighbor, newPath)
      }
    }
  }

  for (let node of graph.nodes) {
    dfs(node, [node])
  }

  return removeDuplicateShells(shellRings)
}


function normalizePath(path) {
  return [...path].sort().join("-")
}

function removeDuplicateShells(rings) {
  const unique = new Map()

  for (let ring of rings) {
    const key = normalizePath(ring.member_accounts)
    if (!unique.has(key)) {
      unique.set(key, ring)
    }
  }

  return Array.from(unique.values())
}

module.exports = findShellNetworks