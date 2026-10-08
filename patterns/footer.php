<?php
/**
 * Title: Site footer
 * Slug: peppermint/footer
 * Categories: footer
 * Inserter: no
 * Block Types: core/template-part
 * Template Types: footer
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"align":"full","className":"site-footer","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|40","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40"}}},"backgroundColor":"dsa-black","textColor":"white","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull site-footer has-white-color has-dsa-black-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:site-title {"level":0,"style":{"typography":{"fontWeight":"700"}},"fontSize":"small"} /-->
		<!-- wp:paragraph {"placeholder":"<?php echo esc_attr__( 'Add contact details', 'peppermint' ); ?>","className":"footer-contact","style":{"typography":{"lineHeight":"1.5"}},"fontSize":"small"} -->
		<p class="footer-contact has-small-font-size" style="line-height:1.5"></p>
		<!-- /wp:paragraph -->
		<!-- wp:social-links {"iconColor":"white","iconColorValue":"#FFFFFF","className":"is-style-logos-only"} -->
		<ul class="wp-block-social-links has-icon-color is-style-logos-only"></ul>
		<!-- /wp:social-links -->
		<!-- wp:paragraph {"placeholder":"<?php echo esc_attr__( 'Add a legal notice or disclaimer', 'peppermint' ); ?>","className":"footer-legal","fontSize":"x-small"} -->
		<p class="footer-legal has-x-small-font-size"></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
