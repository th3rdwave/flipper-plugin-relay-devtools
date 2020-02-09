import { connectToDevTools } from 'relay-devtools-core/backend';
import { addPlugin as baseAddPlugin } from 'react-native-flipper';
import { Platform } from 'react-native';

export function addPlugin() {
  let connected = true;

  connectToDevTools({
    port: 8098,
    isAppActive: () => (Platform.OS === 'android' ? connected : true),
  });

  // Currently react-native-flipper is only implemented on Android
  // so the plugin needs to be registered natively on iOS.
  if (Platform.OS === 'android') {
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
}
