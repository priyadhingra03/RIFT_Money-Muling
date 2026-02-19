const express = require("express")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")

const Graph = require("../services/graphBuilder")
const findCycles = require("../services/detection/cycleDetection")
const findSmurfPatterns = require("../services/detection/smurfDetection")
const findShellNetworks = require("../services/detection/shellDetection")
const scoringEngine = require("../services/detection/scoringEngine")

const router = express.Router()

// configure multer
const upload = multer({ dest: "uploads/" })

router.post("/upload", upload.single("file"), (req, res) => {

  const startTime = Date.now()

  const filePath = req.file.path
  const graph = new Graph()

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      row.timestamp = new Date(row.timestamp)
      row.amount = parseFloat(row.amount)

      graph.addTransaction(row)
    })
    .on("end", () => {

      fs.unlinkSync(filePath)

      // ----------------------------
      // Run Detection Algorithms
      // ----------------------------

      const cycles = findCycles(graph)

      const smurfResults = findSmurfPatterns(graph)
      const fanInRings = smurfResults.fanInRings
      const fanOutRings = smurfResults.fanOutRings

      const shellRings = findShellNetworks(graph)

      // ----------------------------
      // Processing Time
      // ----------------------------

      const endTime = Date.now()
      const processingTimeSeconds = (endTime - startTime) / 1000

      // ----------------------------
      // Scoring Engine
      // ----------------------------

      const finalResult = scoringEngine({
        graph,
        cycles,
        fanInRings,
        fanOutRings,
        shellRings,
        processingTimeSeconds
      })

      // ----------------------------
      // Return Final JSON
      // ----------------------------

      res.json(finalResult)
    })
})

module.exports = router