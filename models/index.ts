export * from "./car-document";
export * from "./driver-license";
export * from "./fuel-log";
export * from "./maintenance";
export * from "./ticket";
export * from "./vehicle";
// Enable String.prototype.toProperCase globally
import { addProperCasePrototype } from "../utils/properCase";
addProperCasePrototype();

