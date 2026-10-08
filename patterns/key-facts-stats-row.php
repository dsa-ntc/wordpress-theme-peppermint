<?php
/**
 * Title: Key facts and stats row
 * Slug: peppermint/key-facts-stats-row
 * Categories: text, featured
 * Description: Four editable facts or statistics in a responsive row.
 * Keywords: facts, statistics, numbers, metrics, impact
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-stats","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide peppermint-pattern-stats" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'At a glance', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'The work in numbers.', 'peppermint' ); ?></h2>
		<!-- /wp:heading -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","className":"peppermint-pattern-stats__row","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide peppermint-pattern-stats__row" style="margin-top:var(--wp--preset--spacing--40)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-stat","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|30","bottom":"var:preset|spacing|40","left":"var:preset|spacing|30"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group peppermint-pattern-stat has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--30)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"800","lineHeight":"1"},"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|20"}}},"fontSize":"x-large"} -->
				<p class="has-x-large-font-size" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--20);font-weight:800;line-height:1"><?php esc_html_e( '12', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Active projects', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-stat","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|30","bottom":"var:preset|spacing|40","left":"var:preset|spacing|30"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group peppermint-pattern-stat has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--30)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"800","lineHeight":"1"},"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|20"}}},"fontSize":"x-large"} -->
				<p class="has-x-large-font-size" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--20);font-weight:800;line-height:1"><?php esc_html_e( '8', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Contributing chapters', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-stat","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|30","bottom":"var:preset|spacing|40","left":"var:preset|spacing|30"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group peppermint-pattern-stat has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--30)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"800","lineHeight":"1"},"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|20"}}},"fontSize":"x-large"} -->
				<p class="has-x-large-font-size" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--20);font-weight:800;line-height:1"><?php esc_html_e( '42', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Active contributors', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-stat","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|30","bottom":"var:preset|spacing|40","left":"var:preset|spacing|30"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group peppermint-pattern-stat has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--30)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"800","lineHeight":"1"},"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|20"}}},"fontSize":"x-large"} -->
				<p class="has-x-large-font-size" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--20);font-weight:800;line-height:1"><?php esc_html_e( '100%', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Member-led', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</section>
<!-- /wp:group -->
