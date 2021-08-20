# @deephaven/jsapi-shim

A shim library that is used to import the global `dh` object as a module, and provide some useful `PropTypes`.

## Install

```bash
npm install --save @deephaven/jsapi-shim
```

## Usage

```javascript
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim'

class MyComponent {
  componentDidMount() {
    const { session } = this.props;
    session.addEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      event => {
        console.log('Command started event', event);
      }
    );
  }

  render() {
    return null;
  }
}

MyComponent.proptypes = {
  session: APIPropTypes.IdeSession.isRequired,
}

export default MyComponent;