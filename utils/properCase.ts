// utils/properCase.ts
// Adds a prototype method to String to convert to proper case (e.g., MAKE -> Make)

export function addProperCasePrototype() {
  if (!String.prototype.hasOwnProperty("toProperCase")) {
    Object.defineProperty(String.prototype, "toProperCase", {
      value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
      },
      writable: true,
      configurable: true,
    });
  }
}

// Usage:
// import { addProperCasePrototype } from './properCase';
// addProperCasePrototype();
// console.log('MAKE'.toProperCase()); // Output: Make
