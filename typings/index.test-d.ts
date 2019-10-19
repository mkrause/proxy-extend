///<reference lib="es2019"/>

// Test module to test TypeScript declaration.
// Usage: `tsd`.

import { expectType, expectError } from 'tsd';
import { Object as ObjectTB } from 'ts-toolbelt';

import ProxyExtend, { proxyKey } from '.';
import { Value, Extension, Proxied } from '.'; // Types


// Check proxying of different value types (no extension)
expectType<Proxied<null>>(ProxyExtend(null));
expectType<Proxied<'hello'>>(ProxyExtend('hello'));
expectType<Proxied<42>>(ProxyExtend(42));
expectType<Proxied<{ x : 42 }>>(ProxyExtend({ x: 42 }));
expectType<Proxied<[1, 2, 3]>>(ProxyExtend([1, 2, 3]));
expectType<Proxied<(x : number) => number>>(ProxyExtend((x : number) => x + 1));

// Check that extension works
expectType<Proxied<null, { ext : true }>>(ProxyExtend(null, { ext: true }));
expectType<Proxied<{ x : 42 }, { ext : true }>>(ProxyExtend({ x: 42 }, { ext: true }));

// Extension should override properties in the value in case of a key clash
expectType<43>(ProxyExtend({ x: 42 } as const, { x: 43 } as const).x);

// Should be able to access `proxyKey`
expectType<{ value : 'value', extension : { ext : true } }>(
    ProxyExtend('value' as const, { ext: true } as const)[proxyKey]
);

// `proxyKey` should not be overridable
expectType<{ value : { [proxyKey] : 42 }, extension : { [proxyKey] : 43 } }>(
    ProxyExtend({ [proxyKey] : 42 } as const, { [proxyKey] : 43 } as const)[proxyKey]
);


// Interface: `null`
const proxyNull = ProxyExtend(null, { ext: true } as const);
// expectType<{}>(proxyNull); // FIXME

// Interface: `string`
const proxyString = ProxyExtend('foo', { ext: true } as const);
expectType<string>(proxyString.toString());
expectType<string>(String(proxyString));
expectType<string>(proxyString.substring(0, 2));

// Interface: `number`
const proxyNumber = ProxyExtend(42, { ext: true } as const);
//expectType<number>(proxyNumber.valueOf()); // FIXME
expectType<number>(Number(proxyNumber));
//expectType<string>(proxyNumber + 1); // Allowed in JS, but TypeScript doesn't like the implicit conversion
