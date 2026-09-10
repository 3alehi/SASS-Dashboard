import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver, but several Radix UI primitives
// (Switch, Select, etc.) call it during layout effects. Stub it so any test
// that mounts those components doesn't crash on an unrelated browser API gap.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
