<?php
/**
 * Title: Text-only page intro
 * Slug: ntc-block/page-intro
 * Categories: text, banner
 * Description: A spacious page introduction with an eyebrow, heading, and summary.
 * Keywords: intro, introduction, heading, summary, page
 * Viewport Width: 1280
 * Block Types: core/post-content
 * Post Types: page
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"ntc-pattern-page-intro","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.5rem"}}},"layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
<section class="wp-block-group alignwide ntc-pattern-page-intro" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.5rem;padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
	<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'About this work', 'ntc-block' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:heading {"level":1,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"display"} -->
	<h1 class="wp-block-heading has-display-font-size" style="margin-top:0"><?php esc_html_e( 'A clear introduction to the work.', 'ntc-block' ); ?></h1>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"large"} -->
	<p class="has-contrast-2-color has-text-color has-large-font-size"><?php esc_html_e( 'Summarize the purpose of this page, who it serves, and what readers will find below.', 'ntc-block' ); ?></p>
	<!-- /wp:paragraph -->
</section>
<!-- /wp:group -->
