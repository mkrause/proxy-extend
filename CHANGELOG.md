
# Changelog

- v1.3.x
  - Drop support for Node v10, and IE 11.

- v1.2.x
  - Add type guard: `isProxyable`.

- v1.1.x
  - Improve type definitions.

- v1.0.x
  - First stable release.

- v0.7.x
  - Introduce `extend.is` and `extend.unwrap`.

- v0.6.x
  - Implement `unwrap`.
  - Add `unwrap` and `proxyKey` to the main export `extend`.

- v0.5.x
  - Flatten nested proxies (prevent proxying something which is already a proxy).

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
