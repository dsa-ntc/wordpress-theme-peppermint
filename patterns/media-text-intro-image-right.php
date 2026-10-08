<?php
/**
 * Title: Media and text intro, image right
 * Slug: peppermint/media-text-intro-image-right
 * Categories: media, banner, featured
 * Description: A balanced page introduction with editable text on the left and an image on the right.
 * Keywords: intro, image, media, two column, page
 * Viewport Width: 1280
 * Block Types: core/post-content, core/media-text
 * Post Types: page
 *
 * @package Peppermint
 */

?>
<!-- wp:media-text {"align":"wide","mediaPosition":"right","mediaWidth":50,"verticalAlignment":"center","className":"peppermint-pattern-media-intro peppermint-pattern-media-intro--right","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"backgroundColor":"base-2"} -->
<div class="wp-block-media-text alignwide has-media-on-the-right is-stacked-on-mobile is-vertically-aligned-center peppermint-pattern-media-intro peppermint-pattern-media-intro--right has-base-2-background-color has-background" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><div class="wp-block-media-text__content">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Get involved', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":1,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h1 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Bring your skills to the movement.', 'peppermint' ); ?></h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2"} -->
		<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Explain how people can contribute, what support is available, and the best first step to take.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Take the first step', 'peppermint' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div><figure class="wp-block-media-text__media"></figure></div>
<!-- /wp:media-text -->
