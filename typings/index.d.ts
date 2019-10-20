
// Note: `ts-toolbelt` needs to be a normal dependency (not devdependency)
import { Object as ObjectTB } from 'ts-toolbelt';


export type Value = null | string | number | object;
export type Extension = { [key in PropertyKey] : unknown };

export type Proxied<V extends Value, E extends Extension = {}> =
    ObjectTB.Merge<
        ObjectTB.Merge<
            {
                [proxyKey] : { value : V, extension : E },
                // [Symbol.iterator] : ...,
            },
            E
        >,
        V extends null ? {}
            : V extends string ? String & { toJSON : () => string }
            : V extends number ? Number & { toJSON : () => number }
            : V
    >;

export declare const proxyKey : unique symbol;

export declare const ProxyExtend : <V extends Value, E extends Extension = {}>(value : V, extension ?: E)
    => Proxied<V, E>;

export declare const registerProxyFormatter : () => void;

export default ProxyExtend;
