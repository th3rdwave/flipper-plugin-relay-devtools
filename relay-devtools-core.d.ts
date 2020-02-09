declare module 'relay-devtools-core/standalone' {
  interface DevTools {
    setContentDOMNode(node: HTMLElement): DevTools;
    startServer(port: number): DevTools;
  }
  const DevTools: DevTools;
  export default DevTools;
}

declare module 'relay-devtools-core/backend' {
  export function connectToDevTools(options?: { port?: number });
}
