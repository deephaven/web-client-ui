import React, { useState, useEffect } from 'react';
import { dh } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import PropTypes from 'prop-types';

async function copyText(text) {
  try {
    return await navigator.clipboard.writeText(text);
  } catch (error) {
    throw new Error(`Unable to copy: ${error.message}`);
  }
}

const DH_PREFIX = 'dh';
const VS_PREFIX = 'vs';
// prefix, icon-name to prefixIconName
const getPrefixedName = (name, prefix) =>
  prefix.toLowerCase() +
  name
    .split('-')
    .map(str => str.charAt(0).toUpperCase() + str.slice(1))
    .join('');

const Flash = ({ message, message: { text } }) => {
  const [show, setShow] = useState(false);

  useEffect(
    function setFlashMessage() {
      if (!text) return;
      setShow(true);
      const timeout = setTimeout(() => {
        setShow(false);
      }, 2000);
      // eslint-disable-next-line consistent-return
      return () => {
        clearTimeout(timeout);
      };
    },
    [message, text]
  );

  return <p className={show ? 'flash in' : 'flash out'}>{text}</p>;
};

Flash.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.node,
  }).isRequired,
};

const Icons = () => {
  const [dhFilter, setDhFilter] = useState(true);
  const [vsFilter, setVsFilter] = useState(true);
  const [search, setSearch] = useState('');
  const [flashText, setFlashText] = useState({ text: '' });

  const renderIcons = Object.values(dh)
    .filter(icon => {
      const matchesFilter =
        (icon.prefix.toLowerCase() + icon.iconName.toLowerCase()).indexOf(
          search.toLowerCase()
        ) !== -1;
      const isDH = dhFilter && icon.prefix === DH_PREFIX;
      const isVS = vsFilter && icon.prefix === VS_PREFIX;
      return matchesFilter && (isDH || isVS);
    })
    .map(icon => {
      const prefixedName = getPrefixedName(icon.iconName, icon.prefix);
      return (
        <Button
          key={prefixedName}
          kind="inline"
          className="card"
          onClick={() => {
            // new object, so it always flashes even on same string
            copyText(prefixedName)
              .then(() => {
                setFlashText({
                  text: (
                    <span>
                      <FontAwesomeIcon icon={dh.vsOutput} /> Copied text:{' '}
                      <strong>{prefixedName}</strong>
                    </span>
                  ),
                });
              })
              .catch(err => {
                setFlashText({
                  text: <span className="text-danger">{err.message}</span>,
                });
              });
          }}
        >
          <FontAwesomeIcon icon={icon} className="icon" />

          <label title={prefixedName}>{prefixedName}</label>
        </Button>
      );
    });

  return (
    <div>
      <h2 className="ui-title">Icons</h2>
      <div className="row">
        <div className="col">
          <div className="form-inline mb-3">
            <input
              type="search"
              placeholder="Basic icon search..."
              value={search}
              className="form-control"
              onChange={event => {
                setSearch(event.target.value);
              }}
            />
            <span className="mx-2">Show: </span>
            <Button
              kind="inline"
              active={vsFilter}
              className="mr-2"
              onClick={() => setVsFilter(!vsFilter)}
              icon={vsFilter ? dh.vsCheck : dh.vsClose}
            >
              VS ICONS
            </Button>
            <Button
              kind="inline"
              active={dhFilter}
              className="mr-2"
              onClick={() => setDhFilter(!dhFilter)}
              icon={dhFilter ? dh.vsCheck : dh.vsClose}
            >
              DH ICONS
            </Button>
            <small>
              ({renderIcons.length} icon{renderIcons.length === 1 ? '' : 's'})
            </small>
          </div>
          <div className="icons">
            {renderIcons}
            {renderIcons.length === 0 && (
              <p className="no-result">No icons found.</p>
            )}
            <Flash message={flashText} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Icons;
