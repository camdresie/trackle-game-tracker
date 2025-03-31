import * as React from "react"
import { useState, useEffect, useCallback } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  // Memoize the onChange callback to prevent recreation on every render
  const onChange = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }, [])

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Add the memoized onChange handler
    mql.addEventListener("change", onChange)
    
    // Set initial value
    onChange()
    
    // Clean up
    return () => mql.removeEventListener("change", onChange)
  }, [onChange])

  return !!isMobile
}
