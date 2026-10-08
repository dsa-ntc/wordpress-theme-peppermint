<?php
/**
 * Title: Project skills board
 * Slug: peppermint/project-skills-board
 * Categories: featured, call-to-action
 * Description: A project introduction with three linked skill notes. Choose Corkboard, DSA Noticeboard, or Windows 95 Desktop on the outer Group and replace the starter links.
 * Keywords: project, skills, recruitment, volunteers, sticky notes
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-skills-board is-style-peppermint-board-dsa","layout":{"type":"default"}} -->
<section class="wp-block-group alignwide peppermint-skills-board is-style-peppermint-board-dsa">
	<!-- wp:heading {"fontSize":"x-large"} -->
	<h2 class="wp-block-heading has-x-large-font-size"><?php esc_html_e( 'WordPress commission', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'Help us build accessible, reliable websites for chapters and national projects.', 'peppermint' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'We’re looking for:', 'peppermint' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:group {"className":"peppermint-skills-board__notes","layout":{"type":"default"}} -->
	<div class="wp-block-group peppermint-skills-board__notes">
		<!-- wp:group {"className":"peppermint-skills-board__note","layout":{"type":"default"}} -->
		<div class="wp-block-group peppermint-skills-board__note">
			<!-- wp:heading {"level":3,"className":"peppermint-skills-board__title","fontSize":"large"} -->
			<h3 class="wp-block-heading peppermint-skills-board__title has-large-font-size"><a href="#"><?php esc_html_e( 'PHP developers', 'peppermint' ); ?></a></h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Build useful WordPress features, review code, and make our tools easier to maintain.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->
		<!-- wp:group {"className":"peppermint-skills-board__note","layout":{"type":"default"}} -->
		<div class="wp-block-group peppermint-skills-board__note">
			<!-- wp:heading {"level":3,"className":"peppermint-skills-board__title","fontSize":"large"} -->
			<h3 class="wp-block-heading peppermint-skills-board__title has-large-font-size"><a href="#"><?php esc_html_e( 'Linux administrators', 'peppermint' ); ?></a></h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Keep hosting dependable. Help with updates, backups, monitoring, and documentation.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->
		<!-- wp:group {"className":"peppermint-skills-board__note","layout":{"type":"default"}} -->
		<div class="wp-block-group peppermint-skills-board__note">
			<!-- wp:heading {"level":3,"className":"peppermint-skills-board__title","fontSize":"large"} -->
			<h3 class="wp-block-heading peppermint-skills-board__title has-large-font-size"><a href="#"><?php esc_html_e( 'Project managers', 'peppermint' ); ?></a></h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Turn ideas into manageable next steps and help contributors find a place to start.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->
	<!-- wp:group {"className":"peppermint-skills-board__taskbar","layout":{"type":"default"}} -->
	<div class="wp-block-group peppermint-skills-board__taskbar">
		<!-- wp:paragraph {"className":"peppermint-skills-board__start"} -->
		<p class="peppermint-skills-board__start"><span class="wp-exclude-emoji" aria-hidden="true">🌹</span> <?php esc_html_e( 'Organize', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</section>
<!-- /wp:group -->
