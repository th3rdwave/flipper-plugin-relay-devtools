import { connectToDevTools } from 'relay-devtools-core/backend';
import { addPlugin as baseAddPlugin } from 'react-native-flipper';

export function addPlugin() {
  let connected = true;

  connectToDevTools({
    port: 8098,
    isAppActive: () => connected,
  });

  baseAddPlugin({
    runInBackground: () => true,
    getId() {
      return 'flipper-plugin-relay-devtools';
    },
    onConnect() {
      connected = true;
    },
    onDisconnect() {
      connected = false;
    },
  });
}
