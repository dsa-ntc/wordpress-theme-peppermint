# Peppermint for WordPress

A basic block theme from the DSA National Tech Committee.
See it live on [tech.dsausa.org](https://tech.dsausa.org)

Peppermint uses WordPress blocks, patterns, templates, and Global Styles. It should require very few additional plugins to use for most use cases.

The site follows each visitor's light or dark system setting, and the header toggle lets visitors switch. Without JavaScript, the automatic setting still works.

Automated accessibility checks run on every change, but Peppermint hasn't had a full manual audit. It aims to meet the basics: a clear heading structure, labeled controls, and minimum contrast.

The theme bundles no font files, photographs, or decorative icon files.
Empty media patterns remain editable. The default font stack is Arial, Helvetica, sans-serif. Small inline SVG and CSS decorations are part of the code.

## Installation

1. Download the zip from the releases tab
1. Install in Appearance > Themes > Add New Theme > Upload Theme
1. Activate the theme.
1. Assign a static homepage in Settings > Reading. Assign a posts page if needed.
1. Open Appearance > Editor to edit templates, navigation, and Global Styles.
1. Insert patterns into pages and replace starter text, links, and media.

The Front Page template displays the assigned page content. Using latest posts
as the homepage requires changing that template.

## Development

This theme is primarily made with AI code generation and tested locally with LocalWP. Pull requests are welcome. See AGENTS.md for the checks to run before opening a pull request.
