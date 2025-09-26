import { useState, useEffect } from 'react';

type ColorScheme = 'light' | 'dark' | 'system';

interface UseColorSchemeReturn {
  colorScheme: ColorScheme;
  resolvedScheme: 'light' | 'dark';
  setColorScheme: (scheme: ColorScheme) => void;
  isSystemDark: boolean;
}

export function useColorScheme(): UseColorSchemeReturn {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    // Check localStorage first, fallback to 'system'
    const stored = localStorage.getItem('color-scheme');
    return (stored as ColorScheme) || 'system';
  });

  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Calculate resolved scheme based on current preference
  const resolvedScheme: 'light' | 'dark' = colorScheme === 'system' ? (isSystemDark ? 'dark' : 'light') : colorScheme;

  useEffect(() => {
    // Listen for system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    // Apply the resolved scheme to the document
    const root = document.documentElement;
    
    if (resolvedScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('color-scheme', scheme);
  };

  return {
    colorScheme,
    resolvedScheme,
    setColorScheme,
    isSystemDark,
  };
}
