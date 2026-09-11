<?php
/**
 * Title: Subcommittee image tiles
 * Slug: ntc-block/subcommittee-tiles
 * Categories: featured, banner
 * Description: Three editable red image tiles for the NTC subcommittees.
 * Keywords: committees, teams, cards, cover, image
 * Viewport Width: 1280
 * Post Types: page
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"align":"wide","className":"subcommittee-section","style":{"spacing":{"margin":{"top":"var:preset|spacing|60"},"padding":{"top":"var:preset|spacing|50"}},"border":{"top":{"color":"var:preset|color|contrast","width":"2px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide subcommittee-section" style="border-top-color:var(--wp--preset--color--contrast);border-top-width:2px;margin-top:var(--wp--preset--spacing--60);padding-top:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"bottom"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:heading {"fontSize":"page-title"} -->
		<h2 class="wp-block-heading has-page-title-font-size"><?php esc_html_e( 'Subcommittees', 'ntc-block' ); ?></h2>
		<!-- /wp:heading -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","className":"subcommittee-grid","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide subcommittee-grid">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:cover {"dimRatio":100,"overlayColor":"dsa-red","minHeight":400,"minHeightUnit":"px","contentPosition":"bottom left","isDark":true,"className":"subcommittee-tile is-style-ntc-red-tile"} -->
			<div class="wp-block-cover has-custom-content-position is-position-bottom-left subcommittee-tile is-style-ntc-red-tile" style="min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-dsa-red-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container">
				<!-- wp:image {"width":"52px","height":"52px","scale":"contain","sizeSlug":"full","linkDestination":"none","className":"subcommittee-tile__icon"} -->
				<figure class="wp-block-image size-full is-resized subcommittee-tile__icon"><img alt="" style="object-fit:contain;width:52px;height:52px"/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3,"className":"subcommittee-tile__title","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"0"}},"typography":{"lineHeight":"0.98"}},"textColor":"white","fontSize":"x-large"} -->
				<h3 class="wp-block-heading subcommittee-tile__title has-white-color has-text-color has-x-large-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:0;line-height:0.98"><a href="<?php echo esc_url( home_url( '/engagement/' ) ); ?>"><?php esc_html_e( 'Engagement', 'ntc-block' ); ?></a></h3>
				<!-- /wp:heading -->
			</div></div>
			<!-- /wp:cover -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:cover {"dimRatio":100,"overlayColor":"dsa-red","minHeight":400,"minHeightUnit":"px","contentPosition":"bottom left","isDark":true,"className":"subcommittee-tile is-style-ntc-retro"} -->
			<div class="wp-block-cover has-custom-content-position is-position-bottom-left subcommittee-tile is-style-ntc-retro" style="min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-dsa-red-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container">
				<!-- wp:image {"width":"52px","height":"52px","scale":"contain","sizeSlug":"full","linkDestination":"none","className":"subcommittee-tile__icon"} -->
				<figure class="wp-block-image size-full is-resized subcommittee-tile__icon"><img alt="" style="object-fit:contain;width:52px;height:52px"/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3,"className":"subcommittee-tile__title","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"0"}},"typography":{"lineHeight":"0.98"}},"textColor":"white","fontSize":"x-large"} -->
				<h3 class="wp-block-heading subcommittee-tile__title has-white-color has-text-color has-x-large-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:0;line-height:0.98"><a href="<?php echo esc_url( home_url( '/formations/' ) ); ?>"><?php esc_html_e( 'Formations', 'ntc-block' ); ?></a></h3>
				<!-- /wp:heading -->
			</div></div>
			<!-- /wp:cover -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:cover {"dimRatio":100,"overlayColor":"dsa-red","minHeight":400,"minHeightUnit":"px","contentPosition":"bottom left","isDark":true,"className":"subcommittee-tile is-style-ntc-win95"} -->
			<div class="wp-block-cover has-custom-content-position is-position-bottom-left subcommittee-tile is-style-ntc-win95" style="min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-dsa-red-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container">
				<!-- wp:image {"width":"52px","height":"52px","scale":"contain","sizeSlug":"full","linkDestination":"none","className":"subcommittee-tile__icon"} -->
				<figure class="wp-block-image size-full is-resized subcommittee-tile__icon"><img alt="" style="object-fit:contain;width:52px;height:52px"/></figure>
				<!-- /wp:image -->
				<!-- wp:heading {"level":3,"className":"subcommittee-tile__title","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"0"}},"typography":{"lineHeight":"0.98"}},"textColor":"white","fontSize":"x-large"} -->
				<h3 class="wp-block-heading subcommittee-tile__title has-white-color has-text-color has-x-large-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:0;line-height:0.98"><a href="<?php echo esc_url( home_url( '/member-services/' ) ); ?>"><?php esc_html_e( 'Member Services', 'ntc-block' ); ?></a></h3>
				<!-- /wp:heading -->
			</div></div>
			<!-- /wp:cover -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
