"use client";
import { useState } from "react";

export default function TestPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testOpenAI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h1>API Test Page</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Test OpenAI API</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something like: I'm 5'6 and curvy, need jeans"
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <button onClick={testOpenAI} disabled={loading}>
          {loading ? "Testing..." : "Test OpenAI"}
        </button>
      </div>

      {result && (
        <div
          style={{
            background: "#f5f5f5",
            padding: "10px",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Result:</strong>
          <br />
          {result}
        </div>
      )}
    </div>
  );
}
