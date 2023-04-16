
// Test module to test TypeScript declaration.
// Usage: `tsd`.

import { expectType, expectError } from 'tsd';

import extend, { proxyKey } from '../src/proxyExtend';
import type { Proxyable, ProxyableExternal, Extension, Proxied } from '../src/proxyExtend';


// Check proxying of different value types (no extension)
expectType<Proxied<null>>(extend(null));
expectType<Proxied<'hello'>>(extend('hello'));
expectType<Proxied<42>>(extend(42));
expectType<Proxied<{ x : 42 }>>(extend({ x: 42 as const }));
expectType<Proxied<[1, 2, 3]>>(extend([1, 2, 3] as [1, 2, 3]));
expectType<Proxied<(x : number) => number>>(extend((x : number) => x + 1));

// Check that extension works
expectType<Proxied<null, { ext : true }>>(extend(null, { ext: true as const }));
expectType<Proxied<{ x : 42 }, { ext : true }>>(extend({ x: 42 as const }, { ext: true as const }));

// Extension should override properties in the value in case of a key clash
expectType<43>(extend({ x: 42 as const }, { x: 43 as const }).x);

// Should be able to access `proxyKey`
expectType<Readonly<{ value : 'value', extension : Readonly<{ ext : true }> }>>(
    extend('value' as const, { ext: true as const })[proxyKey]
);

// `proxyKey` should not be overridable
expectType<Readonly<{ value : { [proxyKey] : 42 }, extension : Readonly<{ [proxyKey] : 43 }> }>>(
    extend({ [proxyKey] : 42 as const }, { [proxyKey] : 43 as const })[proxyKey]
);


// Interface: `null`
const proxyNull = extend(null, { ext: true as const });
// expectType<{}>(proxyNull); // FIXME

// Interface: `string`
const proxyString = extend('foo', { ext: true as const });
expectType<string>(proxyString.toString());
expectType<string>(String(proxyString));
expectType<string>(proxyString.substring(0, 2));

// Interface: `number`
const proxyNumber = extend(42, { ext: true as const });
//expectType<number>(proxyNumber.valueOf()); // FIXME
expectType<number>(Number(proxyNumber));
//expectType<string>(proxyNumber + 1); // Allowed in JS, but TypeScript doesn't like the implicit conversion
