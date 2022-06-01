/* eslint class-methods-use-this: "off" */

/* eslint no-unused-vars: "off" */
import TableColumnFormatter from "./TableColumnFormatter.js";

class DefaultColumnFormatter extends TableColumnFormatter {
  format(value) {
    return "".concat(value);
  }

}

export default DefaultColumnFormatter;
//# sourceMappingURL=DefaultColumnFormatter.js.map