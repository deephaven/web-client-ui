import React, { createContext, useEffect, useState } from 'react';
import '@fontsource/fira-mono/400.css';
import '@fontsource/fira-mono/500.css';
import '@fontsource/fira-mono/700.css';
import '@fontsource/fira-sans/300.css';
import '@fontsource/fira-sans/300-italic.css';
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/400-italic.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-sans/700.css';
import '@fontsource/fira-sans/700-italic.css';

export const FontsLoadedContext = createContext<boolean>(false);

export type FontBootstrapProps = {
  /**
   * Class names of the font elements to pre load
   */
  fontClassNames?: string[];

  /**
   * The children to render wrapped with the FontsLoadedContext.
   * Note that it renders the children even if the fonts aren't loaded yet.
   */
  children: React.ReactNode;
};

/**
 * FontBootstrap component. Handles preloading fonts.
 */
export function FontBootstrap({
  fontClassNames = ['fira-sans-regular', 'fira-sans-semibold', 'fira-mono'],
  children,
}: FontBootstrapProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(function initFonts() {
    document.fonts.ready.then(() => {
      setIsLoaded(true);
    });
  }, []);

  return (
    <>
      <FontsLoadedContext.Provider value={isLoaded}>
        {children}
      </FontsLoadedContext.Provider>
      {/*
      Need to preload any monaco and Deephaven grid fonts.
      We hide text with all the fonts we need on the root app.jsx page
      Load the Fira Mono font so that Monaco calculates word wrapping properly.
      This element doesn't need to be visible, just load the font and stay hidden.
      https://github.com/microsoft/vscode/issues/88689
      Can be replaced with a rel="preload" when firefox adds support
      https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
       */}
      <div
        id="preload-fonts"
        style={{ visibility: 'hidden', position: 'absolute', top: -10000 }}
      >
        {/* trigger loading of fonts needed by monaco and iris grid */}
        {fontClassNames.map(className => (
          <p key={className} className={className}>
            preload
          </p>
        ))}
      </div>
    </>
  );
}

export default FontBootstrap;
