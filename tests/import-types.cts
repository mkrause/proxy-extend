
// See:
// https://arethetypeswrong.github.io/?p=case-match

// Note: this test requires build files to be present in `dist`.
// If we configured our project wrong the following will give a TypeScript error:
// "The current file is a CommonJS module whose imports will produce 'require' calls [...]"
import extend, { proxyKey, isProxyable, isProxy, unwrapProxy, registerProxyFormatter } from 'proxy-extend';
