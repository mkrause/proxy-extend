
import { Object as ObjectTB } from 'ts-toolbelt';


// The type of values that can be proxied
export type Proxyable = null | string | number | object;

// The external interface for a given proxyable value
export type ProxyableExternal<T extends Proxyable> =
    T extends null ? {}
        : T extends string ? String & { toJSON : () => string }
        : T extends number ? Number & { toJSON : () => number }
        : T;

export type Extension = object;


export declare const proxyKey : unique symbol;

export type Proxied<V extends Proxyable, E extends Extension = {}> =
    ObjectTB.Merge<
        Readonly<ObjectTB.Merge<
            {
                [proxyKey] : Readonly<{ value : V, extension : Readonly<E> }>,
                // [Symbol.iterator] : ...,
            },
            E
        >>,
        ProxyableExternal<V>
    >;

export declare const isProxy : (value : unknown) => boolean;

export declare const unwrapProxy : <V extends Proxyable, E extends Extension>(proxy : Proxied<V, E>) => {
    value : V,
    extension : E,
};

export declare const extend :
    (<V extends Proxyable, E extends Extension = {}>(value : V, extension ?: E) => Proxied<V, E>) & {
        is : typeof isProxy,
        unwrap : typeof unwrapProxy,
    };

export declare const registerProxyFormatter : () => void;

export default extend;
