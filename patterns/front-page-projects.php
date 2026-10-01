<?php
/**
 * Title: Front page projects
 * Slug: ntc-block/front-page-projects
 * Categories: posts
 * Inserter: no
 * Template Types: front-page
 *
 * @package NTC_Block
 */

?>
<!-- wp:group {"align":"wide","className":"project-grid","style":{"spacing":{"margin":{"top":"var:preset|spacing|60"},"padding":{"top":"var:preset|spacing|50"}},"border":{"top":{"color":"var:preset|color|contrast","width":"2px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide project-grid" style="border-top-color:var(--wp--preset--color--contrast);border-top-width:2px;margin-top:var(--wp--preset--spacing--60);padding-top:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"bottom"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:heading {"level":2,"fontSize":"display"} -->
		<h2 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'Projects & field notes', 'ntc-block' ); ?></h2>
		<!-- /wp:heading -->
	</div>
	<!-- /wp:group -->

	<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"align":"wide"} -->
	<div class="wp-block-query alignwide">
		<!-- wp:post-template {"style":{"spacing":{"blockGap":"var:preset|spacing|50"}},"layout":{"type":"grid","columnCount":2}} -->
			<!-- wp:group {"className":"project-card__media","layout":{"type":"default"}} -->
			<div class="wp-block-group project-card__media">
				<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","sizeSlug":"large"} /-->
			</div>
			<!-- /wp:group -->
			<!-- wp:post-terms {"term":"category","className":"project-kicker"} /-->
			<!-- wp:post-title {"isLink":true,"fontSize":"card-title"} /-->
			<!-- wp:post-excerpt {"moreText":"<?php echo esc_attr_x( 'Read project note', 'project excerpt link', 'ntc-block' ); ?>","excerptLength":28} /-->
			<!-- wp:post-date {"className":"post-meta"} /-->
		<!-- /wp:post-template -->
		<!-- wp:query-no-results -->
			<!-- wp:pattern {"slug":"ntc-block/no-results"} /-->
		<!-- /wp:query-no-results -->
		<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"space-between"}} -->
			<!-- wp:query-pagination-previous /-->
			<!-- wp:query-pagination-numbers /-->
			<!-- wp:query-pagination-next /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:query -->
</div>
<!-- /wp:group -->
