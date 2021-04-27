/* eslint no-console: "off" */
import React from 'react';
import SelectValueListInput from './SelectValueListInput';
import ItemListInput from './ItemListInput';

const ItemListInputs = () => (
  <div className="style-guide-inputs">
    <h2 className="ui-title">Item Lists</h2>

    <div className="row">
      <div className="col">
        <div className="form-group">
          <h5>Select List</h5>
          <div style={{ height: '300px' }}>
            <SelectValueListInput />
          </div>
        </div>
      </div>
      <div className="col">
        <div className="form-group">
          <h5>Item List</h5>
          <div style={{ height: '300px' }}>
            <ItemListInput />
          </div>
        </div>
      </div>
      <div className="col">
        <div className="form-group">
          <h5>Multi Select Item List</h5>
          <div style={{ height: '300px' }}>
            <ItemListInput isMultiSelect />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ItemListInputs;
