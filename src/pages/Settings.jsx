import {
  AdjustmentsHorizontalIcon,
  EyeDropperIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import "./Settings.css";
import { useAccessibility } from "../context/AccessibilityContext";

function describeScale(scale) {
  if (scale <= 0.95) return "Compact";
  if (scale < 1.1) return "Comfort";
  if (scale < 1.25) return "Large";
  return "Extra Large";
}

export default function Settings() {
  const {
    preferences,
    setTextScale,
    toggleHighContrast,
    toggleNarration,
    narrationSupported,
  } = useAccessibility();

  const textScaleLabel = describeScale(preferences.textScale);

  function handleNarrationToggle() {
    const willEnable = !preferences.narrationEnabled;
    toggleNarration();

    if (willEnable && narrationSupported && typeof window !== "undefined") {
      const announcement =
        "Narration is now on. Use the speaker icons beside important content to hear it aloud.";
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(announcement));
    }
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <p className="eyebrow">Personalize</p>
          <h1>Accessibility settings</h1>
          <p className="lede">
            Tune the interface for clarity and comfort.
          </p>
        </div>
        <div className="settings-badge">
          <SpeakerWaveIcon className="settings-badge__icon" />
          <span>Assistive tools ready</span>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-title">
              <SpeakerWaveIcon className="settings-icon" />
              <div>
                <h3>Hearing accessibility</h3>
                <p>Tap a speaker icon to hear key content narrated aloud.</p>
              </div>
            </div>
            <span
              className={`settings-pill ${
                preferences.narrationEnabled ? "success" : ""
              }`}
            >
              {preferences.narrationEnabled ? "On" : "Off"}
            </span>
          </div>
          {!narrationSupported && (
            <p className="settings-inline-warning">
              Narration is unavailable in this browser.
            </p>
          )}
          <button
            type="button"
            className="settings-toggle"
            onClick={handleNarrationToggle}
            disabled={!narrationSupported}
          >
            {preferences.narrationEnabled ? "Disable narration" : "Enable narration"}
          </button>
          <div className="settings-preview">
            <p className="settings-preview__label">Preview</p>
            <p className="settings-preview__text">
              Look for the small speaker to hear flight summaries, booking steps, and
              section headers.
            </p>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-title">
              <AdjustmentsHorizontalIcon className="settings-icon" />
              <div>
                <h3>Scalable text</h3>
                <p>Choose a comfortable reading size across the site.</p>
              </div>
            </div>
            <span className="settings-pill">{textScaleLabel}</span>
          </div>
          <div className="settings-slider">
            <label htmlFor="text-scale" className="settings-slider__label">
              Text scale
            </label>
            <input
              id="text-scale"
              type="range"
              min="0.9"
              max="1.4"
              step="0.05"
              value={preferences.textScale}
              onChange={(event) => setTextScale(Number(event.target.value))}
            />
            <div className="settings-scale-buttons">
              {[0.95, 1, 1.15, 1.3].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  className={`settings-chip ${
                    Math.abs(preferences.textScale - scale) < 0.01
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setTextScale(scale)}
                >
                  {scale === 1
                    ? "Default"
                    : scale === 1.3
                    ? "XL"
                    : `${Math.round(scale * 100)}%`}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-preview">
            <p className="settings-preview__label">Preview</p>
            <p className="settings-preview__text">
              Flight cards, forms, and navigation will respect this scale so you
              can read comfortably.
            </p>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-title">
              <EyeDropperIcon className="settings-icon" />
              <div>
                <h3>High contrast mode</h3>
                <p>Amplify contrast for sharper separation and focus.</p>
              </div>
            </div>
            <span
              className={`settings-pill ${
                preferences.highContrast ? "success" : ""
              }`}
            >
              {preferences.highContrast ? "Enabled" : "Off"}
            </span>
          </div>
          <button
            type="button"
            className="settings-toggle"
            onClick={toggleHighContrast}
          >
            {preferences.highContrast ? "Disable high contrast" : "Enable high contrast"}
          </button>
          <div className="settings-preview high-contrast">
            <p className="settings-preview__label">Preview</p>
            <div className="settings-preview__card">
              <span className="preview-pill">Badge</span>
              <p className="settings-preview__text">
                Buttons, cards, and overlays switch to a bolder palette for clearer
                separation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
