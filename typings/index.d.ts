
import { Object as ObjectTB } from 'ts-toolbelt';


export type Value = null | string | number | object;
export type Extension = { [key in PropertyKey] : unknown };

export type Proxied<V extends Value, E extends Extension = {}> =
    ObjectTB.Merge<
        Readonly<ObjectTB.Merge<
            {
                [proxyKey] : Readonly<{ value : V, extension : Readonly<E> }>,
                // [Symbol.iterator] : ...,
            },
            E
        >>,
        V extends null ? {}
            : V extends string ? String & { toJSON : () => string }
            : V extends number ? Number & { toJSON : () => number }
            : V
    >;

export declare const proxyKey : unique symbol;

export declare const extend : <V extends Value, E extends Extension = {}>(value : V, extension ?: E)
    => Proxied<V, E>;

export declare const registerProxyFormatter : () => void;

export default extend;
