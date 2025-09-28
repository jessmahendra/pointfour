'use client';

import { useState, useEffect } from 'react';

interface LLMTestResult {
  success: boolean;
  result: string | object;
  interaction: {
    id: string;
    model: string;
    duration: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    timestamp: string;
  };
}

interface LLMInteraction {
  id: string;
  timestamp: string;
  type: 'text' | 'object';
  model: string;
  prompt: string;
  response: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface UsageStats {
  totalInteractions: number;
  totalTokens: number;
  averageDuration: number;
  modelBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  errorRate: number;
}

export function AiInspector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'test' | 'interactions' | 'stats'>('test');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [testQuery, setTestQuery] = useState('Tell me about Zara sizing for jeans');
  const [testType, setTestType] = useState<'text' | 'object'>('text');
  const [interactions, setInteractions] = useState<LLMInteraction[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<LLMInteraction | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interactionsRes, statsRes] = await Promise.all([
        fetch('/api/llm-test?action=interactions&limit=50'),
        fetch('/api/llm-test?action=stats')
      ]);

      const interactionsData = await interactionsRes.json();
      const statsData = await statsRes.json();

      if (interactionsData.success) {
        setInteractions(interactionsData.interactions);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    if (!testQuery.trim()) return;

    try {
      setTestLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/llm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, type: testType })
      });

      const data = await response.json();
      setTestResult(data);
      
      // Refresh data to show new interaction
      await fetchData();
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        success: false,
        result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        interaction: {
          id: 'error',
          model: 'unknown',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setTestLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/llm-test?action=clear');
      const data = await response.json();
      if (data.success) {
        await fetchData();
        setTestResult(null);
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Refresh every 10 seconds when open
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        AI Inspector
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-2xl h-[80vh] shadow-lg border border-gray-200 rounded-lg bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Inspector</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'test' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Test
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'interactions' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Interactions ({interactions.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'stats' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Stats
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'test' && (
          <div className="space-y-4">
            {/* Test Controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Query
                </label>
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test query..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Type
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as 'text' | 'object')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text Generation</option>
                  <option value="object">Structured Object</option>
                </select>
              </div>
              
              <button
                onClick={runTest}
                disabled={testLoading || !testQuery.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {testLoading ? 'Testing...' : 'Run Test'}
              </button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    {testResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {testResult.interaction && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Model: {testResult.interaction.model}</div>
                    <div>Duration: {testResult.interaction.duration}ms</div>
                    {testResult.interaction.tokens && (
                      <div>Tokens: {testResult.interaction.tokens.total}</div>
                    )}
                    <div>Time: {new Date(testResult.interaction.timestamp).toLocaleTimeString()}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {typeof testResult.result === 'string' 
                        ? testResult.result 
                        : JSON.stringify(testResult.result, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Recent Interactions</h4>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading interactions...</div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No interactions yet. Try running a test.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedInteraction(interaction)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded ${
                            interaction.type === 'text' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {interaction.type}
                          </span>
                          <span className="text-sm font-medium">{interaction.model}</span>
                          {interaction.error && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Error
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {interaction.prompt.substring(0, 80)}
                          {interaction.prompt.length > 80 && '...'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(interaction.timestamp).toLocaleString()} • 
                          {interaction.duration}ms • 
                          {interaction.tokens?.total || 0} tokens
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Usage Statistics</h4>
            {loading ? (
              <div className="text-center py-4">Loading statistics...</div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalInteractions}</div>
                    <div className="text-sm text-gray-600">Total Interactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalTokens.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageDuration)}ms</div>
                    <div className="text-sm text-gray-600">Avg Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.errorRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Model Breakdown</h5>
                    {Object.entries(stats.modelBreakdown).map(([model, count]) => (
                      <div key={model} className="flex justify-between text-sm">
                        <span>{model}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Type Breakdown</h5>
                    {Object.entries(stats.typeBreakdown).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span>{type}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No statistics available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interaction Detail Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Interaction Details</h3>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Prompt</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                    {selectedInteraction.prompt}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                    {selectedInteraction.response || (selectedInteraction.error ? `Error: ${selectedInteraction.error}` : 'No response')}
                  </pre>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Model:</span> {selectedInteraction.model}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedInteraction.type}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {selectedInteraction.duration}ms
                </div>
                <div>
                  <span className="font-medium">Tokens:</span> {selectedInteraction.tokens?.total || 0}
                </div>
              </div>
              {selectedInteraction.metadata && Object.keys(selectedInteraction.metadata).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm">
                    {JSON.stringify(selectedInteraction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}