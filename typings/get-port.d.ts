declare module 'get-port' {
  const getPort: (options?: {
    readonly port?: number;
    readonly host?: string;
  }) => Promise<number>;
  export default getPort;
}
