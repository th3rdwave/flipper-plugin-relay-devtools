declare module 'relay-devtools-core/standalone' {
  interface DevTools {
    setContentDOMNode(node: HTMLElement): DevTools;
    setStatusListener(listener: (message: string) => void): this;
    startServer(port: number): DevTools;
  }
  const DevTools: DevTools;
  export default DevTools;
}

declare module 'relay-devtools-core/backend' {
  interface ConnectOptions {
    host?: string;
    port?: number;
    isAppActive?: () => boolean;
    websocket?: typeof WebSocket;
  }

  export function connectToDevTools(options?: ConnectOptions);
}
