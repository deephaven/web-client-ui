/* eslint class-methods-use-this: "off" */

/* eslint no-unused-vars: "off" */
import TableColumnFormatter from "./TableColumnFormatter.js";
/** Column formatter for chars */

class CharColumnFormatter extends TableColumnFormatter {
  format(value) {
    return String.fromCharCode(value);
  }

}

export default CharColumnFormatter;
//# sourceMappingURL=CharColumnFormatter.js.map