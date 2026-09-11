<?php
/**
 * Title: Media and text intro, image left
 * Slug: ntc-block/media-text-intro-image-left
 * Categories: media, banner, featured
 * Description: A balanced page introduction with an image on the left and editable text on the right.
 * Keywords: intro, image, media, two column, page
 * Viewport Width: 1280
 * Block Types: core/post-content, core/media-text
 * Post Types: page
 *
 * @package NTC_Block
 */

?>
<!-- wp:media-text {"align":"wide","mediaWidth":50,"verticalAlignment":"center","className":"ntc-pattern-media-intro ntc-pattern-media-intro--left","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"backgroundColor":"base-2"} -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile is-vertically-aligned-center ntc-pattern-media-intro ntc-pattern-media-intro--left has-base-2-background-color has-background" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Who we are', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":1,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h1 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'People building useful tools together.', 'ntc-block' ); ?></h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2"} -->
		<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Introduce the people, purpose, or project featured on this page in a few direct sentences.', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Learn more', 'ntc-block' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div></div>
<!-- /wp:media-text -->
