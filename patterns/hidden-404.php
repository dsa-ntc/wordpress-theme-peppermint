<?php
/**
 * Title: 404 content
 * Slug: ntc-block/hidden-404
 * Categories: hidden
 * Inserter: no
 * Template Types: 404
 *
 * @package NTC_Block
 */

?>
<!-- wp:paragraph {"className":"eyebrow"} --><p class="eyebrow"><?php esc_html_e( 'Error 404', 'ntc-block' ); ?></p><!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"fontSize":"display"} --><h1 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'That route does not exist.', 'ntc-block' ); ?></h1><!-- /wp:heading -->
<!-- wp:paragraph --><p><?php esc_html_e( 'Try a search or return to the home page.', 'ntc-block' ); ?></p><!-- /wp:paragraph -->
<!-- wp:search {"showLabel":false,"buttonUseIcon":true} /-->
<!-- wp:buttons -->
<div class="wp-block-buttons">
	<!-- wp:button {"className":"is-style-outline"} -->
	<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html_x( 'Return home', 'home link label', 'ntc-block' ); ?></a></div>
	<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
