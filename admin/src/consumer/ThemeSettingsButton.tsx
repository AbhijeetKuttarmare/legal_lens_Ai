import { useState } from 'react';
import { GearIcon, MoonIcon, SunIcon } from '../icons';
import { ACCENT_SWATCHES, DEFAULT_THEME, applyThemePrefs, loadThemePrefs, saveThemePrefs, type ThemePrefs } from './theme';

export default function ThemeSettingsButton() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ThemePrefs>(loadThemePrefs);

  function update(next: ThemePrefs) {
    setPrefs(next);
    applyThemePrefs(next);
    saveThemePrefs(next);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="cw-bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Theme settings">
        <GearIcon style={{ width: 18, height: 18 }} />
      </button>
      {open && (
        <div className="cw-settings-dropdown" onMouseLeave={() => setOpen(false)}>
          <div className="cw-settings-section">
            <div className="cw-settings-section-title">Appearance</div>
            <div className="cw-settings-toggle-row">
              <button
                className={`cw-settings-toggle-btn${prefs.mode === 'dark' ? ' active' : ''}`}
                onClick={() => update({ ...prefs, mode: 'dark' })}
              >
                <MoonIcon style={{ width: 14, height: 14 }} /> Dark
              </button>
              <button
                className={`cw-settings-toggle-btn${prefs.mode === 'light' ? ' active' : ''}`}
                onClick={() => update({ ...prefs, mode: 'light' })}
              >
                <SunIcon style={{ width: 14, height: 14 }} /> Light
              </button>
            </div>
          </div>

          <div className="cw-settings-section">
            <div className="cw-settings-section-title">Theme Color</div>
            <div className="cw-settings-swatch-row">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  className={`cw-settings-swatch${prefs.accent === color ? ' active' : ''}`}
                  style={{ background: color }}
                  onClick={() => update({ ...prefs, accent: color })}
                  aria-label={`Use ${color} as theme color`}
                />
              ))}
              <label className="cw-settings-swatch cw-settings-swatch-custom" title="Custom color">
                <input
                  type="color"
                  value={prefs.accent}
                  onChange={(e) => update({ ...prefs, accent: e.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="cw-settings-section">
            <div className="cw-settings-section-title">Button Color</div>
            <div className="cw-settings-swatch-row">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  className={`cw-settings-swatch${prefs.buttonColor === color ? ' active' : ''}`}
                  style={{ background: color }}
                  onClick={() => update({ ...prefs, buttonColor: color })}
                  aria-label={`Use ${color} as button color`}
                />
              ))}
              <label className="cw-settings-swatch cw-settings-swatch-custom" title="Custom color">
                <input
                  type="color"
                  value={prefs.buttonColor}
                  onChange={(e) => update({ ...prefs, buttonColor: e.target.value })}
                />
              </label>
            </div>
          </div>

          <button className="cw-settings-reset-btn" onClick={() => update(DEFAULT_THEME)}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
