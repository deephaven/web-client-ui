# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)


### Bug Fixes

* Add isInvalid prop to Select component ([#1883](https://github.com/deephaven/web-client-ui/issues/1883)) ([1803f31](https://github.com/deephaven/web-client-ui/commit/1803f31db3f0b5d2af2baf2931f47edb037c530e)), closes [#1882](https://github.com/deephaven/web-client-ui/issues/1882)
* adjust alignment of search input next/previous buttons ([#1917](https://github.com/deephaven/web-client-ui/issues/1917)) ([c7fcd38](https://github.com/deephaven/web-client-ui/commit/c7fcd38d41d27d7ff3cc32222b16b44412611b71))


### Features

* re-export spectrum useStyleProp util ([#1916](https://github.com/deephaven/web-client-ui/issues/1916)) ([aafa14b](https://github.com/deephaven/web-client-ui/commit/aafa14b12e273c82f0df69d8d7b322c7fc8bff6c))
* wrap spectrum View, Text and Heading to accept custom colors ([#1903](https://github.com/deephaven/web-client-ui/issues/1903)) ([a03fa07](https://github.com/deephaven/web-client-ui/commit/a03fa0796e8a5a665d0badbd8380995567b0d6dc))





# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)


### Bug Fixes

* Fixed re-export ([#1894](https://github.com/deephaven/web-client-ui/issues/1894)) ([#1895](https://github.com/deephaven/web-client-ui/issues/1895)) ([b49b506](https://github.com/deephaven/web-client-ui/commit/b49b5069d637ac136578ce839d9fc0416f468adf))


### Features

* Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)





# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)


### chore

* Delete ValidateLabelInput ([#1887](https://github.com/deephaven/web-client-ui/issues/1887)) ([5d6ebe9](https://github.com/deephaven/web-client-ui/commit/5d6ebe92d91f39c1a2343721f5a4f53a6e02f3a5))


### Features

* Re-export Spectrum components + prop types ([#1880](https://github.com/deephaven/web-client-ui/issues/1880)) ([4783092](https://github.com/deephaven/web-client-ui/commit/478309289f727c560ae92722c96fed964ba98d9d)), closes [#1852](https://github.com/deephaven/web-client-ui/issues/1852)


### BREAKING CHANGES

* ValidateLabelInput is no longer included in the
`@deephaven/components` package.





# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)


### Features

* expose spectrum `Flex` component as wrapped deephaven component ([#1869](https://github.com/deephaven/web-client-ui/issues/1869)) ([5e71488](https://github.com/deephaven/web-client-ui/commit/5e71488d142b4d2b427bc0b81d17a0f538b09c26))





# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)


### Features

* Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))





# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)


### Features

* Added section support to Picker ([#1847](https://github.com/deephaven/web-client-ui/issues/1847)) ([1381ee7](https://github.com/deephaven/web-client-ui/commit/1381ee7f79ab493922a7fd3daa9d43ee6791547f))





## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)


### Bug Fixes

* Spectrum actionbar selector ([#1841](https://github.com/deephaven/web-client-ui/issues/1841)) ([67de0e0](https://github.com/deephaven/web-client-ui/commit/67de0e09d11ba340aa546be71c400852a5a2092c))





# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)


### Bug Fixes

* spectrum textfield validation icon position with set content-box ([#1825](https://github.com/deephaven/web-client-ui/issues/1825)) ([8d95212](https://github.com/deephaven/web-client-ui/commit/8d952125009ddc4e4039833be4a80404d82ed7d7))


### Features

* exposes editor-line-number-active-fg theme variable ([#1833](https://github.com/deephaven/web-client-ui/issues/1833)) ([448f0f0](https://github.com/deephaven/web-client-ui/commit/448f0f0d5bf99be14845e3f6b0e063f55a8de775))
* Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))
* Picker Component ([#1821](https://github.com/deephaven/web-client-ui/issues/1821)) ([e50f0f6](https://github.com/deephaven/web-client-ui/commit/e50f0f6c0402717f1bb8adb8a08a217a0f8d1f45))


### BREAKING CHANGES

* the duplicate `spectrum-Textfield-validationIcon` css
in DHE should be removed





# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/components





# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)


### Bug Fixes

* address chrome 121 scrollbar style behaviour change ([#1787](https://github.com/deephaven/web-client-ui/issues/1787)) ([fa3a33d](https://github.com/deephaven/web-client-ui/commit/fa3a33d18ccf0b3c011088b77ffb625237aa6836))


### Features

* Chart responsible for its own theme ([#1772](https://github.com/deephaven/web-client-ui/issues/1772)) ([fabb055](https://github.com/deephaven/web-client-ui/commit/fabb055f9dacdbb4ad1b4ce7ca85d170f955366d)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)


### BREAKING CHANGES

* - Renamed `ColorUtils.getColorwayFromTheme` to `normalizeColorway`
- Removed `chartTheme` arg from functions in `ChartUtils`,
`ChartModelFactory` and `FigureChartModel` in @deephaven/chart





# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)


### Bug Fixes

* adjust theme notice and info colors ([#1779](https://github.com/deephaven/web-client-ui/issues/1779)) ([8930522](https://github.com/deephaven/web-client-ui/commit/893052295861cfca13e445abe61b3ac4aa55af61))
* DH-16461: Preload --dh-color-text-highlight ([#1780](https://github.com/deephaven/web-client-ui/issues/1780)) ([#1781](https://github.com/deephaven/web-client-ui/issues/1781)) ([f7989b6](https://github.com/deephaven/web-client-ui/commit/f7989b6054e5301276f5b94e5ee1e8f5f73ca6a1))
* show copy cursor in grid on key down and not just mouse move  ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))


### BREAKING CHANGES

* linker and iris grid custom cursor styling and assets
are now provided by components directly. DHE css and svg files
containing linker cursors should be removed/de-duplicated.





# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/components





## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)


### Bug Fixes

* apply theme accent color scale and other small tweaks ([#1768](https://github.com/deephaven/web-client-ui/issues/1768)) ([1e631a4](https://github.com/deephaven/web-client-ui/commit/1e631a470bff851f8c0d4401a43bc08d0c974391))





# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)


### Features

* allow themes to use any srgb color for definitions ([#1756](https://github.com/deephaven/web-client-ui/issues/1756)) ([b047fa3](https://github.com/deephaven/web-client-ui/commit/b047fa36de3a285be925736ef73722a60d1d9ed7))
* DH-16336: usePickerWithSelectedValues - boolean flags should be calculated based on trimmed search text ([#1750](https://github.com/deephaven/web-client-ui/issues/1750)) ([228f34d](https://github.com/deephaven/web-client-ui/commit/228f34d40ca2f594e0a39b7975ff4668b065d101)), closes [#1747](https://github.com/deephaven/web-client-ui/issues/1747)


### BREAKING CHANGES

* - IrisGridThemeContext no longer accepts a paritial theme. By
guaranteeing the provider is a full theme we can resolve the CSS
variables and normailze the colors only once per theme load globally,
rather than having to do it once per grid.
- Themes must be defined using valid srgb CSS colors, and not hsl raw
component values
* `usePickerWithSelectedValues` now takes an object as an
argument instead of positional args





# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)


### Bug Fixes

* hcm caret shouldn't be allowed to shrink ([#1733](https://github.com/deephaven/web-client-ui/issues/1733)) ([6547814](https://github.com/deephaven/web-client-ui/commit/65478140934157c7c5bcf27ea89151255fb18a52)), closes [deephaven-ent/iris#1274](https://github.com/deephaven-ent/iris/issues/1274)


### Features

* added shortcut for copying version info and added browser/os to info ([#1739](https://github.com/deephaven/web-client-ui/issues/1739)) ([3312133](https://github.com/deephaven/web-client-ui/commit/3312133c902ed4a5ca110296ca36311fde9c1056))
* adjust display of  theme palette in styleguide ([#1745](https://github.com/deephaven/web-client-ui/issues/1745)) ([0ab0c93](https://github.com/deephaven/web-client-ui/commit/0ab0c936baaee9effc08d4d9e8d6cc3ba60f9c97))
* Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
* Default Plotly map colors ([#1721](https://github.com/deephaven/web-client-ui/issues/1721)) ([e8b9f12](https://github.com/deephaven/web-client-ui/commit/e8b9f121afaeb2c3dd6484a05ca1966a1d769260))





# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)


### Bug Fixes

* Moved logos so they show in production build ([#1713](https://github.com/deephaven/web-client-ui/issues/1713)) ([a3bea73](https://github.com/deephaven/web-client-ui/commit/a3bea733b97dfafe33a54623ef8e8e04cb5aa44e)), closes [#1712](https://github.com/deephaven/web-client-ui/issues/1712)
* TimeInput not triggering onChange on incomplete values ([#1711](https://github.com/deephaven/web-client-ui/issues/1711)) ([6894d96](https://github.com/deephaven/web-client-ui/commit/6894d96f921f57f0abb108bc2f3d8d86e9fa3c56)), closes [#1710](https://github.com/deephaven/web-client-ui/issues/1710)


### Features

* Action button tooltips ([#1706](https://github.com/deephaven/web-client-ui/issues/1706)) ([bff6bf9](https://github.com/deephaven/web-client-ui/commit/bff6bf91b938bbba7f7649ac671d2e4447ea3439)), closes [#1705](https://github.com/deephaven/web-client-ui/issues/1705)
* Improved preload variable handling ([#1723](https://github.com/deephaven/web-client-ui/issues/1723)) ([ed41c42](https://github.com/deephaven/web-client-ui/commit/ed41c424de75fcba8751a70b54a189957f979e97)), closes [#1695](https://github.com/deephaven/web-client-ui/issues/1695) [#1679](https://github.com/deephaven/web-client-ui/issues/1679)
* NavTabList component ([#1698](https://github.com/deephaven/web-client-ui/issues/1698)) ([96641fb](https://github.com/deephaven/web-client-ui/commit/96641fbc2f5f5ee291da15e464e80183d5107a57))
* theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))





# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)


### Features

* Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
* Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)





## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)


### Bug Fixes

* Bootstrap mixins ([#1692](https://github.com/deephaven/web-client-ui/issues/1692)) ([3934431](https://github.com/deephaven/web-client-ui/commit/3934431c0fbb440eff9017356d033394666cf7a1)), closes [#1693](https://github.com/deephaven/web-client-ui/issues/1693)





# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)


### Features

* Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)


### Bug Fixes

* add right margin to <Button kind='inline'/> using icons ([#1664](https://github.com/deephaven/web-client-ui/issues/1664)) ([fd8a6c6](https://github.com/deephaven/web-client-ui/commit/fd8a6c65d64b93ba69849b6053d5bbbd9d72c4dc))
* adjust filter bar colour ([#1666](https://github.com/deephaven/web-client-ui/issues/1666)) ([4c0200e](https://github.com/deephaven/web-client-ui/commit/4c0200e71e350fcf5261b0cc28440cb798bec207))


### Features

* Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
* forward and back button for organize column search ([#1641](https://github.com/deephaven/web-client-ui/issues/1641)) ([89f2be5](https://github.com/deephaven/web-client-ui/commit/89f2be56647c977e4150f050ceec9e33f4c07680)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
* theme fontawesome icon size wrapped in spectrum icons ([#1658](https://github.com/deephaven/web-client-ui/issues/1658)) ([2aa8cef](https://github.com/deephaven/web-client-ui/commit/2aa8cef6ce5a419b20c8a74d107bd523156d8ea4))
* Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
* Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
* Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))


### BREAKING CHANGES

* Bootstrap color variables are now predominantly hsl
based. SCSS will need to be updated accordingly. Theme providers are
needed to load themes.





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)


### Features

* forward and back buttons for organize column search ([#1620](https://github.com/deephaven/web-client-ui/issues/1620)) ([75cf184](https://github.com/deephaven/web-client-ui/commit/75cf184f4b4b9d9a771544ea6335e5d2733368d9)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)


### Reverts

* feat: forward and back buttons for organize column search ([#1640](https://github.com/deephaven/web-client-ui/issues/1640)) ([737d1aa](https://github.com/deephaven/web-client-ui/commit/737d1aa98d04800377035d7d189219fefacfa23f))





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)


### Bug Fixes

* Date argument non-optional for the onChange prop ([#1622](https://github.com/deephaven/web-client-ui/issues/1622)) ([9a960b3](https://github.com/deephaven/web-client-ui/commit/9a960b3a50eed904fce61d3e97307261582a1de7)), closes [#1601](https://github.com/deephaven/web-client-ui/issues/1601)
* Fixing grid colors and grays ([#1621](https://github.com/deephaven/web-client-ui/issues/1621)) ([9ab2b1e](https://github.com/deephaven/web-client-ui/commit/9ab2b1e3204c7f854b8526e510b1e5a5fc59b8f6)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)


### Features

* Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)


### BREAKING CHANGES

* - ChartThemeProvider is now required to provide ChartTheme
- ChartModelFactory and ChartUtils now require chartTheme args





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)


### Features

* Babel Plugin - Mock css imports ([#1607](https://github.com/deephaven/web-client-ui/issues/1607)) ([787c542](https://github.com/deephaven/web-client-ui/commit/787c5420ecb90661ae5032e174f292707e908820)), closes [#1606](https://github.com/deephaven/web-client-ui/issues/1606)





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)


### Bug Fixes

* Theming - switched from ?inline to ?raw css imports ([#1600](https://github.com/deephaven/web-client-ui/issues/1600)) ([f6d0874](https://github.com/deephaven/web-client-ui/commit/f6d0874a98cc7377c3857a44930b5c636b72ca1f)), closes [#1599](https://github.com/deephaven/web-client-ui/issues/1599)


### BREAKING CHANGES

* Theme css imports were switched from `?inline` to
`?raw`. Not likely that we have any consumers yet, but this would impact
webpack config.





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Bug Fixes

* Adjusted Monaco "white" colors ([#1594](https://github.com/deephaven/web-client-ui/issues/1594)) ([c736708](https://github.com/deephaven/web-client-ui/commit/c736708e0dd39aa1d0f171f1e9ecf69023647021)), closes [#1592](https://github.com/deephaven/web-client-ui/issues/1592)


### Features

* Theming - Spectrum Provider ([#1582](https://github.com/deephaven/web-client-ui/issues/1582)) ([a4013c0](https://github.com/deephaven/web-client-ui/commit/a4013c0b83347197633a008b2b56006c8da12a46)), closes [#1543](https://github.com/deephaven/web-client-ui/issues/1543)
* Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))


### BREAKING CHANGES

* Enterprise will need ThemeProvider for the css
variables to be available





# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)


* fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)


### Features

* Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)
* Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)


### BREAKING CHANGES

* Theme variables have to be present on body to avoid
Monaco init failing
* Inline LoadingSpinner instances will need to be
decorated with `className="loading-spinner-vertical-align"` for vertical
alignment to work as before





## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)


### Bug Fixes

* Right clicking with a custom context menu open should open another context menu ([#1526](https://github.com/deephaven/web-client-ui/issues/1526)) ([bd08e1f](https://github.com/deephaven/web-client-ui/commit/bd08e1fa50d938a94ead82f55b365b7c00e8d8f0)), closes [#1525](https://github.com/deephaven/web-client-ui/issues/1525)





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/components





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/components





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)


### Features

* adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)





## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

**Note:** Version bump only for package @deephaven/components





# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/components





# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/components

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/components

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/components

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Features

- improvements to null and empty strings filters in grid ([#1348](https://github.com/deephaven/web-client-ui/issues/1348)) ([ed3a8c5](https://github.com/deephaven/web-client-ui/commit/ed3a8c5f224094306ff55f9b41706cb58ff709e2)), closes [#1243](https://github.com/deephaven/web-client-ui/issues/1243)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/components

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/components

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Bug Fixes

- drag to re-arrange custom columns not working ([#1299](https://github.com/deephaven/web-client-ui/issues/1299)) ([5e23e4a](https://github.com/deephaven/web-client-ui/commit/5e23e4a9f69eaf6fcb55e0e30ceb490ad913966e)), closes [#1282](https://github.com/deephaven/web-client-ui/issues/1282) [#1013](https://github.com/deephaven/web-client-ui/issues/1013)

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- Update @vscode/codicons to v0.0.33 ([#1259](https://github.com/deephaven/web-client-ui/issues/1259)) ([1b29af1](https://github.com/deephaven/web-client-ui/commit/1b29af18fa60411a0e16ca1df27a969b11492c56))

### BREAKING CHANGES

- `vsCircleLargeOutline` icon renamed to `vsCircleLarge`

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- DH-14657 Better disconnect handling ([#1261](https://github.com/deephaven/web-client-ui/issues/1261)) ([9358e41](https://github.com/deephaven/web-client-ui/commit/9358e41fd3d7c587a45788819eec0962a8361202)), closes [#1149](https://github.com/deephaven/web-client-ui/issues/1149)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/components

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- **@deephaven/components:** Custom React Spectrum Provider ([#1211](https://github.com/deephaven/web-client-ui/issues/1211)) ([609c57e](https://github.com/deephaven/web-client-ui/commit/609c57ed38a4a905e52e1d3e2588d3e7079a1b81)), closes [#1210](https://github.com/deephaven/web-client-ui/issues/1210)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/components

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/components

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Features

- Add signatureHelp and hover providers to monaco ([#1178](https://github.com/deephaven/web-client-ui/issues/1178)) ([f1f3abf](https://github.com/deephaven/web-client-ui/commit/f1f3abffc9df4178477714f06dcc57d40d6942a9))
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Goto Value Skips Rows on String Column, Displays Incorrect Filter, and `shift+enter` Doesn't go to Previous ([#1162](https://github.com/deephaven/web-client-ui/issues/1162)) ([e83d7c9](https://github.com/deephaven/web-client-ui/commit/e83d7c9f7265fc6402a347fa8826cef16ad3c93f)), closes [#1156](https://github.com/deephaven/web-client-ui/issues/1156) [#1157](https://github.com/deephaven/web-client-ui/issues/1157)

### Code Refactoring

- Fix fast refresh invalidations ([#1150](https://github.com/deephaven/web-client-ui/issues/1150)) ([2606826](https://github.com/deephaven/web-client-ui/commit/26068267c2cd67bc971b9537f8ce4108372167f5)), closes [#727](https://github.com/deephaven/web-client-ui/issues/727)

### BREAKING CHANGES

- Renamed `renderFileListItem` to `FileListItem`.
  Renamed `RenderFileListItemProps` to `FileListItemProps`.
  Removed exports for `ConsolePlugin.assertIsConsolePluginProps`,
  `GridPlugin.SUPPORTED_TYPES`, `FileList.getPathFromItem`,
  `FileList.DRAG_HOVER_TIMEOUT`, `FileList.getItemIcon`,
  `Grid.directionForKey`, `GotoRow.isIrisGridProxyModel`, and
  `Aggregations.SELECTABLE_OPTIONS`. These were all only being consumed
  within their own file and are not consumed in enterprise

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

**Note:** Version bump only for package @deephaven/components

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

### Bug Fixes

- Clicking a folder in file explorer panel sometimes fails to open or close it ([#1099](https://github.com/deephaven/web-client-ui/issues/1099)) ([7a7fc14](https://github.com/deephaven/web-client-ui/commit/7a7fc140d8721297bbdc17af879777b27f25269a)), closes [#1085](https://github.com/deephaven/web-client-ui/issues/1085)

### Features

- isConfirmDangerProp ([#1110](https://github.com/deephaven/web-client-ui/issues/1110)) ([ffb7ada](https://github.com/deephaven/web-client-ui/commit/ffb7ada4814e03f9c4471e85319a6bb061943363)), closes [#1109](https://github.com/deephaven/web-client-ui/issues/1109)

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

### Features

- Import JS API as a module ([#1084](https://github.com/deephaven/web-client-ui/issues/1084)) ([9aab657](https://github.com/deephaven/web-client-ui/commit/9aab657ca674e404db6d3cf9b9c663627d635c2c)), closes [#444](https://github.com/deephaven/web-client-ui/issues/444)

### BREAKING CHANGES

- The JS API packaged as a module is now required for the
  `code-studio`, `embed-grid`, and `embed-chart` applications. Existing
  (Enterprise) applications should be able to use `jsapi-shim` still and
  load the JS API using the old method.

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/components
