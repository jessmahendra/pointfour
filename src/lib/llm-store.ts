import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface LLMInteraction {
  id: string;
  timestamp: Date;
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
  source?: string; // Track which component/API made the call
  status?: 'in-progress' | 'completed' | 'error'; // Track interaction status
}

export interface LLMStats {
  totalInteractions: number;
  totalTokens: number;
  averageDuration: number;
  modelBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  errorRate: number;
}

interface LLMStore {
  interactions: LLMInteraction[];
  addInteraction: (interaction: LLMInteraction) => void;
  updateInteraction: (id: string, updates: Partial<LLMInteraction>) => void;
  clearInteractions: () => void;
  getInteractionsBySource: (source: string) => LLMInteraction[];
  getInteractionsByModel: (model: string) => LLMInteraction[];
  getInteractionsByType: (type: 'text' | 'object') => LLMInteraction[];
  getStats: () => LLMStats;
  getRecentInteractions: (limit?: number) => LLMInteraction[];
}

export const useLLMStore = create<LLMStore>()(
  devtools(
    persist(
      (set, get) => ({
        interactions: [],

        addInteraction: (interaction: LLMInteraction) => {
          set((state) => {
            const newInteractions = [...state.interactions, interaction];
            
            // Keep only last 1000 interactions to prevent memory issues
            if (newInteractions.length > 1000) {
              newInteractions.shift();
            }
            
            return { interactions: newInteractions };
          });
        },

        updateInteraction: (id: string, updates: Partial<LLMInteraction>) => {
          set((state) => {
            const newInteractions = state.interactions.map(interaction =>
              interaction.id === id 
                ? { ...interaction, ...updates }
                : interaction
            );
            
            return { interactions: newInteractions };
          });
        },

        clearInteractions: () => {
          set({ interactions: [] });
        },

        getInteractionsBySource: (source: string) => {
          return get().interactions
            .filter(interaction => interaction.source === source)
            .reverse(); // Most recent first
        },

        getInteractionsByModel: (model: string) => {
          return get().interactions
            .filter(interaction => interaction.model === model)
            .reverse(); // Most recent first
        },

        getInteractionsByType: (type: 'text' | 'object') => {
          return get().interactions
            .filter(interaction => interaction.type === type)
            .reverse(); // Most recent first
        },

        getRecentInteractions: (limit = 50) => {
          return get().interactions
            .slice(-limit)
            .reverse(); // Most recent first
        },

        getStats: (): LLMStats => {
          const interactions = get().interactions;
          const totalInteractions = interactions.length;
          
          if (totalInteractions === 0) {
            return {
              totalInteractions: 0,
              totalTokens: 0,
              averageDuration: 0,
              modelBreakdown: {},
              typeBreakdown: {},
              sourceBreakdown: {},
              errorRate: 0
            };
          }

          const totalTokens = interactions.reduce((sum, interaction) => 
            sum + (interaction.tokens?.total || 0), 0
          );
          
          const totalDuration = interactions.reduce((sum, interaction) => 
            sum + interaction.duration, 0
          );
          
          const averageDuration = totalDuration / totalInteractions;
          
          const errorCount = interactions.filter(interaction => interaction.error).length;
          const errorRate = (errorCount / totalInteractions) * 100;

          const modelBreakdown = interactions.reduce((acc, interaction) => {
            acc[interaction.model] = (acc[interaction.model] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const typeBreakdown = interactions.reduce((acc, interaction) => {
            acc[interaction.type] = (acc[interaction.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const sourceBreakdown = interactions.reduce((acc, interaction) => {
            const source = interaction.source || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            totalInteractions,
            totalTokens,
            averageDuration,
            modelBreakdown,
            typeBreakdown,
            sourceBreakdown,
            errorRate
          };
        }
      }),
      {
        name: 'llm-store-persist', // Unique name for localStorage
        // Only persist interactions, not the methods
        partialize: (state) => ({ interactions: state.interactions }),
      }
    ),
    {
      name: 'llm-store', // Unique name for devtools
    }
  )
);
