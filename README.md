# Flipper plugin for Relay DevTools

Flipper plugin wrapper for [relay-devtools](https://github.com/relayjs/relay-devtools).

Note that this uses the new version of relay devtools that is still under development and incomplete.

## Installation

```
npm install flipper-plugin-relay-devtools react-native-flipper
```

Make sure `react-native-flipper` is installed properly if not using autolinking.

### Flipper desktop app

Manage Plugins -> Install Plugins -> Search for `flipper-plugin-relay-devtools`

### JavaScript

Register the flipper plugin and connect to relay devtools.

```js
if (__DEV__) {
  import('flipper-plugin-relay-devtools/client').then(m => m.addPlugin());
}
```

### iOS

Currently [react-native-flipper](https://github.com/facebook/flipper/tree/master/react-native/react-native-flipper) is only implemented on Android so iOS requires manual registration of the plugin.

Create RelayDevtoolsFlipperPlugin.h

```objc
#if FB_SONARKIT_ENABLED

#import <Foundation/Foundation.h>

#import <FlipperKit/FlipperPlugin.h>

@interface RelayDevtoolsFlipperPlugin : NSObject<FlipperPlugin>

@end

#endif
```

Create RelayDevtoolsFlipperPlugin.m

```objc
#if FB_SONARKIT_ENABLED

#import "RelayDevtoolsFlipperPlugin.h"

#import <FlipperKit/FlipperConnection.h>

@implementation RelayDevtoolsFlipperPlugin

- (NSString*)identifier
{
  return @"flipper-plugin-relay-devtools";
}

- (void)didConnect:(__unused id<FlipperConnection>)connection
{
}

- (void)didDisconnect
{
}

@end

#endif
```

In AppDelegate.m

```objc
// With the other flipper imports
#import "RelayDevtoolsFlipperPlugin.h"

...

// With the other flipper plugins
[client addPlugin: [RelayDevtoolsFlipperPlugin new]];
```


