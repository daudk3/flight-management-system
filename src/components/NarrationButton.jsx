import { useEffect, useRef, useState } from "react";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import "./NarrationButton.css";
import { useAccessibility } from "../context/AccessibilityContext";

export default function NarrationButton({
  text,
  label = "Hear this content",
  className = "",
  small = false,
}) {
  const { speak, preferences, narrationSupported } = useAccessibility();
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  if (!narrationSupported || !preferences.narrationEnabled || !text) {
    return null;
  }

  function handleClick(event) {
    event?.stopPropagation?.();
    const success = speak(text);
    if (!success) {
      return;
    }

    setActive(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(false), 1400);
  }

  return (
    <button
      type="button"
      className={`narration-button ${small ? "narration-button--small" : ""} ${
        active ? "is-speaking" : ""
      } ${className}`}
      onClick={handleClick}
      aria-label={label}
    >
      <SpeakerWaveIcon />
    </button>
  );
}
