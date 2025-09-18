import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Content,
  ContextualHelp,
  Heading,
  Switch,
  Text,
} from '@deephaven/components';
import { getWebGL, getWebGLEditable, updateSettings } from '@deephaven/redux';
import { useAppSelector } from '@deephaven/dashboard';

function AdvancedSectionContent(): JSX.Element {
  const dispatch = useDispatch();
  const webgl = useAppSelector(getWebGL);
  const webglEditable = useAppSelector(getWebGLEditable);

  const handleWebglChange = useCallback(
    (newValue: boolean) => {
      dispatch(updateSettings({ webgl: newValue }));
    },
    [dispatch]
  );

  const helpText = webglEditable ? (
    <Text>
      WebGL in most cases has significant performance improvements, particularly
      when plotting large datasets. However, in some environments (such as
      remote desktop environments), WebGL may not use hardware acceleration and
      have degraded performance. If you are experiencing issues with WebGL, you
      can disable it here.
    </Text>
  ) : (
    <Text>
      WebGL is disabled by your system administrator. Contact your system
      administrator to enable.
    </Text>
  );

  return (
    <>
      <div className="app-settings-menu-description">
        Advanced settings here. Be careful!
      </div>

      <div className="form-row mb-3 pl-1">
        <Switch
          isSelected={webgl}
          isDisabled={!webglEditable}
          onChange={handleWebglChange}
          marginEnd="size-0"
        >
          Enable WebGL
        </Switch>
        <ContextualHelp variant="info" marginTop="size-50">
          <Heading>Enable WebGL</Heading>
          <Content>
            <Text>{helpText}</Text>
          </Content>
        </ContextualHelp>
      </div>
    </>
  );
}

export default AdvancedSectionContent;
