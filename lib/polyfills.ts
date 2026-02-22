/**
 * Polyfills for React Native. Must be imported before any code that needs Buffer (e.g. react-native-svg).
 */
import { Buffer } from "buffer";

if (typeof global.Buffer === "undefined") {
  (global as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}
