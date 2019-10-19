
type Extension = { [key in PropertyKey] : unknown };

type Proxied<V, E> = E & (
    V extends undefined ? never
        : V extends null ? {}
        : V extends string ? String
        : V extends number ? Number
        : V extends bigint ? never
        : V extends boolean ? never
        : V extends symbol ? never
        : V
);

export declare const proxyKey : unique symbol;

export declare const ProxyWrapper : never; // TODO

export default ProxyWrapper;
