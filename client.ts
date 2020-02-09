import { connectToDevTools } from 'relay-devtools-core/backend';
import { addPlugin as baseAddPlugin } from 'react-native-flipper';
import { Platform } from 'react-native';

export function addPlugin() {
  connectToDevTools({ port: 8098 });

  // Currently react-native-flipper is only implemented on Android
  // so the plugin needs to be registered natively on iOS.
  if (Platform.OS === 'android') {
    baseAddPlugin({
      runInBackground: () => true,
      getId() {
        return 'flipper-plugin-relay-devtools';
      },
      onConnect() {},
      onDisconnect() {},
    });
  }
}
