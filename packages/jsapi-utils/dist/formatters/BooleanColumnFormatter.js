/* eslint class-methods-use-this: "off" */

/* eslint no-unused-vars: "off" */
import TableColumnFormatter from "./TableColumnFormatter.js";
/** Column formatter for chars */

class BooleanColumnFormatter extends TableColumnFormatter {
  format(value) {
    switch (value) {
      case 1:
      case true:
        return 'true';

      case 0:
      case false:
        return 'false';

      default:
        return '';
    }
  }

}

export default BooleanColumnFormatter;
//# sourceMappingURL=BooleanColumnFormatter.js.map