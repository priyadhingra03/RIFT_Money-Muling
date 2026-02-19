import { useState } from "react"
import UploadView from "./components/UploadView"
import ResultsPage from "./components/ResultsPage"
import "./App.css"

function App() {
  const [analysisResult, setAnalysisResult] = useState(null)

  if (analysisResult) {
    return (
      <ResultsPage
        data={analysisResult}
        onBack={() => setAnalysisResult(null)}
      />
    )
  }

  return <UploadView onResult={setAnalysisResult} />
}

export default App