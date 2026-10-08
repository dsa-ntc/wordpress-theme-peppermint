<?php
/**
 * Title: Join steps
 * Slug: peppermint/join-steps
 * Categories: call-to-action, featured
 * Description: Three numbered steps for getting involved, each with a button, followed by a donation band. Steps renumber when they are reordered.
 * Keywords: join, membership, get involved, steps, onboarding, donate
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-join-steps","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"default"}} -->
<section class="wp-block-group alignwide peppermint-pattern-join-steps" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
	<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Get involved', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<!-- wp:columns {"align":"wide","className":"peppermint-steps","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide peppermint-steps" style="margin-top:var(--wp--preset--spacing--40)">
		<!-- wp:column {"className":"peppermint-step"} -->
		<div class="wp-block-column peppermint-step">
			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Become a member', 'peppermint' ); ?></h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Members vote, attend members-only meetings, and help set priorities.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Join', 'peppermint' ); ?></a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"peppermint-step"} -->
		<div class="wp-block-column peppermint-step">
			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Come to a meeting', 'peppermint' ); ?></h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Meet other members, hear what is happening, and ask questions.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button {"className":"is-style-outline"} -->
				<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'See events', 'peppermint' ); ?></a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"className":"peppermint-step"} -->
		<div class="wp-block-column peppermint-step">
			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
			<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Find your group', 'peppermint' ); ?></h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Choose a committee or working group that fits your interests and time.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button {"className":"is-style-outline"} -->
				<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Browse groups', 'peppermint' ); ?></a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:group {"align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|50"},"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"backgroundColor":"accent","textColor":"accent-contrast","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group alignwide has-accent-contrast-color has-accent-background-color has-text-color has-background" style="margin-top:var(--wp--preset--spacing--50);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
		<!-- wp:paragraph {"fontSize":"large"} -->
		<p class="has-large-font-size"><?php esc_html_e( 'Donations fund local organizing.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
			<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Donate', 'peppermint' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</section>
<!-- /wp:group -->
