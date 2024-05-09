import React from 'react';
import classnames from 'classnames';
import SampleSection from './SampleSection';

const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

function Tab({
  isActive,
  title,
}: {
  isActive: boolean;
  title: string;
}): JSX.Element {
  return (
    <li className={classnames('lm_tab', isActive && 'lm_active')}>
      <span className="lm_title_before" />
      <span className="lm_title">{title}</span>
      <span className="lm_close_tab" />
    </li>
  );
}

export function GoldenLayout(): JSX.Element {
  return (
    <SampleSection sectionId="golden-layout">
      <h2 className="ui-title">Golden Layout</h2>
      {[false, true].map(isMaximised => (
        <React.Fragment key={String(isMaximised)}>
          <h5>{isMaximised ? 'Minimized' : 'Maximised'}</h5>
          <div
            style={{ position: 'relative', border: 'none' }}
            className={isMaximised ? 'lm_maximised' : undefined}
          >
            <div className="lm_header">
              <ul className="lm_tabs">
                {tabs.map((tab, i) => (
                  <Tab key={tab} isActive={i === 0} title={tab} />
                ))}
              </ul>
              <ul className="lm_controls">
                <li className="lm_tabpreviousbutton" />
                <li className="lm_tabnextbutton" />
                <li className="lm_maximise" />
                <li className="lm_popout" />
                <li className="lm_tabdropdown" />
                <li className="lm_close" />
              </ul>
            </div>
          </div>
        </React.Fragment>
      ))}
    </SampleSection>
  );
}

export default GoldenLayout;
