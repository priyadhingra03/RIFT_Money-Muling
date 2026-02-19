import { useState } from "react"
import UploadView from "./components/UploadView"
import GraphDashboard from "./components/GraphDashboard"
import "./App.css"

function App() {
  const [analysisResult, setAnalysisResult] = useState(null)

  if (analysisResult) {
    return (
      <GraphDashboard
        data={analysisResult}
        onBack={() => setAnalysisResult(null)}
      />
    )
  }

  return <UploadView onResult={setAnalysisResult} />
}

export default App