<?php
/**
 * Title: Call to action
 * Slug: peppermint/call-to-action
 * Categories: call-to-action, banner
 * Description: A high-contrast call to action with primary and secondary actions.
 * Keywords: call to action, cta, buttons, signup, contact
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-cta","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|40","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40"}}},"backgroundColor":"accent","textColor":"accent-contrast","layout":{"type":"constrained","contentSize":"60rem"}} -->
<section class="wp-block-group alignwide peppermint-pattern-cta has-accent-contrast-color has-accent-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:paragraph {"align":"center","className":"eyebrow"} -->
	<p class="has-text-align-center eyebrow"><?php esc_html_e( 'Take action', 'peppermint' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:heading {"textAlign":"center","level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"display"} -->
	<h2 class="wp-block-heading has-text-align-center has-display-font-size" style="margin-top:0"><?php esc_html_e( 'Help move this work forward.', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center","fontSize":"large"} -->
	<p class="has-text-align-center has-large-font-size"><?php esc_html_e( 'Give readers a concise reason to act now and explain what their participation makes possible.', 'peppermint' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center","flexWrap":"wrap"}} -->
	<div class="wp-block-buttons">
		<!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
		<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Get involved', 'peppermint' ); ?></a></div>
		<!-- /wp:button -->

		<!-- wp:button {"textColor":"accent-contrast","className":"is-style-outline","style":{"border":{"color":"var:preset|color|accent-contrast","width":"2px"}}} -->
		<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-accent-contrast-color has-text-color has-border-color wp-element-button" style="border-color:var(--wp--preset--color--accent-contrast);border-width:2px"><?php esc_html_e( 'Learn about the work', 'peppermint' ); ?></a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</section>
<!-- /wp:group -->
