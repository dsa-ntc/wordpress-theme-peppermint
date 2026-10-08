<?php
/**
 * Title: Two-column project grid
 * Slug: peppermint/project-grid
 * Categories: posts
 * Description: A two-column grid of project posts with featured images.
 * Keywords: projects, posts, query, grid, cards
 * Viewport Width: 1280
 * Block Types: core/query
 * Post Types: page
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"align":"wide","className":"project-grid","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide project-grid">
	<!-- wp:heading {"fontSize":"display"} --><h2 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'Projects', 'peppermint' ); ?></h2><!-- /wp:heading -->
	<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"align":"wide"} -->
	<div class="wp-block-query alignwide">
		<!-- wp:post-template {"layout":{"type":"grid","columnCount":2}} -->
			<!-- wp:group {"className":"project-card__media","layout":{"type":"default"}} -->
			<div class="wp-block-group project-card__media">
				<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","sizeSlug":"large"} /-->
			</div>
			<!-- /wp:group -->
			<!-- wp:post-terms {"term":"category","className":"project-kicker"} /-->
			<!-- wp:post-title {"isLink":true,"fontSize":"card-title"} /-->
			<!-- wp:post-excerpt {"moreText":"<?php echo esc_attr_x( 'Read more', 'project excerpt link', 'peppermint' ); ?>","excerptLength":28} /-->
		<!-- /wp:post-template -->
	</div>
	<!-- /wp:query -->
</div>
<!-- /wp:group -->
