/* eslint class-methods-use-this: "off" */
import TableColumnFormatter from "./TableColumnFormatter.js";
/** Column formatter for strings */

export class StringColumnFormatter extends TableColumnFormatter {
  format(value) {
    return value;
  }

}
export default StringColumnFormatter;
//# sourceMappingURL=StringColumnFormatter.js.map