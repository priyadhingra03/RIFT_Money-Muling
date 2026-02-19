# RIFT — Money Mule Detection Engine

> **Real-time graph-based fraud ring detection using transaction network analysis**

---

## 🔴 Live Demo

> https://rift-money-muling-5osucl2hl-priyadhingra03s-projects.vercel.app/
---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Cytoscape.js |
| **Backend** | Node.js, Express 5 |
| **File Parsing** | csv-parser, Multer |
| **Graph Rendering** | Cytoscape.js (cose / circle / grid / breadthfirst layouts) |
| **Styling** | Vanilla CSS (dark fintech theme) |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│  UploadView → ResultsPage (Rings Table ↔ Graph View)    │
│  React 19 + Vite + Cytoscape.js                         │
└───────────────────────┬─────────────────────────────────┘
                        │  POST /api/upload (multipart CSV)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                        SERVER                           │
│  Express 5  →  csv-parser  →  Graph Builder             │
│                                    │                    │
│              ┌─────────────────────┼──────────────┐     │
│              ▼                     ▼              ▼     │
│       Cycle Detection    Smurf Detection   Shell Detect │
│       (DFS, depth ≤ 5)  (Fan-In/Fan-Out)  (DFS chains) │
│              └─────────────────────┴──────────────┘     │
│                                    │                    │
│                          Scoring Engine                  │
│                          (normalize → ring scores)      │
│                                    │                    │
│              JSON: suspicious_accounts + fraud_rings    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔬 Algorithm Approach

### 1. Cycle Detection — `O(V × V × d)` where `d = max depth 5`

Performs a **depth-limited DFS** from every node to detect circular money flows (e.g., A→B→C→A).  
Canonical rotation normalization is used to deduplicate cycles that are the same ring traversed from different starting points.

```
For each node N:
  DFS(N, depth=0, path=[])
  If neighbor == N and path.length >= 3 → cycle found
  Deduplicate via lexicographically smallest rotation
```

**Complexity:** `O(V · Vᵈ)` — bounded in practice by depth cap of 5 hops.

---

### 2. Fan-In / Fan-Out Detection (Smurf Patterns) — `O(T log T)`

Sorts all transactions by timestamp, then uses a **72-hour sliding window** to find:

- **Fan-In:** ≥ 10 distinct senders → single receiver within 72 hours (smurfs funding a mule)  
- **Fan-Out:** ≥ 10 distinct receivers from a single sender within 72 hours (layering)

**Complexity:** `O(T log T)` for sort + `O(T²)` worst-case windowing — bounded by the 72h break condition.

---

### 3. Shell Network Detection — `O(V × Vᵈ)`

DFS chains of length ≥ 4 where all **intermediate nodes** have exactly **2–3 transactions** — the hallmark of shell/layering accounts that exist only to pass funds through.

**Complexity:** `O(V · Vᵈ)` with depth cap `d = 5`.

---

## 🎯 Suspicion Score Methodology

Each account accumulates a **raw score** based on which fraud patterns it participates in:

| Pattern | Points | Rationale |
|---------|--------|-----------|
| Cycle member | **+40** | Circular flows are the strongest money-muling signal |
| Fan-In member | **+25** | Receiving from many sources is a classic smurf indicator |
| Fan-Out member | **+25** | Rapid dispersal to many receivers signals layering |
| Shell chain member | **+15** | Intermediate-only accounts suggest layering infrastructure |
| High-velocity | **+5** | > 0.5 tx/hour sustained rate adds a velocity signal |

**Normalization:**  
```
suspicion_score = (raw_score / MAX_RAW_SCORE) × 100
MAX_RAW_SCORE = 110  (theoretical maximum if all patterns triggered)
```

Scores are clamped to `[0, 100]` and rounded to 1 decimal place.

**Ring Risk Score** = average `suspicion_score` of all member accounts.

---

## 📦 Installation & Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Clone & Install

```bash
git clone https://github.com/priyadhingra03/RIFT_Money-Muling.git
cd RIFT_Money-Muling

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Run Locally

```bash
# Terminal 1 — start the backend (port 5000)
cd server
npm run dev

# Terminal 2 — start the frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173**

---

## 📋 Usage Instructions

1. **Prepare a CSV** with the following columns:

   | Column | Type | Example |
   |--------|------|---------|
   | `sender_id` | String | `ACC_001` |
   | `receiver_id` | String | `ACC_042` |
   | `amount` | Float | `15000.00` |
   | `timestamp` | ISO 8601 | `2024-01-15T10:30:00Z` |
   | `transaction_type` | String | `transfer` |

2. **Upload** the CSV on the home page and click **Analyze Now**

3. **Results Page** shows:
   - Summary chips (total accounts, flagged, rings, time)
   - **📋 Rings Table** — Ring ID, Pattern Type, Member Count, Risk Score, Member Account IDs
   - **🕸 Graph View** — interactive network graph with hover tooltips

4. **⬇ Export JSON** downloads `rift_analysis.json` in the standard format

---

## ⚠️ Known Limitations

| Limitation | Detail |
|-----------|--------|
| **File size** | Large CSVs (> 50k rows) may cause slow processing; no streaming pagination |
| **Cycle depth** | Cycles longer than 5 hops are not detected by design |
| **Fan threshold** | Fan-In/Out threshold of 10 senders/receivers is fixed; not configurable |
| **No persistence** | Uploaded files are deleted immediately; no database storage |
| **Single file** | Only one CSV can be analyzed per session |
| **No auth** | No user authentication or role-based access control |
| **time window** | 72-hour window for smurf detection is hardcoded |

---

## 👥 Team Members

| Name | Role |
|------|------|
| Priya Dhingra | Full-Stack Development, Algorithm Design |

---

## 📄 Output Format

The exported JSON follows this exact schema:

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC_00123",
      "suspicion_score": 87.5,
      "detected_patterns": ["cycle_length_3", "high_velocity"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_00123"],
      "pattern_type": "cycle",
      "risk_score": 95.3
    }
  ],
  "summary": {
    "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 15,
    "fraud_rings_detected": 4,
    "processing_time_seconds": 2.3
  }
}
```
