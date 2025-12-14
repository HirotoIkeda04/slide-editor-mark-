import { useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '../constants/colorTokens'

const THEME_STORAGE_KEY = 'slide-editor-theme'

/**
 * Get the initial theme from localStorage or system preference
 */
function getInitialTheme(): ThemeMode {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    
    // Fall back to system preference
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  }
  
  // Default to dark
  return 'dark'
}

/**
 * Apply theme to document
 */
function applyTheme(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

/**
 * useTheme hook - manages application theme (light/dark)
 * 
 * Features:
 * - Persists theme preference to localStorage
 * - Syncs with system preference changes
 * - Applies theme via data-theme attribute on <html>
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)
  
  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (!stored) {
        const newTheme = e.matches ? 'light' : 'dark'
        setThemeState(newTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }, [])
  
  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])
  
  // Check if current theme matches a specific mode
  const isDark = theme === 'dark'
  const isLight = theme === 'light'
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  }
}

export type UseThemeReturn = ReturnType<typeof useTheme>
