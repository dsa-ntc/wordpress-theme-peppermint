<?php
/**
 * Title: Site footer
 * Slug: ntc-block/footer
 * Categories: footer
 * Inserter: no
 * Block Types: core/template-part
 * Template Types: footer
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"align":"full","className":"site-footer","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|40","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40"}}},"backgroundColor":"dsa-black","textColor":"white","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull site-footer has-white-color has-dsa-black-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"footer-contact","style":{"spacing":{"margin":{"top":"0","bottom":"0"}},"typography":{"lineHeight":"1.5"}},"fontSize":"small"} -->
		<p class="footer-contact has-small-font-size" style="margin-top:0;margin-bottom:0;line-height:1.5"><?php esc_html_e( 'Contact us with any questions, comments or concerns at ntc@dsacommittees.org.', 'ntc-block' ); ?><br><span class="footer-fingerprint" dir="ltr"><?php echo esc_html( 'openpgp4fpr:' ) . '<wbr>' . implode( '<wbr>', array_map( 'esc_html', str_split( 'FBCDCC2F20A31C717F8EF5324C1D612B9C3E2AE8', 4 ) ) ); ?></span></p>
		<!-- /wp:paragraph -->
		<!-- wp:social-links {"iconColor":"white","iconColorValue":"#FFFFFF","className":"is-style-logos-only","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"0"}}}} -->
		<ul class="wp-block-social-links has-icon-color is-style-logos-only" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:0"><!-- wp:social-link {"url":"https://mastodon.social/@dsa_tech","service":"mastodon","rel":"me"} /--></ul>
		<!-- /wp:social-links -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
