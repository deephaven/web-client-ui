/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import TableColumnFormatter from './TableColumnFormatter';

/** Column formatter for booleans */
class BooleanColumnFormatter extends TableColumnFormatter<boolean | number> {
  format(value: boolean | number): string {
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
