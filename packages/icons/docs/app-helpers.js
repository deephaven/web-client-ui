// toggles dark/light class on body and save to local storage
export const useDarkMode = () => {
  const [theme, setTheme] = React.useState('dark');

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      window.localStorage.setItem('theme', 'light');
    }
  };

  React.useEffect(function setTheme() {
    const localTheme = window.localStorage.getItem('theme');

    if (localTheme) {
      setTheme(localTheme);
      document.body.classList.add(localTheme);
    } else {
      window.localStorage.setItem('theme', theme);
      document.body.classList.add(theme);
    }
  });

  return [theme, toggleTheme];
};

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

export async function getClipboardContents() {
  try {
    const text = await navigator.clipboard.readText();
    return text;
    console.log('Pasted content: ', text);
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err);
  }
}

// prefix, icon-name to prefixIconName
export function getPrefixedName(name, prefix) {
  return (
    prefix.toLowerCase() +
    name
      .split('-')
      .map(str => {
        return str.charAt(0).toUpperCase() + str.slice(1);
      })
      .join('')
  );
}
