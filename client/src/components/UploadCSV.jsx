import { useState } from "react"
import axios from "axios"
import "./UploadCSV.css"

const UploadCSV = () => {
  const [file, setFile] = useState(null)
  const [response, setResponse] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      setResponse(res.data)
    } catch (error) {
      console.error(error)
      alert("Upload failed")
    }
  }

  return (
    <div className="upload-container">
      <h2>Upload CSV File</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {response && (
        <div className="response">
          <h3>Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default UploadCSV