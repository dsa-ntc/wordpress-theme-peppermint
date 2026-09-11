<?php
/**
 * Title: Technical landing hero
 * Slug: ntc-block/landing-hero
 * Categories: featured, banner
 * Description: A full-width filtered image introduction with constrained text and a single call to action.
 * Keywords: intro, hero, landing, project, image, cover, call to action
 * Viewport Width: 1280
 * Block Types: core/post-content
 * Post Types: page
 *
 * @package NTC_Block
 */

?>
<!-- wp:cover {"dimRatio":100,"overlayColor":"dsa-red","isDark":true,"align":"full","className":"ntc-image-hero","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","right":"var:preset|spacing|40","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40"}}}} -->
<div class="wp-block-cover alignfull ntc-image-hero" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--40)"><span aria-hidden="true" class="wp-block-cover__background has-dsa-red-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container">
	<!-- wp:group {"align":"wide","className":"ntc-image-hero__layout","layout":{"type":"default"}} -->
	<div class="wp-block-group alignwide ntc-image-hero__layout">
		<!-- wp:group {"className":"ntc-image-hero__content","textColor":"white","layout":{"type":"constrained","contentSize":"64rem","justifyContent":"left"}} -->
		<div class="wp-block-group ntc-image-hero__content has-white-color has-text-color">
			<!-- wp:heading {"level":1,"textColor":"white","fontSize":"display"} -->
			<h1 class="wp-block-heading has-white-color has-text-color has-display-font-size"><?php esc_html_e( 'A clear statement of what this project does.', 'ntc-block' ); ?></h1>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"textColor":"white","fontSize":"large"} -->
			<p class="has-white-color has-text-color has-large-font-size"><?php esc_html_e( 'Add a short explanation of who the work serves, what changed, and where members can learn more.', 'ntc-block' ); ?></p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"white","textColor":"dsa-black","style":{"border":{"color":"#FFFFFF","width":"2px"}}} --><div class="wp-block-button"><a class="wp-block-button__link has-dsa-black-color has-white-background-color has-text-color has-background has-border-color wp-element-button" style="border-color:#FFFFFF;border-width:2px"><?php esc_html_e( 'Explore the project', 'ntc-block' ); ?></a></div><!-- /wp:button --></div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->
</div></div>
<!-- /wp:cover -->
