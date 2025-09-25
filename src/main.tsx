import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App.tsx'
import './index.css'

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      }
    }
  }
})

// Initialize telemetry and other services
async function initializeServices() {
  // This would initialize telemetry, AI engine, etc.
  // For now, just log that services are starting
  console.log('🚀 Initializing AI Pair Programmer services...')
  
  // Validate environment configuration
  try {
    const { validateRequiredConfig } = await import('@/config/environment')
    validateRequiredConfig()
    console.log('✅ Configuration validated')
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
  }
}

// Initialize services
initializeServices()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ai-pair-programmer-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
