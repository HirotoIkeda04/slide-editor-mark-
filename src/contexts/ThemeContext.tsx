import React, { createContext, useContext, type ReactNode } from 'react'
import { useTheme, type UseThemeReturn } from '../hooks/useTheme'

const ThemeContext = createContext<UseThemeReturn | null>(null)

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider - Provides theme state to the entire application
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeState = useTheme()
  
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useThemeContext - Access theme state from any component
 */
export function useThemeContext(): UseThemeReturn {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
