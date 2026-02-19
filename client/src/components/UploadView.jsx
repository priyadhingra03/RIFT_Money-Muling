import { useState } from "react"
import axios from "axios"
import "./UploadView.css"

const UploadView = ({ onResult }) => {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [drag, setDrag] = useState(false)

    const handleFile = (f) => {
        if (f && f.name.endsWith(".csv")) setFile(f)
        else alert("Please select a valid .csv file")
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDrag(false)
        handleFile(e.dataTransfer.files[0])
    }

    const handleUpload = async () => {
        if (!file) { alert("Please select a CSV file"); return }
        setLoading(true)
        const formData = new FormData()
        formData.append("file", file)
        try {
            const res = await axios.post("http://localhost:5000/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            onResult(res.data)
        } catch (err) {
            alert("Upload failed: " + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="upload-view">
            {/* Background grid */}
            <div className="grid-bg" />

            {/* Glow blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />

            <div className="upload-card">
                {/* Logo / Title */}
                <div className="brand">
                    <span className="brand-icon">⬡</span>
                    <span className="brand-name">RIFT</span>
                    <span className="brand-tag">Money Mule Detection Engine</span>
                </div>

                <h1 className="headline">Detect Financial Crime<br />with Graph Intelligence</h1>
                <p className="sub">Upload a transaction CSV to analyze fraud rings, cycles, and suspicious accounts using advanced graph algorithms.</p>

                {/* Drop Zone */}
                <div
                    className={`drop-zone ${drag ? "drag-over" : ""} ${file ? "has-file" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("csv-input").click()}
                >
                    <input
                        id="csv-input"
                        type="file"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                    {file ? (
                        <>
                            <span className="drop-icon">📄</span>
                            <span className="drop-filename">{file.name}</span>
                            <span className="drop-size">{(file.size / 1024).toFixed(1)} KB · Click to change</span>
                        </>
                    ) : (
                        <>
                            <span className="drop-icon">⬆</span>
                            <span className="drop-label">Drop CSV here or click to browse</span>
                            <span className="drop-hint">Required columns: sender_id, receiver_id, amount, timestamp, transaction_type</span>
                        </>
                    )}
                </div>

                {/* Analyze Button */}
                <button
                    className={`analyze-btn ${loading ? "loading" : ""}`}
                    onClick={handleUpload}
                    disabled={loading || !file}
                >
                    {loading ? (
                        <><span className="spin-ring" /> Analyzing transactions…</>
                    ) : (
                        <><span>⚡</span> Analyze Now</>
                    )}
                </button>

                {/* Feature Pills */}
                <div className="features">
                    {["Cycle Detection", "Fan-In / Fan-Out", "Shell Networks", "Suspicion Scoring"].map(f => (
                        <span key={f} className="feat-pill">{f}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default UploadView
