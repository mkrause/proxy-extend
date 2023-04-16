
// See:
// https://arethetypeswrong.github.io/?p=case-match

// Note: this test requires build files to be present in `dist`.
// The following should not give any TypeScript errors:
import extend, { proxyKey, isProxyable, isProxy, unwrapProxy, registerProxyFormatter } from 'proxy-extend';
