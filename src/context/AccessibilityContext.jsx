import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "fms-accessibility-preferences";
const defaultPreferences = {
  narrationEnabled: true,
  textScale: 1,
  highContrast: false,
};

const AccessibilityContext = createContext(null);

function readStoredPreferences() {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPreferences;
    const parsed = JSON.parse(stored);
    return {
      ...defaultPreferences,
      ...parsed,
    };
  } catch (error) {
    console.error("Failed to read accessibility preferences", error);
    return defaultPreferences;
  }
}

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const scale = Number(preferences.textScale) || 1;
    document.documentElement.style.setProperty("--text-scale", scale);
    document.documentElement.style.fontSize = `${100 * scale}%`;

    document.documentElement.dataset.highContrast = preferences.highContrast
      ? "true"
      : "false";
    document.body?.classList.toggle("high-contrast", preferences.highContrast);
  }, [preferences.highContrast, preferences.textScale]);

  const setTextScale = useCallback((scale) => {
    const clamped = Math.min(1.4, Math.max(0.9, Number(scale) || 1));
    setPreferences((prev) => ({ ...prev, textScale: Number(clamped.toFixed(2)) }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleNarration = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      narrationEnabled: !prev.narrationEnabled,
    }));
  }, []);

  const narrationSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text) => {
      if (!narrationSupported || !preferences.narrationEnabled || !text) {
        return false;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (error) {
        console.error("Narration failed", error);
        return false;
      }
    },
    [narrationSupported, preferences.narrationEnabled],
  );

  const value = useMemo(
    () => ({
      preferences,
      setTextScale,
      toggleHighContrast,
      toggleNarration,
      narrationSupported,
      speak,
    }),
    [
      preferences,
      setTextScale,
      toggleHighContrast,
      toggleNarration,
      narrationSupported,
      speak,
    ],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}
