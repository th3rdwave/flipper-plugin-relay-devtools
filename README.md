# Flipper plugin for Relay devtools

Flipper plugin wrapper for [relay-devtools](https://github.com/relayjs/relay-devtools).

![](https://i.imgur.com/BlLx5af.png)

Note that this uses the new version of relay devtools that is still under development and incomplete.

## Installation

```
npm install react-native-flipper-relay-devtools react-native-flipper
```

Make sure `react-native-flipper` is installed properly if not using autolinking.

### Flipper desktop app

Manage Plugins -> Install Plugins -> Search for `flipper-plugin-relay-devtools`

### JavaScript

Register the flipper plugin and connect to relay devtools.

```js
if (__DEV__) {
  require('react-native-flipper-relay-devtools').addPlugin();
}
```

## Troubleshooting

### Android

You might need to run `adb reverse tcp:8098 tcp:8098`
