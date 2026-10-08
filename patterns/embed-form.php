<?php
/**
 * Title: Embedded form
 * Slug: peppermint/embed-form
 * Categories: call-to-action, featured
 * Description: A framed section for an embedded signup form, petition, or donation form, such as Action Network.
 * Keywords: form, embed, signup, petition, newsletter, action network, donate
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-embed-form","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained","contentSize":"44rem"}} -->
<section class="wp-block-group alignwide peppermint-pattern-embed-form" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
	<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Stay in touch', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"large"} -->
	<p class="has-contrast-2-color has-text-color has-large-font-size"><?php esc_html_e( 'Sign up to hear about meetings, actions, and news.', 'peppermint' ); ?></p>
	<!-- /wp:paragraph -->

	<?php // Editors paste the form's embed code, such as an Action Network widget, into this Custom HTML block. ?>
	<!-- wp:group {"className":"peppermint-embed-frame","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
	<div class="wp-block-group peppermint-embed-frame has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:html /--></div>
	<!-- /wp:group -->
</section>
<!-- /wp:group -->
