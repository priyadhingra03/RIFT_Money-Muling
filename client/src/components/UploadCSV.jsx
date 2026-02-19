import { useState } from "react"
import axios from "axios"
import GraphView from "./GraphView"
import RingTable from "./RingTable"
import "./UploadCSV.css"

const UploadCSV = () => {
  const [file, setFile] = useState(null)
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("graph")

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(
        "https://rift-money-muling.onrender.com/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      setResponse(res.data)
      setActiveTab("graph")
    } catch (error) {
      console.error(error)
      alert("Upload failed: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h2>💰 Money Muling Detection System</h2>
        <p className="subtitle">Upload transaction data to detect fraud rings</p>

        <div className="upload-section">
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </div>

        {file && (
          <div className="file-info">
            <span>📄 Selected: {file.name}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>Analyzing transactions and detecting fraud patterns...</p>
        </div>
      )}

      {response && !loading && (
        <div className="results-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "graph" ? "active" : ""}`}
              onClick={() => setActiveTab("graph")}
            >
              📊 Graph View
            </button>
            <button
              className={`tab ${activeTab === "rings" ? "active" : ""}`}
              onClick={() => setActiveTab("rings")}
            >
              🔍 Fraud Rings
            </button>
            <button
              className={`tab ${activeTab === "raw" ? "active" : ""}`}
              onClick={() => setActiveTab("raw")}
            >
              📋 Raw Data
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "graph" && response.graph_data && (
              <GraphView
                graphData={response.graph_data}
                fraudRings={response.fraud_rings}
              />
            )}

            {activeTab === "rings" && (
              <RingTable
                fraudRings={response.fraud_rings}
                suspiciousAccounts={response.suspicious_accounts}
                summary={response.summary}
              />
            )}

            {activeTab === "raw" && (
              <div className="raw-data">
                <pre>{JSON.stringify(response, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadCSV
