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

## Action Network forms

1. In Action Network's embed options, choose the layout-only styles. The embed code then loads `style-embed-whitelabel-v3.css`.
1. Paste the embed code into a Custom HTML block. The Embedded form pattern has one.

Peppermint styles the form with the site's fonts, colors, and heading, link, and button styles from Global Styles, and restores visible keyboard focus. Action Network keeps the field layout and stacks the fields on narrow screens. With Action Network's full stylesheet, its own fonts and colors take precedence.

## Paper styles

Group, Cover, and Columns blocks have Paper, Crumpled paper, and Paper, torn edge styles. Headings have a Torn paper strip style, and Buttons have a Torn paper style. The textures are printed over the block's own colors, so they work with any palette. Keep at least 2.5rem of bottom padding on a block with a torn edge.

### Texture credits

- `assets/textures/paper-sheet.jpg` is cropped and converted to grayscale from "Torn Ripped Wrinkled Damaged Paper Free High Resolution Texture" by D Sharon Pruitt (Pink Sherbet Photography), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Torn_Ripped_Wrinkled_Damaged_Paper_Free_High_Resolution_Texture_Creative_Commons_(8077074905).jpg).
- `assets/textures/paper-crumple.jpg` and `paper-crumple-heavy.jpg` are made from TextureCan's Paper 0022 and Paper 0005 ([CC0](https://www.texturecan.com/terms/)).

## Development

This theme is primarily made with AI code generation and tested locally with LocalWP. Pull requests are welcome. See AGENTS.md for the checks to run before opening a pull request.
