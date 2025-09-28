"use client";

import { useState, useEffect } from "react";
import { LLMInteraction, useLLMStore } from "@/lib/llm-store";
import { Popover } from '@base-ui-components/react/popover';


// LLMInteraction and LLMStats interfaces are now imported from llm-store

export function AiInspector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] =
    useState<LLMInteraction | null>(null);

  // Use Zustand store for interactions
  const interactions = useLLMStore((state) => state.interactions);
  const clearInteractions = useLLMStore((state) => state.clearInteractions);

  // Poll for server updates every 5 seconds as fallback
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/llm-interactions?limit=100");
        const data = await response.json();

        if (data.success && data.interactions.length !== interactions.length) {
          // If server has different count, we might need to sync
          // For now, the store should be the source of truth
          // console.log(
          //   "🤖 AI Inspector: Server has",
          //   data.interactions.length,
          //   "interactions, store has",
          //   interactions.length
          // );
        }
      } catch (error) {
        console.error("❌ AI Inspector: Polling failed:", error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [interactions.length]);


  const refreshInteractions = async () => {
    try {
      const response = await fetch("/api/llm-interactions?limit=100");
      const data = await response.json();
      
      if (data.success) {
        // Clear current interactions and add server interactions
        clearInteractions();
        data.interactions.forEach((interaction: LLMInteraction) => {
          useLLMStore.getState().addInteraction(interaction);
        });
        // console.log("🔄 AI Inspector: Refreshed interactions from server");
      }
    } catch (error) {
      console.error("❌ AI Inspector: Failed to refresh interactions:", error);
    }
  };

  const clearLogs = async () => {
    try {
      // Clear from server
      const response = await fetch("/api/llm-interactions", {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        // Clear from store
        clearInteractions();
        console.log("🧹 AI Inspector: Cleared all interactions");
      }
    } catch (error) {
      console.error("❌ AI Inspector: Failed to clear interactions:", error);
    }
  };

  // No useEffect needed - Zustand store updates automatically

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger className="fixed bottom-2 right-0 bg-stone-800/70 text-white px-3 py-1 text-sm border rounded-lg shadow-lg hover:bg-stone-800 transition-colors z-50">
        AI Inspector
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="end" sideOffset={8}>
          <Popover.Popup className="w-[90vw] max-w-6xl h-[85vh] shadow-lg border border-gray-200 rounded-lg bg-white z-50 flex flex-col text-xs">
            {/* Header */}
            <div className="py-2 px-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-sm">AI Inspector</h3>
              <Popover.Close className="text-gray-400 hover:text-gray-600">
                ✕
              </Popover.Close>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 items-stretch min-h-0">
              {/* Left Sidebar - Interactions List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                {/* Test Section */}
                

                {/* Interactions List */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-medium text-xs">
                      Interactions ({interactions.length})
                    </h4>
                    <div className="flex gap-1">
                      <button
                        onClick={refreshInteractions}
                        className="px-2 py-1 text-blue-600 rounded text-xs hover:bg-blue-50"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={clearLogs}
                        className="px-2 py-1 text-red-600 rounded text-xs hover:bg-red-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {interactions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      No interactions yet. Try running a test.
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {interactions.map((interaction) => (
                        <div
                          key={interaction.id}
                          className={`p-2 border rounded cursor-pointer transition-colors ${
                            selectedInteraction?.id === interaction.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedInteraction(interaction)}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span
                              className={`px-1 py-0.5 text-xs rounded ${
                                interaction.type === "text"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {interaction.type}
                            </span>
                            <span className="text-xs font-medium">
                              {interaction.model}
                            </span>
                            {interaction.source && (
                              <span className="px-1 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                {interaction.source}
                              </span>
                            )}
                            {interaction.status === 'in-progress' && (
                              <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded animate-pulse">
                                In Progress
                              </span>
                            )}
                            {interaction.error && (
                              <span className="px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                                Error
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mb-1 line-clamp-2">
                            {interaction.prompt.substring(0, 60)}
                            {interaction.prompt.length > 60 && "..."}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(interaction.timestamp).toLocaleTimeString()} •
                            {interaction.status === 'in-progress' ? 'In progress...' : `${interaction.duration}ms`} •
                            {interaction.tokens?.total || 0} tokens
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {selectedInteraction ? (
                  <>
                    {/* Content Header */}
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            selectedInteraction.type === "text"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {selectedInteraction.type}
                        </span>
                        <span className="text-xs font-medium">
                          {selectedInteraction.model}
                        </span>
                        {selectedInteraction.source && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {selectedInteraction.source}
                          </span>
                        )}
                        {selectedInteraction.status === 'in-progress' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded animate-pulse">
                            In Progress
                          </span>
                        )}
                        {selectedInteraction.error && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Error
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(selectedInteraction.timestamp).toLocaleString()} •
                        {selectedInteraction.status === 'in-progress' ? 'In progress...' : `${selectedInteraction.duration}ms`} •
                        {selectedInteraction.tokens?.total || 0} tokens
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 p-4 space-y-4">
                      {/* Request */}
                      <div>
                        <h4 className="font-medium mb-2 text-xs">Request</h4>
                        <pre className="bg-gray-100 p-3 rounded text-xs whitespace-pre-wrap overflow-x-auto">
                          {selectedInteraction.prompt}
                        </pre>
                      </div>

                      {/* Response */}
                      <div>
                        <h4 className="font-medium mb-2 text-xs">Response</h4>
                        <pre className="bg-gray-100 p-3 rounded text-xs whitespace-pre-wrap overflow-x-auto">
                          {selectedInteraction.response ||
                            (selectedInteraction.error
                              ? `Error: ${selectedInteraction.error}`
                              : "No response")}
                        </pre>
                      </div>

                      {/* Metadata */}
                      {selectedInteraction.metadata &&
                        Object.keys(selectedInteraction.metadata).length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 text-xs">Metadata</h4>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {JSON.stringify(selectedInteraction.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
                    Select an interaction to view details
                  </div>
                )}
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
