<?php
/**
 * Title: Featured project
 * Slug: ntc-block/featured-project
 * Categories: featured, portfolio, media
 * Description: An image-led featured project with a summary, key detail, and action.
 * Keywords: featured, project, case study, image, spotlight
 * Viewport Width: 1280
 * Block Types: core/media-text
 *
 * @package NTC_Block
 */

?>
<!-- wp:media-text {"align":"wide","mediaPosition":"right","mediaWidth":55,"verticalAlignment":"center","className":"ntc-pattern-featured-project","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.5rem"}}},"backgroundColor":"base-2"} -->
<div class="wp-block-media-text alignwide has-media-on-the-right is-stacked-on-mobile is-vertically-aligned-center ntc-pattern-featured-project has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.5rem;grid-template-columns:auto 55%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><div class="wp-block-media-text__content">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Featured project', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Member support without the paperwork maze.', 'ntc-block' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2"} -->
		<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Show what the project does, who built it, and how it helps members organize more effectively.', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"className":"eyebrow"} -->
		<p class="eyebrow"><?php esc_html_e( 'Status: active development', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'View project', 'ntc-block' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div><figure class="wp-block-media-text__media"></figure></div>
<!-- /wp:media-text -->
