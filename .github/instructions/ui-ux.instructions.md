---
applyTo: "packages/**/*.tsx,packages/**/*.jsx,packages/**/*.scss,packages/**/*.css"
---

# UI/UX review

- Prefer existing components from `@deephaven/components` and existing app patterns over one-off UI; flag reinvented buttons, dialogs, menus, or form controls.
- Spectrum components must be imported through `@deephaven/components`; flag direct `@adobe/react-spectrum` imports outside `packages/components/src/spectrum/` and `packages/components/src/theme/`.
- Interactive elements must be keyboard reachable, have accessible names (visible label or `aria-label`), and must not convey state through color alone.
- Check that button labels, menu items, empty states, and dialog copy are clear and specific — flag generic text like "OK"/"Error" where a specific action or message fits.
- In SCSS, flag hard-coded colors, spacing, or typography where an existing variable or design token exists; theme support requires the token layer.
- Flag visual or interaction changes inconsistent with nearby screens, especially in `code-studio`, `embed-widget`, `embed-chart`, and `embed-grid`.
- Focus on usability, accessibility, and design-system consistency — not subjective style preferences.
