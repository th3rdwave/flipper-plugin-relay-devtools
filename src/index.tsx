import RelayDevToolsStandalone from 'relay-devtools-core/standalone';
import {
  FlipperDevicePlugin,
  AndroidDevice,
  styled,
  View,
  Toolbar,
  MetroDevice,
  ReduxState,
  connect,
  Device,
} from 'flipper';
import React, { useEffect } from 'react';
import getPort from 'get-port';

const Container = styled.div({
  display: 'flex',
  flex: '1 1 0%',
  justifyContent: 'center',
  alignItems: 'stretch',
  height: '100%',
});

const DEV_TOOLS_NODE_ID = 'relaydevtools-out-of-react-node';

function createDevToolsNode(): HTMLElement {
  const div = document.createElement('div');
  div.id = DEV_TOOLS_NODE_ID;
  div.style.display = 'none';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.flex = '1 1 0%';
  div.style.justifyContent = 'center';
  div.style.alignItems = 'stretch';

  document.body && document.body.appendChild(div);

  return div;
}

function findDevToolsNode(): HTMLElement | null {
  return document.querySelector('#' + DEV_TOOLS_NODE_ID);
}

function attachDevTools(target: Element | Text, devToolsNode: HTMLElement) {
  target.appendChild(devToolsNode);
  devToolsNode.style.display = 'flex';
}

function detachDevTools(devToolsNode: HTMLElement) {
  devToolsNode.style.display = 'none';
  document.body && document.body.appendChild(devToolsNode);
}

const CONNECTED = 'DevTools connected';

type GrabMetroDeviceStoreProps = { metroDevice: MetroDevice };
type GrabMetroDeviceOwnProps = { onHasDevice(device: MetroDevice): void };

// Utility component to grab the metroDevice from the store if there is one
const GrabMetroDevice = connect<
  GrabMetroDeviceStoreProps,
  {},
  GrabMetroDeviceOwnProps,
  ReduxState
>(({ connections: { devices } }: ReduxState) => ({
  metroDevice: devices.find(
    (device) => device.os === 'Metro' && !device.isArchived,
  ) as MetroDevice,
}))(function ({
  metroDevice,
  onHasDevice,
}: GrabMetroDeviceStoreProps & GrabMetroDeviceOwnProps) {
  useEffect(() => {
    onHasDevice(metroDevice);
  }, [metroDevice]);
  return null;
});

const SUPPORTED_OCULUS_DEVICE_TYPES = ['quest', 'go', 'pacific'];

export default class ReactDevTools extends FlipperDevicePlugin<
  {
    status: string;
  },
  any,
  {}
> {
  pollHandle?: any;
  containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  triedToAutoConnect = false;
  metroDevice?: MetroDevice;
  isMounted = true;

  state = {
    status: 'initializing',
  };

  componentDidMount() {
    let devToolsNode = findDevToolsNode();
    if (!devToolsNode) {
      devToolsNode = createDevToolsNode();
      this.initializeDevTools(devToolsNode);
    } else {
      this.setStatus(
        'DevTools have been initialized, waiting for connection...',
      );
      if (devToolsNode.innerHTML) {
        this.setStatus(CONNECTED);
      } else {
        this.startPollForConnection();
      }
    }

    attachDevTools(this.containerRef?.current!, devToolsNode);
    this.startPollForConnection();
  }

  componentWillUnmount() {
    this.isMounted = false;
    if (this.pollHandle) {
      clearTimeout(this.pollHandle);
    }
    const devToolsNode = findDevToolsNode();
    devToolsNode && detachDevTools(devToolsNode);
  }

  setStatus(status: string) {
    if (!this.isMounted) {
      return;
    }
    if (status.startsWith('The server is listening on')) {
      this.setState({ status: status + ' Waiting for connection...' });
    } else {
      this.setState({ status });
    }
  }

  startPollForConnection() {
    this.pollHandle = setTimeout(() => {
      if (!this.isMounted) {
        return;
      }
      if (findDevToolsNode()?.innerHTML) {
        this.setStatus(CONNECTED);
      } else {
        if (!this.triedToAutoConnect) {
          this.triedToAutoConnect = true;
          this.setStatus(
            "The DevTools didn't connect yet. Please Reload it to connect",
          );
          if (this.metroDevice && this.metroDevice.ws) {
            this.setStatus(
              "Sending 'reload' to the Metro to force the DevTools to connect...",
            );
            this.metroDevice?.sendCommand('reload');
          }
        }
        this.startPollForConnection();
      }
    }, 3000);
  }

  async initializeDevTools(devToolsNode: HTMLElement) {
    try {
      this.setStatus('Waiting for port 8098');
      const port = await getPort({ port: 8098 }); // default port for dev tools
      this.setStatus('Starting DevTools server on ' + port);
      RelayDevToolsStandalone.setContentDOMNode(devToolsNode)
        .setStatusListener((status) => {
          this.setStatus(status);
        })
        .startServer(port);
      this.setStatus('Waiting for device');
      const device = this.device;

      if (device) {
        if (
          device.deviceType === 'physical' ||
          SUPPORTED_OCULUS_DEVICE_TYPES.includes(device.title.toLowerCase())
        ) {
          this.setStatus(`Setting up reverse port mapping: ${port}:${port}`);
          (device as AndroidDevice).reverse([port, port]);
        }
      }
    } catch (e) {
      console.error(e);
      this.setStatus('Failed to initialize DevTools: ' + e);
    }
  }

  render() {
    return (
      <View grow>
        {this.state.status !== CONNECTED ? (
          <Toolbar>{this.state.status}</Toolbar>
        ) : null}
        <Container ref={this.containerRef} />
        <GrabMetroDevice
          onHasDevice={(device: MetroDevice) => {
            this.metroDevice = device;
          }}
        />
      </View>
    );
  }
}
