/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import TableColumnFormatter from './TableColumnFormatter';

/** Column formatter for chars */
class CharColumnFormatter extends TableColumnFormatter<number> {
  format(value: number): string {
    return String.fromCharCode(value);
  }
}

export default CharColumnFormatter;
