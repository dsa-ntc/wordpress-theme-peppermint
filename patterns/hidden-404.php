<?php
/**
 * Title: 404 content
 * Slug: peppermint/hidden-404
 * Categories: hidden
 * Inserter: no
 * Template Types: 404
 *
 * @package Peppermint
 */

?>
<!-- wp:paragraph {"className":"eyebrow"} --><p class="eyebrow"><?php esc_html_e( 'Error 404', 'peppermint' ); ?></p><!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"fontSize":"display"} --><h1 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'That route does not exist.', 'peppermint' ); ?></h1><!-- /wp:heading -->
<!-- wp:paragraph --><p><?php esc_html_e( 'Try a search or return to the home page.', 'peppermint' ); ?></p><!-- /wp:paragraph -->
<!-- wp:search {"showLabel":false,"buttonUseIcon":true} /-->
<!-- wp:buttons -->
<div class="wp-block-buttons">
	<!-- wp:button {"className":"is-style-outline"} -->
	<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html_x( 'Return home', 'home link label', 'peppermint' ); ?></a></div>
	<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
