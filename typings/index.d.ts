
import { Object as ObjectTB } from 'ts-toolbelt';


export type Value = null | string | number | object;
export type Extension = { [key in PropertyKey] : unknown };

export declare const proxyKey : unique symbol;

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

export declare const unwrap : <V extends Value, E extends Extension>(proxy : Proxied<V, E>) => {
    value : V,
    extension : E,
};

export declare const extend :
    (<V extends Value, E extends Extension = {}>(value : V, extension ?: E) => Proxied<V, E>) & {
        proxyKey : typeof proxyKey,
        unwrap : typeof unwrap,
    };

export declare const registerProxyFormatter : () => void;

export default extend;
