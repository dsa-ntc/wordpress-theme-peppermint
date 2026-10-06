=== NTC Block ===
Contributors: dsa-national-tech-committee
Requires at least: 7.1
Tested up to: 7.1
Requires PHP: 8.5
Stable tag: 1.2.0

A block theme for the DSA National Tech Committee.

== Description ==

Peppermint uses WordPress blocks, patterns, templates, and Global Styles.
It includes project grids, image cards, pullquotes, recruitment boards,
and a light/dark toggle. Edit content with native block controls.

The site follows each visitor's system appearance, or the System, Light, or
Dark style chosen in Global Styles. The header toggle lets visitors switch
for their browser; switching back to the automatic appearance resumes following it.
Without JavaScript, the site's CSS appearance still works.
The toggle in the editor is a preview.

The theme bundles no font files, photographs, or decorative icon files.
Choose images in the Media Library and optional fonts in the Font Library.
Empty media patterns remain editable. The default font stack is Arial,
Helvetica, sans-serif. Small inline SVG and CSS decorations are part of the code.

== Installation ==

1. Install the theme in wp-content/themes/wordpress-theme-peppermint.
2. Activate NTC Block in Appearance > Themes.
3. Assign a static homepage in Settings > Reading. Assign a posts page if needed.
4. Open Appearance > Editor to edit templates, navigation, and Global Styles.
5. Insert patterns into pages and replace starter text, links, and media.

The Front Page template displays the assigned page content. Using latest posts
as the homepage requires changing that template.

Keep the installed directory name. Renaming an existing theme requires migrating
its saved styles, template associations, and settings. Back up the site first.

== Editing ==

Edit page content in the page editor. Edit headers, footers, and templates in
Appearance > Editor. Inserted patterns are independent block copies; theme
updates do not replace them. Saved templates and Global Styles can override files.

Text uses seven size presets, from Extra Small to Display. Editors choose a
preset instead of typing a size; adjust the scale in Styles > Typography.

Use a Cover's Styles panel for red tiles or window frames. A Cover window
frame shows the Cover's first heading in its title bar. A long heading ends
with an ellipsis there. Pullquotes offer Simple Surface and window frames.
The Project skills board pattern offers Corkboard, DSA Noticeboard, and
Windows 95 Desktop styles on its outer Group.
Replace every starter destination before publishing.

For an Image or Post Featured Image, choose Contained artwork (no upscale)
to show the complete image. Transparent images may need a Group background.

== Compatibility ==

Divi is not required. Installing this theme does not convert Divi content.
Rebuild and test that content as native blocks on an isolated copy.

Theme strings use the ntc-block translation domain and the included POT catalog.
Translate site content and navigation through WordPress or a multilingual plugin.
WPML, Polylang, and TranslatePress require separate integration testing.

This theme is distributed through GitHub. Its custom Appearance Switcher block
must be moved to a plugin or replaced before a WordPress.org theme submission.
The package does not include a theme thumbnail.

== Development ==

See AGENTS.md in the source repository for test commands and contribution guidance.
PHP checks, block validation, and browser tests cover different contracts.
CI does not replace a live Site Editor review or testing on supported browsers.
Report security issues privately to the repository maintainers.

Build installation archives using .distignore. The archive must contain one
wordpress-theme-peppermint directory. GitHub's generated source archives use a
different directory name and include development files; do not install them directly.

== Changelog ==

= 1.2.0 (unreleased) =
* Add editable project cards, pullquote frames, recruitment boards, and a light/dark toggle.
* Show each Cover window frame's first heading in its title bar.
* Use site-owned media and fonts with empty media and system-font fallbacks.
* Add static, accessibility, responsive, and WordPress block validation checks.
* Prepare GitHub CI, lock development dependencies, and align PHP with WordPress standards.
* Replace agent reports with concise contributor guidance.
