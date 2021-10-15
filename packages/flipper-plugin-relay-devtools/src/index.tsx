// Based on https://github.com/facebook/flipper/blob/master/desktop/plugins/public/relaydevtools/index.tsx

import RelayDevToolsStandaloneEmbedded from 'relay-devtools-core/standalone';
import {
  Layout,
  usePlugin,
  DevicePluginClient,
  createState,
  useValue,
  Toolbar,
} from 'flipper-plugin';
import React from 'react';
import getPort from 'get-port';
import { Button, Typography } from 'antd';
import { DevToolsEmbedder } from './DevToolsEmbedder';

const DEV_TOOLS_NODE_ID = 'relaydevtools-out-of-relay-node';
const CONNECTED = 'DevTools connected';
const DEV_TOOLS_PORT = 8098; // hardcoded in RN

enum ConnectionStatus {
  Initializing = 'Initializing...',
  WaitingForReload = 'Waiting for connection from device...',
  Connected = 'Connected',
  Error = 'Error',
}

export function devicePlugin(client: DevicePluginClient) {
  const metroDevice = client.device;

  const statusMessage = createState('initializing');
  const connectionStatus = createState<ConnectionStatus>(
    ConnectionStatus.Initializing,
  );
  let devToolsInstance: typeof RelayDevToolsStandaloneEmbedded = RelayDevToolsStandaloneEmbedded;

  let startResult: { close(): void } | undefined = undefined;

  let pollHandle: any | undefined = undefined;

  async function bootDevTools() {
    const devToolsNode = document.getElementById(DEV_TOOLS_NODE_ID);
    if (!devToolsNode) {
      setStatus(ConnectionStatus.Error, 'Failed to find target DOM Node');
      return;
    }

    // Relay DevTools were initilized before
    if (startResult) {
      if (devtoolsHaveStarted()) {
        setStatus(ConnectionStatus.Connected, CONNECTED);
      } else {
        startPollForConnection();
      }
      return;
    }

    // They're new!
    try {
      setStatus(
        ConnectionStatus.Initializing,
        'Waiting for port ' + DEV_TOOLS_PORT,
      );
      const port = await getPort({ port: DEV_TOOLS_PORT }); // default port for dev tools
      if (port !== DEV_TOOLS_PORT) {
        setStatus(
          ConnectionStatus.Error,
          `Port ${DEV_TOOLS_PORT} is already taken`,
        );
        return;
      }
      setStatus(
        ConnectionStatus.Initializing,
        'Starting DevTools server on ' + port,
      );
      startResult = devToolsInstance
        .setContentDOMNode(devToolsNode)
        .setStatusListener((status) => {
          // TODO: since devToolsInstance is an instance, we are probably leaking memory here
          setStatus(ConnectionStatus.Initializing, status);
        })
        .startServer(port) as any;
      setStatus(ConnectionStatus.Initializing, 'Waiting for device');
    } catch (e) {
      console.error('Failed to initalize Relay DevTools' + e);
      setStatus(ConnectionStatus.Error, 'Failed to initialize DevTools: ' + e);
    }

    setStatus(
      ConnectionStatus.Initializing,
      'DevTools have been initialized, waiting for connection...',
    );
    if (devtoolsHaveStarted()) {
      setStatus(ConnectionStatus.Connected, CONNECTED);
    } else {
      startPollForConnection();
    }
  }

  function setStatus(cs: ConnectionStatus, status: string) {
    connectionStatus.set(cs);
    if (status.startsWith('The server is listening on')) {
      statusMessage.set(status + ' Waiting for connection...');
    } else {
      statusMessage.set(status);
    }
  }

  function startPollForConnection(delay = 3000) {
    pollHandle = setTimeout(async () => {
      switch (true) {
        // Found DevTools!
        case devtoolsHaveStarted():
          setStatus(ConnectionStatus.Connected, CONNECTED);
          return;
        // Waiting for connection, but we do have an active Metro connection, lets force a reload to enter Dev Mode on app
        // prettier-ignore
        case connectionStatus.get() === ConnectionStatus.Initializing:
           setStatus(
             ConnectionStatus.WaitingForReload,
             "Sending 'reload' to Metro to force the DevTools to connect...",
           );
           metroDevice!.sendMetroCommand('reload');
           startPollForConnection(2000);
           return;
        // Waiting for initial connection, but no WS bridge available
        case connectionStatus.get() === ConnectionStatus.Initializing:
          setStatus(
            ConnectionStatus.WaitingForReload,
            "The DevTools didn't connect yet. Please trigger the DevMenu in the React Native app, or Reload it to connect.",
          );
          startPollForConnection(10000);
          return;
        // Still nothing? Users might not have done manual action, or some other tools have picked it up?
        case connectionStatus.get() === ConnectionStatus.WaitingForReload:
          setStatus(
            ConnectionStatus.WaitingForReload,
            "The DevTools didn't connect yet. Check if no other instances are running.",
          );
          startPollForConnection();
          return;
      }
    }, delay);
  }

  function devtoolsHaveStarted() {
    return (
      (document.getElementById(DEV_TOOLS_NODE_ID)?.childElementCount ?? 0) > 0
    );
  }

  client.onDestroy(() => {
    startResult?.close();
  });

  client.onActivate(() => {
    bootDevTools();
  });

  client.onDeactivate(() => {
    if (pollHandle) {
      clearTimeout(pollHandle);
    }
  });

  return {
    devtoolsHaveStarted,
    connectionStatus,
    statusMessage,
    bootDevTools,
    metroDevice,
  };
}

export function Component() {
  const instance = usePlugin(devicePlugin);
  const connectionStatus = useValue(instance.connectionStatus);
  const statusMessage = useValue(instance.statusMessage);

  return (
    <Layout.Container grow>
      <Toolbar wash>
        {connectionStatus !== ConnectionStatus.Connected ? (
          <Typography.Text type="secondary">{statusMessage}</Typography.Text>
        ) : null}
        {(connectionStatus === ConnectionStatus.WaitingForReload &&
          instance.metroDevice) ||
        connectionStatus === ConnectionStatus.Error ? (
          <Button
            size="small"
            onClick={() => {
              instance.metroDevice?.sendMetroCommand('reload');
              instance.bootDevTools();
            }}
          >
            Retry
          </Button>
        ) : null}
      </Toolbar>
      <DevToolsEmbedder offset={40} nodeId={DEV_TOOLS_NODE_ID} />
    </Layout.Container>
  );
}
