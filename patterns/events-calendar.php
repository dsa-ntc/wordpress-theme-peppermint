<?php
/**
 * Title: Events and calendar
 * Slug: peppermint/events-calendar
 * Categories: featured, text
 * Description: Upcoming meeting cards with RSVP buttons, followed by an embedded calendar, such as Google Calendar or Action Network.
 * Keywords: events, calendar, meetings, rsvp, google calendar, action network, embed
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-events","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"default"}} -->
<section class="wp-block-group alignwide peppermint-pattern-events" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
	<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Upcoming meetings', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide" style="margin-top:var(--wp--preset--spacing--40)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-event-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|20"},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top"}} -->
			<div class="wp-block-group peppermint-pattern-event-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700"}},"textColor":"accent"} -->
				<p class="has-accent-color has-text-color" style="font-weight:700"><?php esc_html_e( 'Date and time', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Meeting name', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Location or video link, and who should come.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:buttons {"style":{"spacing":{"margin":{"top":"auto"}}}} -->
				<div class="wp-block-buttons" style="margin-top:auto">
					<!-- wp:button -->
					<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'RSVP', 'peppermint' ); ?></a></div>
					<!-- /wp:button -->
				</div>
				<!-- /wp:buttons -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-event-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|20"},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top"}} -->
			<div class="wp-block-group peppermint-pattern-event-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700"}},"textColor":"accent"} -->
				<p class="has-accent-color has-text-color" style="font-weight:700"><?php esc_html_e( 'Date and time', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Meeting name', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Location or video link, and who should come.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:buttons {"style":{"spacing":{"margin":{"top":"auto"}}}} -->
				<div class="wp-block-buttons" style="margin-top:auto">
					<!-- wp:button -->
					<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'RSVP', 'peppermint' ); ?></a></div>
					<!-- /wp:button -->
				</div>
				<!-- /wp:buttons -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"peppermint-pattern-event-card","style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"},"blockGap":"var:preset|spacing|20"},"border":{"color":"var:preset|color|line","width":"1px"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top"}} -->
			<div class="wp-block-group peppermint-pattern-event-card has-border-color has-base-2-background-color has-background" style="border-color:var(--wp--preset--color--line);border-width:1px;min-height:100%;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"style":{"typography":{"fontWeight":"700"}},"textColor":"accent"} -->
				<p class="has-accent-color has-text-color" style="font-weight:700"><?php esc_html_e( 'Date and time', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Meeting name', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Location or video link, and who should come.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:buttons {"style":{"spacing":{"margin":{"top":"auto"}}}} -->
				<div class="wp-block-buttons" style="margin-top:auto">
					<!-- wp:button -->
					<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'RSVP', 'peppermint' ); ?></a></div>
					<!-- /wp:button -->
				</div>
				<!-- /wp:buttons -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"var:preset|spacing|50"}}},"fontSize":"x-large"} -->
	<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:var(--wp--preset--spacing--50)"><?php esc_html_e( 'Calendar', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<?php // Editors paste a calendar's embed code, such as a Google Calendar iframe, into this Custom HTML block. ?>
	<!-- wp:group {"align":"wide","className":"peppermint-responsive-embed","layout":{"type":"default"}} -->
	<div class="wp-block-group alignwide peppermint-responsive-embed"><!-- wp:html /--></div>
	<!-- /wp:group -->

	<!-- wp:buttons {"style":{"spacing":{"margin":{"top":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--30)">
		<!-- wp:button {"className":"is-style-outline"} -->
		<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Open the full calendar', 'peppermint' ); ?></a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</section>
<!-- /wp:group -->
