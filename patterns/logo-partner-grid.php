<?php
/**
 * Title: Logo and partner grid
 * Slug: peppermint/logo-partner-grid
 * Categories: gallery, about
 * Description: A six-item partner grid with accessible text placeholders for logos or organization names.
 * Keywords: logos, partners, supporters, organizations, grid
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-partner-grid","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide peppermint-pattern-partner-grid" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'In partnership', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Organizations working alongside us.', 'peppermint' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2"} -->
		<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Replace each name with a partner logo or keep the text treatment for a simple, accessible directory.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|30"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide" style="margin-top:var(--wp--preset--spacing--40);margin-bottom:var(--wp--preset--spacing--30)">
		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner one', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner two', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner three', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner four', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner five', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:group {"className":"peppermint-pattern-partner-grid__item","style":{"dimensions":{"minHeight":"7rem"},"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
		<div class="wp-block-group peppermint-pattern-partner-grid__item has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:7rem;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontWeight":"800","letterSpacing":"0.04em","textTransform":"uppercase"}},"fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size" style="font-weight:800;letter-spacing:0.04em;text-transform:uppercase"><?php esc_html_e( 'Partner six', 'peppermint' ); ?></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group --></div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</section>
<!-- /wp:group -->
