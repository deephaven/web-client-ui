# @deephaven/icons

[Icon Previews](#) -- Link to avaiable icon previews TBD

Takes the [vscode-codicons](https://github.com/microsoft/vscode-codicons) icons and wraps them in a format usable by the [Font Awesome React component](https://github.com/FortAwesome/react-fontawesome) as custom icons. We also extend the icon set with additional icons that are visually compatible with vscode-codicons, specific to Deephaven but made available here.

## Why?

We liked the dev experience with the Font Awesome React component, and use Font Awesome Pro in our enterprise offering. However, we needed a code-focused open-source icon set for use in our Deephaven OSS projects, and added a few extra that we use.

## Getting started

Install with `npm install @deephaven/icons @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome` to use this icon set in your React project.

Then within your react project import the individual icons, and use as you would a normal `faIcon`.

```
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {vsAccount, dhTruck} from `@deephaven/icons';

[...]
<FontAwesomeIcon icon="vsAccount" />
<FontAwesomeIcon icon="dhTruck" />
```

## Development

This is part of the deephaven/core monorepo, and published as a package via lerna from the web/client-ui folder. Develop the icons locally by running `npm install` within the `core/web/client-ui/packages/icons` folder.

Build with `npm run build`. The build step will perform a command line svg optimization step on both the dh and vs icons. It attempts to merge all paths, which can be bad if you have intersecting shapes. Don't have intersecting shapes. Both svg sets are copied to the dist folder. Then we use the build.js script to transform the svg files into the exported .js and .ts files needed by react-fontawesome.

Deephaven icons are .svg files in `/src/icons` folder, and will be added as `dh` prefixed icons. vscode-codicons are imported from the `node_modules/vscode-codicons` package and prefixed as `vs` icons. Collectively, they are part of the `dh` prefix as far as react-fontawesome is concerned.

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Deephaven License, see the [LICENSE](LICENSE.md) file.

Icons included from [vscode-codicons](https://github.com/microsoft/vscode-codicons) during the build process are licensed under the [Creative Commons Attribution 4.0 International Public License](https://creativecommons.org/licenses/by/4.0/legalcode).  

