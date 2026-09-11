<?php
/**
 * Title: Contact and details section
 * Slug: ntc-block/contact-details
 * Categories: contact, text
 * Description: A contact section with editable email, phone, location, and availability details.
 * Keywords: contact, email, phone, address, hours, details
 * Viewport Width: 1280
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"ntc-pattern-contact-details","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}},"border":{"top":{"color":"var:preset|color|line","width":"1px"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide ntc-pattern-contact-details" style="border-top-color:var(--wp--preset--color--line);border-top-width:1px;padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Contact', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Talk with the team.', 'ntc-block' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"large"} -->
		<p class="has-contrast-2-color has-text-color has-large-font-size"><?php esc_html_e( 'Share the best ways to reach your team and set clear expectations for a response.', 'ntc-block' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide" style="margin-top:var(--wp--preset--spacing--40)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ntc-pattern-detail-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group ntc-pattern-detail-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Write or call', 'ntc-block' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Email', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'hello@example.org', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Phone', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( '(000) 000-0000', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ntc-pattern-detail-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group ntc-pattern-detail-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Visit', 'ntc-block' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Location', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( '123 Solidarity Street', 'ntc-block' ); ?><br><?php esc_html_e( 'Your City, ST 00000', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Add accessibility, transit, or appointment information here.', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"ntc-pattern-detail-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group ntc-pattern-detail-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Availability', 'ntc-block' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Hours', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Monday–Friday, 9:00 a.m.–5:00 p.m.', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"contrast-2"} -->
				<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Messages are usually answered within two working days.', 'ntc-block' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</section>
<!-- /wp:group -->
