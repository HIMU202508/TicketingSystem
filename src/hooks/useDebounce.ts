import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing values
 * Useful for search inputs to avoid excessive API calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debounced search with loading state
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 300
): {
  debouncedSearchTerm: string
  isSearching: boolean
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setIsSearching(true)
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  return { debouncedSearchTerm, isSearching }
}
