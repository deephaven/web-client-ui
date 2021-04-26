# @deephaven/log

A logging library that can be used for modules to log different levels of logging, intercept console logging, and store a history of logs in memory for later consumption or exporting.

## Install

```bash
npm install --save @deephaven/log
```

## Usage

```javascript
import Log from '@deephaven/log'

// Set the level of logging you want in your app (default is INFO). This can be changed dynamically.
import { LoggerLevel } from '@deephaven/log'
Log.setLogLevel(LoggerLevel.DEBUG2);

// You can log messages directly without a module by calling the logging methods directly
Log.info('basic info level log message');

// Alternatively, create a log module to group log messages. All messages logged to this module will be prefixed with `[MyModuleName]`.
const log = Log.module('MyModuleName');

// The different possible logging methods. If the log level is set lower than the recorded method, it will not be logged.
log.debug2('debug2 level log message');
log.debug('debug level log message');
log.info('info level log message');
log.log('alias for log.info');
log.warn('warning level log message');
log.error('error level log message');

// Enable the LogProxy to intercept all console messages
import { LogProxy } from '@deephaven/log';
const logProxy = new LogProxy();
logProxy.enable();

// Enable the LogHistory to store all log messages in memory for later consumption or exporting (requires LogProxy to be enabled already)
import { LogHistory } from '@deephaven/log';
const logHistory = new LogHistory(logProxy);
logHistory.enable();
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Deephaven License, see the [LICENSE](LICENSE.md) file.
