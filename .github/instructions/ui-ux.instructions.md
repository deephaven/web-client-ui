---
applyTo: "packages/**/*.{tsx,jsx,scss,css}"
---

# UI/UX review

- Review UI-facing changes as a UI/UX specialist.
- Check that button labels, menu items, empty states, and dialogs are clear and specific.
- Prefer existing components from `packages/components` and existing app patterns over introducing one-off UI.
- Ensure interactive elements are accessible: keyboard reachable, properly labeled, and not dependent on color alone.
- In SCSS, prefer existing variables/tokens and shared patterns over hard-coded colors, spacing, or typography.
- For Spectrum usage, ensure imports go through the repository's `components` package conventions instead of direct `@adobe/react-spectrum` imports outside the allowed directories.
- Flag visual or interaction changes that feel inconsistent with nearby screens, especially in `code-studio`, `embed-widget`, `embed-chart`, and `embed-grid`.
- Do not leave generic style feedback; focus on usability, accessibility, design-system consistency, and maintainable styling.
