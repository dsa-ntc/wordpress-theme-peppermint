<?php
/**
 * Title: Footer with columns
 * Slug: peppermint/footer-columns
 * Categories: footer
 * Block Types: core/template-part/footer
 * Description: A two-column footer with the site title and tagline, spots for contact details and social icons, and a full-width spot for a legal notice.
 * Keywords: footer, columns, contact, social, legal, disclaimer
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"align":"full","className":"site-footer","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|40","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40"}}},"backgroundColor":"dsa-black","textColor":"white","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull site-footer has-white-color has-dsa-black-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"align":"wide","layout":{"type":"default"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|40"}}}} -->
		<div class="wp-block-columns">
			<!-- wp:column -->
			<div class="wp-block-column">
				<!-- wp:site-title {"level":0,"style":{"typography":{"fontWeight":"700"}},"fontSize":"large"} /-->
				<!-- wp:site-tagline {"fontSize":"small"} /-->
			</div>
			<!-- /wp:column -->

			<!-- wp:column -->
			<div class="wp-block-column">
				<!-- wp:paragraph {"placeholder":"<?php echo esc_attr__( 'Add contact details', 'peppermint' ); ?>","className":"footer-contact","style":{"typography":{"lineHeight":"1.5"}},"fontSize":"small"} -->
				<p class="footer-contact has-small-font-size" style="line-height:1.5"></p>
				<!-- /wp:paragraph -->
				<!-- wp:social-links {"iconColor":"white","iconColorValue":"#FFFFFF","className":"is-style-logos-only"} -->
				<ul class="wp-block-social-links has-icon-color is-style-logos-only"></ul>
				<!-- /wp:social-links -->
			</div>
			<!-- /wp:column -->
		</div>
		<!-- /wp:columns -->

		<!-- wp:paragraph {"placeholder":"<?php echo esc_attr__( 'Add a legal notice or disclaimer', 'peppermint' ); ?>","className":"footer-legal","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"}}},"fontSize":"x-small"} -->
		<p class="footer-legal has-x-small-font-size" style="margin-top:var(--wp--preset--spacing--40)"></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
