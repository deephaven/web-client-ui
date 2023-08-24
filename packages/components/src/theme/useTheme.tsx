import { useContext } from 'react';
import { ThemeContextType, ThemeContext } from './ThemeProvider';

const useTheme = (): ThemeContextType => useContext(ThemeContext);

export default useTheme;
