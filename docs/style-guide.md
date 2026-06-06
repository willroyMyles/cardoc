# Cardoc Style Guide

Use the dashboard as the visual source of truth. The app should feel compact, calm, and operational: light gray canvas, white bordered cards, black primary actions, amber icon accents, and restrained typography.

## Foundations

- Font: use `Fonts.sans` from `constants/theme.ts`. The app applies it globally in `app/_layout.tsx`; custom text components should keep using the same token.
- Page canvas: `Colors[scheme].background`.
- Surfaces: `Colors[scheme].card` with `Colors[scheme].border`.
- Primary action: `Colors[scheme].tint` with white text/icons.
- Icon tiles: usually `#1A1A1A` with `AccentColor` or semantic accent icons.
- Status colors: use `StatusColors`; document accents use `DocTypeColors`.

## Shape And Spacing

- Page horizontal padding: `Spacing.page` (`16`).
- Section/header horizontal padding: `Spacing.section` (`20`).
- Main cards and dashboard panels: `Radius.card` (`28`), `borderWidth: 1`, `padding: Spacing.cardPadding`.
- Nested cards, rows, account/menu surfaces: `Radius.surface` (`24`).
- Icon tiles: `Radius.tile` (`14`) or `Radius.tileLg` (`16`) for larger prompt tiles.
- Chips, badges, and pill buttons: `Radius.pill`.
- Standard row gap: `Spacing.rowGap` (`14`); vertical stack gap: `Spacing.stackGap` (`16`).

## Type

- Labels: `Type.label` for dashboard/card eyebrow text: uppercase, `9px`, `700`, `letterSpacing: 2`.
- Section labels: `Type.sectionLabel` for page sections and metadata: uppercase, `11px`, `700`, `letterSpacing: 1.2`.
- Titles: `Type.title` for compact card headings: `16px`, `700`.
- Body: `Type.body` for helper copy: `13px`, `lineHeight: 20`.
- Captions: `Type.caption` for secondary metadata: `11px`, `lineHeight: 16`.
- Avoid large display type except on dashboard metrics or true hero-style panels.

## Component Patterns

- Prefer shared `Card`, `Header`, `EmptyState`, `ScanPromptCard`, `StatusBadge`, and `ExpiryIndicator` before creating new local styles.
- Lists should use the shared card pattern with `marginHorizontal: Spacing.page` and `marginVertical: 6`.
- Filter chips use a filled black selected state and white text; unselected chips use the card background, border, and muted text.
- Summary strips should still read as cards: white/card background, 1px border, `Radius.surface`, and compact icon+label+value groups.
- Keep page-level backgrounds on `SafeAreaView`/root containers so every screen matches the dashboard canvas.

## Checks Before Shipping

- Scan new styles for one-off font families, random blues/purples, or card radii below `24` unless the element is an input or icon tile.
- Confirm text is not oversized inside cards; most card text should sit between `11` and `16`.
- Confirm empty states and prompts use the same black icon tile plus amber/accent icon language.
