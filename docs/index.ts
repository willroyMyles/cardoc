/**
 * Country document registry — fully document-driven.
 *
 * To add a new country:
 *   1. Create  docs/<country>/  with the relevant JSON spec files.
 *   2. Create  docs/<country>/index.ts  that re-exports them by name.
 *   No code changes are required here.
 *
 * Requires Metro's `unstable_allowRequireContext` (enabled in metro.config.js).
 */

const ctx = require.context("./", true, /^\.\/[^/]+\/index\.ts$/, "sync");

export const countries: Record<
  string,
  Record<string, unknown>
> = Object.fromEntries(
  ctx.keys().map((key) => {
    const countryCode = key.replace(/^\.\//, "").replace(/\/index\.ts$/, "");
    return [countryCode, ctx(key)];
  }),
);

console.log(countries);

export type CountryCode = string;
