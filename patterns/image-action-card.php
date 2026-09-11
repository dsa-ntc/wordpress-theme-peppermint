<?php
/**
 * Title: Image feature with button
 * Slug: ntc-block/image-action-card
 * Categories: featured, call-to-action
 * Description: A clean image card with editable text and a separate action button.
 * Keywords: card, image, button, project, feature
 * Viewport Width: 620
 * Block Types: core/group
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"className":"is-style-ntc-media-action-card","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-ntc-media-action-card">
	<!-- wp:image {"aspectRatio":"16/9","scale":"cover","sizeSlug":"large","linkDestination":"none"} -->
	<figure class="wp-block-image size-large"><img alt="" style="aspect-ratio:16/9;object-fit:cover"/></figure>
	<!-- /wp:image -->

	<!-- wp:group {"className":"ntc-media-action-card__body","layout":{"type":"flex","orientation":"vertical"}} -->
	<div class="wp-block-group ntc-media-action-card__body">
		<!-- wp:heading {"level":3,"fontSize":"x-large"} -->
		<h3 class="wp-block-heading has-x-large-font-size"><?php esc_html_e( 'Feature title', 'ntc-block' ); ?></h3>
		<!-- /wp:heading -->

		<!-- wp:paragraph -->
		<p><?php esc_html_e( 'Add a short description that explains the project, resource, or next step.', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Learn more', 'ntc-block' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
