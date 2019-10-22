
# Changelog

- v0.4.x
  - Make handler a plain object (rather than using `Object.create()`) for a \~10x boost in perf.

- v0.3.x
  - Rename the default export: `ProxyExtend` -> `extend`.

- v0.2.x
  - Add TypeScript support.

- v0.1.x
  - Simplify the proxy handler logic, by using a closure to store the extension state.

- v0.0.x
  - Initial version.
