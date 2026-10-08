<?php
/**
 * Dependency-free static validation for the NTC Block theme.
 *
 * @package NTC_Block
 */

declare(strict_types=1);

/**
 * Runs the theme's offline validation groups.
 */
final class NTC_Block_Test_Suite {
	/**
	 * Theme root.
	 *
	 * @var string
	 */
	private string $theme_root;

	/**
	 * Whether an absent WordPress parser should fail the run.
	 *
	 * @var bool
	 */
	private bool $require_wordpress;

	/**
	 * Informational notes emitted by the current check.
	 *
	 * @var string[]
	 */
	private array $notes = array();

	/**
	 * Cached JSON documents, keyed by absolute path.
	 *
	 * @var array<string, array<mixed>>
	 */
	private array $json_cache = array();

	/**
	 * Create the suite.
	 *
	 * @param string $theme_root       Absolute theme path.
	 * @param bool   $require_wordpress Fail when WordPress core is unavailable.
	 */
	private function __construct( string $theme_root, bool $require_wordpress ) {
		$this->theme_root       = rtrim( $theme_root, '/\\' );
		$this->require_wordpress = $require_wordpress;
	}

	/**
	 * Parse CLI arguments and execute the requested checks.
	 *
	 * @param string[] $argv CLI arguments.
	 * @return int Process exit code.
	 */
	public static function main( array $argv ): int {
		$arguments         = array_slice( $argv, 1 );
		$require_wordpress = in_array( '--require-wordpress', $arguments, true );
		$arguments         = array_values(
			array_filter(
				$arguments,
				static fn( string $argument ): bool => '--require-wordpress' !== $argument
			)
		);

		if ( in_array( '--help', $arguments, true ) || in_array( '-h', $arguments, true ) ) {
			self::print_usage();
			return 0;
		}

		$groups = empty( $arguments ) ? array( 'static' ) : $arguments;
		$valid  = array( 'static', 'syntax', 'json', 'components', 'blocks', 'a11y', 'i18n' );

		foreach ( $groups as $group ) {
			if ( ! in_array( $group, $valid, true ) ) {
				fwrite( STDERR, sprintf( "Unknown test group: %s\n\n", $group ) );
				self::print_usage();
				return 2;
			}
		}

		if ( in_array( 'static', $groups, true ) ) {
			$groups = array( 'syntax', 'json', 'components', 'blocks', 'a11y', 'i18n' );
		}

		$groups = array_values( array_unique( $groups ) );
		$suite  = new self( dirname( __DIR__ ), $require_wordpress );

		return $suite->run( $groups );
	}

	/**
	 * Print command help.
	 *
	 * @return void
	 */
	private static function print_usage(): void {
		echo "Usage: php tests/run.php [static|syntax|json|components|blocks|a11y|i18n] [--require-wordpress]\n";
		echo "With no group, all dependency-free checks run. WordPress block round trips run automatically when core is found.\n";
	}

	/**
	 * Run selected groups and print a compact report.
	 *
	 * @param string[] $groups Check group names.
	 * @return int Process exit code.
	 */
	private function run( array $groups ): int {
		$passed = 0;
		$failed = 0;

		echo "NTC Block validation\n";

		foreach ( $groups as $group ) {
			$this->notes = array();
			$method      = 'check_' . $group;

			try {
				$message = $this->{$method}();
				++$passed;
				echo sprintf( "[PASS] %-10s %s\n", $group, $message );
			} catch ( RuntimeException $error ) {
				++$failed;
				echo sprintf( "[FAIL] %-10s %s\n", $group, $error->getMessage() );
			}

			foreach ( $this->notes as $note ) {
				echo sprintf( "[NOTE] %-10s %s\n", $group, $note );
			}
		}

		echo sprintf( "\n%d passed, %d failed.\n", $passed, $failed );

		return $failed > 0 ? 1 : 0;
	}

	/**
	 * Validate PHP syntax with the running PHP binary.
	 *
	 * @return string Success summary.
	 */
	private function check_syntax(): string {
		$issues    = array();
		$php_files = $this->files_with_extensions( array( 'php' ) );

		if ( ! is_callable( 'proc_open' ) ) {
			throw new RuntimeException( 'proc_open() is unavailable, so php -l could not run.' );
		}

		foreach ( $php_files as $file ) {
			$command = array( PHP_BINARY, '-l', $file );
			$pipes   = array();
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open -- A syntax test must invoke php -l.
			$process = proc_open(
				$command,
				array(
					1 => array( 'pipe', 'w' ),
					2 => array( 'pipe', 'w' ),
				),
				$pipes
			);

			if ( ! is_resource( $process ) ) {
				$issues[] = $this->relative_path( $file ) . ': unable to start php -l';
				continue;
			}

			$stdout = stream_get_contents( $pipes[1] );
			$stderr = stream_get_contents( $pipes[2] );
			fclose( $pipes[1] );
			fclose( $pipes[2] );
			$status = proc_close( $process );

			if ( 0 !== $status ) {
				$output   = trim( (string) $stdout . "\n" . (string) $stderr );
				$issues[] = $this->relative_path( $file ) . ': ' . $output;
			}
		}

		$this->throw_for_issues( 'PHP syntax errors:', $issues );

		return sprintf( '%d PHP files passed php -l using PHP %s.', count( $php_files ), PHP_VERSION );
	}

	/**
	 * Parse JSON and enforce an offline subset of the WordPress schemas.
	 *
	 * @return string Success summary.
	 */
	private function check_json(): string {
		$issues     = array();
		$json_files = $this->files_with_extensions( array( 'json' ) );

		foreach ( $json_files as $file ) {
			try {
				$this->decode_json_file( $file );
			} catch ( RuntimeException $error ) {
				$issues[] = $this->relative_path( $file ) . ': ' . $error->getMessage();
			}
		}

		$theme_file = $this->theme_root . '/theme.json';
		$theme      = $this->decode_json_file( $theme_file );
		$headers    = $this->theme_headers();

		$this->require_array_key( $theme, '$schema', 'theme.json', $issues, 'string' );
		$this->require_array_key( $theme, 'version', 'theme.json', $issues, 'integer' );
		$this->require_array_key( $theme, 'settings', 'theme.json', $issues, 'array' );
		$this->require_array_key( $theme, 'styles', 'theme.json', $issues, 'array' );
		$this->require_array_key( $theme, 'templateParts', 'theme.json', $issues, 'array' );

		$schema_version = $this->wordpress_schema_version( $theme['$schema'] ?? null );
		if ( '' === $schema_version ) {
			$issues[] = 'theme.json: $schema must use https://schemas.wp.org/wp/{version}/theme.json';
		} else {
			if ( version_compare( $schema_version, $headers['Requires at least'], '<' ) ) {
				$issues[] = sprintf(
					'theme.json: schema %s predates Requires at least %s',
					$schema_version,
					$headers['Requires at least']
				);
			}

			if ( version_compare( $schema_version, $headers['Tested up to'], '>' ) ) {
				$issues[] = sprintf(
					'theme.json: schema %s is newer than Tested up to %s',
					$schema_version,
					$headers['Tested up to']
				);
			}
		}

		if ( isset( $theme['version'] ) && ( ! is_int( $theme['version'] ) || $theme['version'] < 3 ) ) {
			$issues[] = 'theme.json: version must be an integer of at least 3';
		}

		// v3 otherwise retains WordPress defaults with the same preset slugs.
		if ( false !== ( $theme['settings']['spacing']['defaultSpacingSizes'] ?? null ) ) {
			$issues[] = 'theme.json: defaultSpacingSizes must be false so the theme spacing presets are used';
		}
		if ( false !== ( $theme['settings']['typography']['defaultFontSizes'] ?? null ) ) {
			$issues[] = 'theme.json: defaultFontSizes must be false so the theme typography presets are used';
		}

		// style.css repeats each light value for browsers without light-dark().
		$stylesheet = $this->read_file( $this->theme_root . '/style.css' );
		foreach ( $theme['settings']['color']['palette'] ?? array() as $item ) {
			$slug = (string) ( $item['slug'] ?? '' );
			if ( preg_match( '/^light-dark\(\s*(#[0-9a-f]+)\s*,/i', (string) ( $item['color'] ?? '' ), $match )
				&& ! preg_match( '/--wp--preset--color--' . preg_quote( $slug, '/' ) . ':\s*' . preg_quote( $match[1], '/' ) . ';/i', $stylesheet )
			) {
				$issues[] = sprintf( 'style.css: light-dark() fallback needs --wp--preset--color--%s: %s', $slug, $match[1] );
			}
		}

		// Block stylesheets repeat the light value of each light-dark() custom property.
		foreach ( glob( $this->theme_root . '/assets/css/blocks/*.css' ) ?: array() as $file ) {
			$css      = $this->read_file( $file );
			$fallback = (string) strstr( $css, '@supports not (color: light-dark(#fff, #000))' );
			preg_match_all( '/(--[\w-]+):\s*light-dark\(\s*(#[0-9a-f]+)\s*,/i', $css, $matches, PREG_SET_ORDER );
			foreach ( $matches as $match ) {
				if ( false === stripos( $fallback, $match[1] . ': ' . $match[2] . ';' ) ) {
					$issues[] = sprintf( '%s: light-dark() fallback needs %s: %s', $this->relative_path( $file ), $match[1], $match[2] );
				}
			}
		}

		$style_files = glob( $this->theme_root . '/styles/*.json' ) ?: array();
		foreach ( $style_files as $file ) {
			$document = $this->decode_json_file( $file );
			$relative = $this->relative_path( $file );
			$this->require_array_key( $document, '$schema', $relative, $issues, 'string' );
			$this->require_array_key( $document, 'version', $relative, $issues, 'integer' );
			$this->require_array_key( $document, 'title', $relative, $issues, 'string' );
			$this->require_array_key( $document, 'styles', $relative, $issues, 'array' );

			if ( isset( $document['$schema'], $theme['$schema'] ) && $document['$schema'] !== $theme['$schema'] ) {
				$issues[] = $relative . ': $schema must match theme.json';
			}

			if ( isset( $document['version'], $theme['version'] ) && $document['version'] !== $theme['version'] ) {
				$issues[] = $relative . ': version must match theme.json';
			}
		}

		$block_files = glob( $this->theme_root . '/blocks/*/block.json' ) ?: array();
		foreach ( $block_files as $file ) {
			$document  = $this->decode_json_file( $file );
			$relative  = $this->relative_path( $file );
			$directory = basename( dirname( $file ) );

			foreach ( array( '$schema', 'name', 'version', 'title', 'textdomain' ) as $required ) {
				$this->require_array_key( $document, $required, $relative, $issues, 'string' );
			}
			$this->require_array_key( $document, 'apiVersion', $relative, $issues, 'integer' );

			if ( isset( $document['$schema'] ) && 'https://schemas.wp.org/trunk/block.json' !== $document['$schema'] ) {
				$issues[] = $relative . ': $schema must be the WordPress block.json schema';
			}

			if ( isset( $document['name'] ) && 'ntc-block/' . $directory !== $document['name'] ) {
				$issues[] = $relative . ': block name must match its directory';
			}

			if ( isset( $document['textdomain'] ) && 'ntc-block' !== $document['textdomain'] ) {
				$issues[] = $relative . ': textdomain must be ntc-block';
			}

			if ( isset( $document['apiVersion'] ) && $document['apiVersion'] < 3 ) {
				$issues[] = $relative . ': apiVersion must be at least 3';
			}

			$this->validate_block_file_references( $file, $document, $issues );
		}

		$this->validate_font_references( $theme, $issues );
		$this->validate_schema_against_local_core( $schema_version, $issues );
		$this->throw_for_issues( 'JSON/schema validation errors:', $issues );

		return sprintf(
			'%d JSON files parsed; theme, style, block, and local file references satisfy offline schema invariants.',
			count( $json_files )
		);
	}

	/**
	 * Check package versions, declared components, and cross-file references.
	 *
	 * @return string Success summary.
	 */
	private function check_components(): string {
		$issues        = array();
		// Preview screenshots belong to documentation; site media and fonts do not ship.
		$readme_screenshots = array(
			'docs/images/hero-and-stats.png',
			'docs/images/cards-and-frames.png',
			'docs/images/project-grid.png',
		);
		foreach ( $this->files_with_extensions( array( 'otf', 'ttf', 'woff', 'woff2', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico' ) ) as $asset ) {
			$relative = $this->relative_path( $asset );
			if ( ! in_array( $relative, $readme_screenshots, true ) ) {
				$issues[] = $relative . ': store site media/fonts outside the theme; only documentation screenshots are bundled';
			}
		}
		$headers       = $this->theme_headers();
		$theme_version = $headers['Version'];
		$versions      = array( 'style.css Version' => $theme_version );
		$composer      = $this->decode_json_file( $this->theme_root . '/composer.json' );
		if ( ( $composer['require']['php'] ?? null ) !== '>=' . $headers['Requires PHP'] ) {
			$issues[] = 'composer.json: require.php must declare >= the theme Requires PHP minimum';
		}

		if ( 'ntc-block' !== $headers['Text Domain'] ) {
			$issues[] = 'style.css: Text Domain must be ntc-block';
		}

		$this->capture_version(
			$this->read_file( $this->theme_root . '/languages/ntc-block.pot' ),
			'/Project-Id-Version:\s*NTC Block\s+([0-9]+(?:\.[0-9]+)+)/',
			'languages/ntc-block.pot header',
			$versions,
			$issues
		);

		$block_documents = array();
		foreach ( glob( $this->theme_root . '/blocks/*/block.json' ) ?: array() as $file ) {
			$document = $this->decode_json_file( $file );
			$label    = $this->relative_path( $file );
			if ( isset( $document['version'] ) && is_string( $document['version'] ) ) {
				$versions[ $label . ' version' ] = $document['version'];
			}
			if ( isset( $document['name'] ) && is_string( $document['name'] ) ) {
				$block_documents[ $document['name'] ] = $file;
			}

			$asset_file = dirname( $file ) . '/index.asset.php';
			if ( is_file( $asset_file ) ) {
				$this->capture_version(
					$this->read_file( $asset_file ),
					'/[\'\"]version[\'\"]\s*=>\s*[\'\"]([^\'\"]+)[\'\"]/',
					$this->relative_path( $asset_file ) . ' version',
					$versions,
					$issues
				);
			}
		}

		foreach ( $versions as $label => $version ) {
			if ( $version !== $theme_version ) {
				$issues[] = sprintf( '%s is %s; expected %s', $label, $version, $theme_version );
			}
		}

		$phpcs = $this->read_file( $this->theme_root . '/phpcs.xml.dist' );
		if ( preg_match( '/name="testVersion"\s+value="([0-9.]+)(?:-[0-9.]*)?"/', $phpcs, $match ) ) {
			if ( $match[1] !== $headers['Requires PHP'] ) {
				$issues[] = sprintf(
					'phpcs.xml.dist: PHPCompatibility lower bound %s must match Requires PHP %s',
					$match[1],
					$headers['Requires PHP']
				);
			}
		} else {
			$issues[] = 'phpcs.xml.dist: PHPCompatibility testVersion was not found';
		}

		$theme          = $this->decode_json_file( $this->theme_root . '/theme.json' );
		$declared_parts = array();
		foreach ( $theme['templateParts'] ?? array() as $part ) {
			if ( ! isset( $part['name'], $part['area'], $part['title'] ) || ! is_string( $part['name'] ) ) {
				$issues[] = 'theme.json: each templateParts entry needs name, area, and title';
				continue;
			}
			if ( isset( $declared_parts[ $part['name'] ] ) ) {
				$issues[] = 'theme.json: duplicate template part ' . $part['name'];
			}
			$declared_parts[ $part['name'] ] = $part['area'];
		}

		$actual_parts = array_map(
			static fn( string $file ): string => basename( $file, '.html' ),
			glob( $this->theme_root . '/parts/*.html' ) ?: array()
		);
		sort( $actual_parts );
		$declared_names = array_keys( $declared_parts );
		sort( $declared_names );
		if ( $actual_parts !== $declared_names ) {
			$issues[] = sprintf(
				'theme.json templateParts (%s) must match parts/*.html (%s)',
				implode( ', ', $declared_names ),
				implode( ', ', $actual_parts )
			);
		}

		$custom_template_names = array();
		foreach ( $theme['customTemplates'] ?? array() as $custom_template ) {
			$name       = $custom_template['name'] ?? '';
			$title      = $custom_template['title'] ?? '';
			$post_types = $custom_template['postTypes'] ?? array();

			if ( ! is_string( $name ) || '' === $name || ! is_string( $title ) || '' === $title || ! is_array( $post_types ) || empty( $post_types ) ) {
				$issues[] = 'theme.json: each customTemplates entry needs a name, title, and nonempty postTypes array';
				continue;
			}
			if ( isset( $custom_template_names[ $name ] ) ) {
				$issues[] = 'theme.json: duplicate custom template ' . $name;
			}
			$custom_template_names[ $name ] = true;
			if ( ! is_file( $this->theme_root . '/templates/' . $name . '.html' ) ) {
				$issues[] = 'theme.json: custom template has no matching file: ' . $name;
			}
		}

		$patterns = $this->pattern_documents( $issues );
		foreach ( $this->component_documents( $issues ) as $relative => $source ) {
			$tokens = $this->block_tokens( $source, $relative, $issues );
			$this->validate_template_part_theme_attributes( $tokens, $relative, $issues );
			foreach ( $tokens as $token ) {
				$this->validate_portable_block_attributes( $token['attrs'], $relative . ' ' . $token['name'], $issues );

				if ( 'core/template-part' === $token['name'] ) {
					$slug = $token['attrs']['slug'] ?? '';
					if ( ! is_string( $slug ) || ! in_array( $slug, $actual_parts, true ) ) {
						$issues[] = sprintf( '%s: unresolved template part slug %s', $relative, (string) $slug );
					}
				}

				if ( 'core/pattern' === $token['name'] ) {
					$slug = $token['attrs']['slug'] ?? '';
					if ( is_string( $slug ) && str_starts_with( $slug, 'ntc-block/' ) && ! isset( $patterns[ $slug ] ) ) {
						$issues[] = sprintf( '%s: unresolved pattern slug %s', $relative, $slug );
					}
				}

				if ( str_starts_with( $token['name'], 'ntc-block/' ) && ! isset( $block_documents[ $token['name'] ] ) ) {
					$issues[] = sprintf( '%s: unresolved custom block %s', $relative, $token['name'] );
				}
			}

			if ( preg_match( '/\bet_pb_[A-Za-z0-9_-]*|\[\/?et_pb_/i', $source ) ) {
				$issues[] = $relative . ': legacy Divi markup is not portable theme content';
			}

			$visible_source = preg_replace( '/<\?php.*?\?>/s', '', $source );
			$visible_source = is_string( $visible_source ) ? preg_replace( '/<!--.*?-->/s', '', $visible_source ) : '';
			$visible_text   = html_entity_decode( trim( strip_tags( (string) $visible_source ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
			if ( preg_match( '/\p{L}/u', $visible_text ) ) {
				$issues[] = sprintf( '%s: raw visible text is not wrapped in a translation function: %s', $relative, $this->excerpt( $visible_text ) );
			}
		}

		foreach ( $this->files_with_extensions( array( 'php' ) ) as $php_file ) {
			if ( str_starts_with( $this->relative_path( $php_file ), 'tests/' ) ) {
				continue;
			}
			$contents = $this->read_file( $php_file );
			foreach ( token_get_all( $contents ) as $token ) {
				if ( '@' === $token ) {
					$issues[] = $this->relative_path( $php_file ) . ': suppressed PHP errors are not allowed';
					break;
				}
			}
			if ( preg_match_all( '/get_theme_file_uri\(\s*[\'\"]([^\'\"]+)[\'\"]\s*\)/', $contents, $matches ) ) {
				foreach ( $matches[1] as $asset ) {
					if ( ! is_file( $this->theme_root . '/' . ltrim( $asset, '/' ) ) ) {
						$issues[] = sprintf( '%s: missing referenced asset %s', $this->relative_path( $php_file ), $asset );
					}
				}
			}
		}

		$this->check_template_part_portability_controls( $issues );
		$this->check_source_collection_helpers( $issues );
		$this->throw_for_issues( 'Component/version consistency errors:', $issues );

		return sprintf(
			'version %s is synchronized; %d parts, %d patterns, %d custom templates, and %d custom block%s resolve.',
			$theme_version,
			count( $actual_parts ),
			count( $patterns ),
			count( $custom_template_names ),
			count( $block_documents ),
			1 === count( $block_documents ) ? '' : 's'
		);
	}

	/**
	 * Keep packaged templates independent of the installed theme directory.
	 *
	 * WordPress resolves an omitted template-part theme to the active stylesheet.
	 * An explicit value, even today's slug, breaks when the theme folder changes.
	 *
	 * @param array<array<string, mixed>> $tokens   Parsed block-comment tokens.
	 * @param string                      $relative Component path within the theme.
	 * @param string[]                    $issues   Collected issues.
	 * @return void
	 */
	private function validate_template_part_theme_attributes( array $tokens, string $relative, array &$issues ): void {
		if ( ! str_starts_with( $relative, 'templates/' ) ) {
			return;
		}
		foreach ( $tokens as $token ) {
			if ( 'core/template-part' === $token['name'] && array_key_exists( 'theme', $token['attrs'] ) ) {
				$issues[] = $relative . ': template-part references must omit the theme attribute and use the active stylesheet';
			}
		}
	}

	/**
	 * Exercise the template-part guard without changing live theme files.
	 *
	 * @param string[] $issues Collected issues.
	 * @return void
	 */
	private function check_template_part_portability_controls( array &$issues ): void {
		$fixtures = array(
			'portable' => array( '<!-- wp:template-part {"slug":"header","tagName":"header"} /--><!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->', 0 ),
			'old-slug' => array( '<!-- wp:template-part {"slug":"header","theme":"ntc-block"} /-->', 1 ),
			'current-slug' => array( '<!-- wp:template-part {"slug":"header","theme":"wordpress-theme-peppermint"} /-->', 1 ),
			'empty-theme' => array( '<!-- wp:template-part {"slug":"header","theme":""} /-->', 1 ),
			'null-theme' => array( '<!-- wp:template-part {"slug":"header","theme":null} /-->', 1 ),
			'nested-old-slug' => array( '<!-- wp:group --><div class="wp-block-group"><!-- wp:template-part {"slug":"footer","theme":"ntc-block"} /--></div><!-- /wp:group -->', 1 ),
		);
		foreach ( $fixtures as $name => list( $source, $expected_count ) ) {
			$relative = 'templates/portability-' . $name . '.html';
			$probe_issues = array();
			$tokens = $this->block_tokens( $source, $relative, $probe_issues );
			if ( ! empty( $probe_issues ) ) {
				$issues[] = 'Template-part portability control could not be parsed: ' . $name;
				continue;
			}
			$this->validate_template_part_theme_attributes( $tokens, $relative, $probe_issues );
			$expected = array_fill( 0, $expected_count, $relative . ': template-part references must omit the theme attribute and use the active stylesheet' );
			if ( $expected !== $probe_issues ) {
				$issues[] = 'Template-part portability control failed: ' . $name;
			}
		}
		$this->notes[] = sprintf( 'Template-part portability controls exercised: %d valid/invalid fixtures, including nested and renamed-theme references.', count( $fixtures ) );
	}

	/**
	 * Verify source collection and mirror comparison with isolated fixtures.
	 *
	 * Generated directories deliberately contain invalid PHP/JSON. Neither
	 * collector may treat those files as theme source. Cleanup touches only the
	 * explicit files and directories created here, never a recursive broad path.
	 *
	 * @param string[] $issues Collected issues.
	 * @return void
	 */
	private function check_source_collection_helpers( array &$issues ): void {
		$fixture_root  = rtrim( sys_get_temp_dir(), '/\\' ) . '/ntc-source-collection-' . bin2hex( random_bytes( 8 ) );
		$created_dirs  = array();
		$created_files = array();
		$excluded      = array( '.git', '.local', 'node_modules', 'vendor', 'artifacts', 'test-results', 'playwright-report' );

		try {
			$directories = array( $fixture_root );
			foreach ( array( 'left', 'right' ) as $side ) {
				$directories[] = $fixture_root . '/' . $side;
				$directories[] = $fixture_root . '/' . $side . '/patterns';
				foreach ( $excluded as $directory ) {
					$directories[] = $fixture_root . '/' . $side . '/' . $directory;
				}
			}
			foreach ( $directories as $directory ) {
				if ( ! mkdir( $directory, 0700 ) ) {
					throw new RuntimeException( 'Unable to create a source-collection fixture directory.' );
				}
				$created_dirs[] = $directory;
			}

			foreach ( array( 'left', 'right' ) as $side ) {
				$files = array(
					'theme.json'          => '{}',
					'patterns/probe.php'  => '<?php /* intended source */',
					'debug.log'           => $side,
					'build.zip'           => $side,
					'build.tar.gz'        => $side,
				);
				foreach ( $excluded as $directory ) {
					$files[ $directory . '/invalid.php' ]  = '<?php deliberately invalid ' . $side;
					$files[ $directory . '/invalid.json' ] = '{ deliberately invalid ' . $side;
				}
				foreach ( $files as $relative => $contents ) {
					$file            = $fixture_root . '/' . $side . '/' . $relative;
					$created_files[] = $file;
					if ( false === file_put_contents( $file, $contents ) ) {
						throw new RuntimeException( 'Unable to write a source-collection fixture.' );
					}
				}
				$fixture_suite = new self( $fixture_root . '/' . $side, false );
				$collected     = array_map( array( $fixture_suite, 'relative_path' ), $fixture_suite->files_with_extensions( array( 'php', 'json' ) ) );
				if ( array( 'patterns/probe.php', 'theme.json' ) !== $collected ) {
					throw new RuntimeException( 'Static source collection included a generated fixture or lost intended source.' );
				}
			}

			$compare = function ( string $left, string $right ): array {
				$pipes = array();
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open -- Exercise the read-only CLI contract.
				$process = proc_open(
					array( PHP_BINARY, '-n', $this->theme_root . '/tests/compare-theme-trees.php', $left, $right ),
					array( 1 => array( 'pipe', 'w' ), 2 => array( 'pipe', 'w' ) ),
					$pipes
				);
				if ( ! is_resource( $process ) ) {
					throw new RuntimeException( 'Unable to run the comparison-helper fixture.' );
				}
				$output = stream_get_contents( $pipes[1] ) . stream_get_contents( $pipes[2] );
				fclose( $pipes[1] );
				fclose( $pipes[2] );
				return array( proc_close( $process ), $output );
			};
			$left  = $fixture_root . '/left';
			$right = $fixture_root . '/right';
			list( $status, $output ) = $compare( $left, $right );
			if ( 0 !== $status || ! str_contains( $output, 'Theme trees match: 2 intended source files' ) ) {
				throw new RuntimeException( 'Comparison helper must ignore generated fixtures and hash both source files: ' . trim( $output ) );
			}
			if ( false === file_put_contents( $left . '/patterns/probe.php', '<?php /* changed source */' ) ) {
				throw new RuntimeException( 'Unable to change the controlled comparison fixture.' );
			}
			list( $status, $output ) = $compare( $left, $right );
			if ( 1 !== $status || ! str_contains( $output, 'CONTENT DIFFERS: patterns/probe.php' ) ) {
				throw new RuntimeException( 'Comparison helper failed to report a deliberate source difference.' );
			}
			list( $status ) = $compare( $left, $left );
			if ( 2 !== $status ) {
				throw new RuntimeException( 'Comparison helper must reject two identical roots.' );
			}
			list( $status ) = $compare( $left, $fixture_root . '/missing' );
			if ( 2 !== $status ) {
				throw new RuntimeException( 'Comparison helper must reject a nonexistent root.' );
			}
			$this->notes[] = 'Source-collection fixtures passed: generated exclusions, intended-source changes, and invalid comparison roots.';
		} catch ( Throwable $error ) {
			$issues[] = 'Source-collection helpers: ' . $error->getMessage();
		} finally {
			foreach ( array_reverse( $created_files ) as $file ) {
				if ( is_file( $file ) && ! unlink( $file ) ) {
					$issues[] = 'Unable to remove owned source-collection fixture: ' . $file;
				}
			}
			foreach ( array_reverse( $created_dirs ) as $directory ) {
				if ( is_dir( $directory ) && ! rmdir( $directory ) ) {
					$issues[] = 'Unable to remove owned source-collection directory: ' . $directory;
				}
			}
		}
	}

	/**
	 * Capture one version from text.
	 *
	 * @param string                $contents Source text.
	 * @param string                $pattern  Extraction pattern.
	 * @param string                $label    Version source label.
	 * @param array<string, string> $versions Collected versions.
	 * @param string[]              $issues   Collected issues.
	 * @return void
	 */
	private function capture_version( string $contents, string $pattern, string $label, array &$versions, array &$issues ): void {
		if ( preg_match( $pattern, $contents, $match ) ) {
			$versions[ $label ] = trim( $match[1] );
		} else {
			$issues[] = $label . ' was not found';
		}
	}

	/**
	 * Reject database-bound block IDs and fixed locale date formats.
	 *
	 * @param array<mixed> $attributes Block attributes.
	 * @param string       $label      Source/block label.
	 * @param string[]     $issues     Collected issues.
	 * @return void
	 */
	private function validate_portable_block_attributes( array $attributes, string $label, array &$issues ): void {
		if ( '_blank' === ( $attributes['target'] ?? null ) ) {
			$rel_tokens = preg_split( '/\s+/', strtolower( trim( (string) ( $attributes['rel'] ?? '' ) ) ) ) ?: array();
			if ( ! in_array( 'noopener', $rel_tokens, true ) ) {
				$issues[] = $label . ': target _blank block attributes require rel noopener';
			}
		}

		foreach ( $attributes as $key => $value ) {
			if ( in_array( $key, array( 'id', 'queryId', 'ref' ), true ) && ( is_int( $value ) || ( is_string( $value ) && ctype_digit( $value ) ) ) ) {
				$issues[] = sprintf( '%s: database-bound %s attribute is not allowed', $label, $key );
			}

			if ( 'format' === $key && is_string( $value ) && preg_match( '/[dDjlNSwzWFmMntLoYyaABgGhHisueIOPTZcrUv]/', $value ) ) {
				$issues[] = sprintf( '%s: fixed date format "%s" bypasses the site locale', $label, $value );
			}

			if ( is_array( $value ) ) {
				$this->validate_portable_block_attributes( $value, $label . '.' . $key, $issues );
			}
		}
	}

	/**
	 * Normalize a short one-line excerpt for diagnostics.
	 *
	 * @param string $text Source text.
	 * @return string Excerpt.
	 */
	private function excerpt( string $text ): string {
		$one_line = preg_replace( '/\s+/u', ' ', trim( $text ) );
		$one_line = is_string( $one_line ) ? $one_line : trim( $text );

		if ( strlen( $one_line ) > 90 ) {
			return substr( $one_line, 0, 87 ) . '...';
		}

		return $one_line;
	}

	/**
	 * Return block markup documents keyed by relative path.
	 *
	 * @param string[] $issues Collected issues.
	 * @return array<string, string> Documents.
	 */
	private function component_documents( array &$issues ): array {
		$documents = array();

		foreach ( glob( $this->theme_root . '/templates/*.html' ) ?: array() as $file ) {
			$documents[ $this->relative_path( $file ) ] = $this->read_file( $file );
		}
		foreach ( glob( $this->theme_root . '/parts/*.html' ) ?: array() as $file ) {
			$documents[ $this->relative_path( $file ) ] = $this->read_file( $file );
		}
		foreach ( $this->pattern_documents( $issues ) as $pattern ) {
			$documents[ $pattern['relative'] ] = $pattern['body'];
		}

		ksort( $documents );
		return $documents;
	}

	/**
	 * Parse WordPress pattern headers and bodies.
	 *
	 * @param string[] $issues Collected issues.
	 * @return array<string, array{relative:string,body:string,title:string,description:string}> Patterns keyed by slug.
	 */
	private function pattern_documents( array &$issues ): array {
		$patterns = array();

		foreach ( glob( $this->theme_root . '/patterns/*.php' ) ?: array() as $file ) {
			$contents = $this->read_file( $file );
			$relative = $this->relative_path( $file );
			if ( ! preg_match( '/\A<\?php(?P<header>.*?)\?>\s*(?P<body>.*)\z/s', $contents, $match ) ) {
				$issues[] = $relative . ': pattern PHP header could not be separated from block markup';
				continue;
			}

			$metadata = array();
			foreach ( array( 'Title', 'Slug' ) as $field ) {
				if ( preg_match( '/^[ \t*]*' . $field . ':\s*(.+)$/mi', $match['header'], $field_match ) ) {
					$metadata[ $field ] = trim( $field_match[1] );
				} else {
					$issues[] = sprintf( '%s: missing %s pattern header', $relative, $field );
					$metadata[ $field ] = '';
				}
			}

			$description = '';
			if ( preg_match( '/^[ \t*]*Description:\s*(.+)$/mi', $match['header'], $description_match ) ) {
				$description = trim( $description_match[1] );
			}

			$expected_slug = 'ntc-block/' . basename( $file, '.php' );
			if ( $metadata['Slug'] !== $expected_slug ) {
				$issues[] = sprintf( '%s: Slug must be %s', $relative, $expected_slug );
			}

			if ( isset( $patterns[ $metadata['Slug'] ] ) ) {
				$issues[] = sprintf( '%s: duplicate pattern slug %s', $relative, $metadata['Slug'] );
			}

			$patterns[ $metadata['Slug'] ] = array(
				'relative'    => $relative,
				'body'        => $match['body'],
				'title'       => $metadata['Title'],
				'description' => $description,
			);
		}

		ksort( $patterns );
		return $patterns;
	}

	/**
	 * Parse and balance WordPress block comment delimiters.
	 *
	 * @param string   $source   Block markup.
	 * @param string   $relative Source label.
	 * @param string[] $issues   Collected issues.
	 * @return array<int, array{name:string,attrs:array<mixed>,self_closing:bool}> Opening and self-closing tokens.
	 */
	private function block_tokens( string $source, string $relative, array &$issues ): array {
		$pattern = '/<!--\s*(\/?)wp:([A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)?)\s*(.*?)-->/s';
		$count   = preg_match_all( $pattern, $source, $matches, PREG_SET_ORDER );
		$tokens  = array();
		$stack   = array();

		if ( false === $count ) {
			$issues[] = $relative . ': block comment scan failed';
			return $tokens;
		}

		$marker_count = preg_match_all( '/<!--\s*\/?wp:/i', $source );
		if ( false !== $marker_count && $marker_count !== $count ) {
			$issues[] = $relative . ': one or more block comments are malformed or unterminated';
		}

		foreach ( $matches as $match ) {
			$is_closing = '/' === $match[1];
			$raw_name   = $match[2];
			$name       = str_contains( $raw_name, '/' ) ? $raw_name : 'core/' . $raw_name;
			$tail       = trim( $match[3] );

			if ( $is_closing ) {
				if ( '' !== $tail ) {
					$issues[] = sprintf( '%s: closing block %s has unexpected content', $relative, $raw_name );
				}
				$expected = array_pop( $stack );
				if ( null === $expected ) {
					$issues[] = sprintf( '%s: closing block %s has no opener', $relative, $raw_name );
				} elseif ( $expected !== $name ) {
					$issues[] = sprintf( '%s: closing block %s does not match open block %s', $relative, $name, $expected );
				}
				continue;
			}

			$self_closing = str_ends_with( $tail, '/' );
			if ( $self_closing ) {
				$tail = rtrim( substr( $tail, 0, -1 ) );
			}

			$attributes = array();
			if ( '' !== $tail ) {
				try {
					$attributes = json_decode( $tail, true, 512, JSON_THROW_ON_ERROR );
					if ( ! is_array( $attributes ) ) {
						throw new RuntimeException( 'attributes must decode to an object' );
					}
				} catch ( JsonException | RuntimeException $error ) {
					$issues[] = sprintf( '%s: %s block attributes are invalid JSON: %s', $relative, $name, $error->getMessage() );
					$attributes = array();
				}
			}

			$tokens[] = array(
				'name'         => $name,
				'attrs'        => $attributes,
				'self_closing' => $self_closing,
			);

			if ( ! $self_closing ) {
				$stack[] = $name;
			}
		}

		foreach ( array_reverse( $stack ) as $unclosed ) {
			$issues[] = sprintf( '%s: block %s is not closed', $relative, $unclosed );
		}

		return $tokens;
	}

	/**
	 * Validate block comments and perform WordPress parser round trips.
	 *
	 * @return string Success summary.
	 */
	private function check_blocks(): string {
		$issues    = array();
		$documents = $this->component_documents( $issues );
		$tokens    = array();

		foreach ( $documents as $relative => $source ) {
			$tokens[ $relative ] = $this->block_tokens( $source, $relative, $issues );
		}

		$wordpress_root = $this->find_wordpress_root();
		if ( '' === $wordpress_root ) {
			$message = 'WordPress core was not found; set NTC_WORDPRESS_ROOT to require parser round trips.';
			if ( $this->require_wordpress ) {
				$issues[] = $message;
			} else {
				$this->notes[] = $message;
			}
		} else {
			require_once __DIR__ . '/wordpress-block-parser.php';
			$load_error = ntc_block_tests_load_wordpress_block_parser( $wordpress_root );

			if ( '' !== $load_error ) {
				if ( $this->require_wordpress ) {
					$issues[] = 'WordPress block parser: ' . $load_error;
				} else {
					$this->notes[] = 'WordPress round trips skipped: ' . $load_error;
				}
			} else {
				foreach ( $documents as $relative => $source ) {
					try {
						$parser      = new WP_Block_Parser();
						$parsed      = $parser->parse( $source );
						$serialized  = serialize_blocks( $parsed );
						$reparsed    = ( new WP_Block_Parser() )->parse( $serialized );
						$reserialized = serialize_blocks( $reparsed );

						if ( $serialized !== $reserialized ) {
							$issues[] = $relative . ': WordPress parse/serialize output is not idempotent';
						}

						if ( $this->parsed_block_signature( $parsed ) !== $this->parsed_block_signature( $reparsed ) ) {
							$issues[] = $relative . ': WordPress changed the block tree during round trip';
						}

						$parsed_names = $this->flatten_parsed_block_names( $parsed, $relative, $issues );
						$token_names  = array_column( $tokens[ $relative ], 'name' );
						if ( $parsed_names !== $token_names ) {
							$issues[] = $relative . ': WordPress recovered a different block sequence than the source delimiters declare';
						}
					} catch ( Throwable $error ) {
						$issues[] = sprintf( '%s: WordPress parser failed: %s', $relative, $error->getMessage() );
					}
				}

				$this->notes[] = 'WordPress parser/serializer loaded from ' . str_replace( '\\', '/', $wordpress_root ) . '.';
			}
		}

		$this->throw_for_issues( 'Block markup validation errors:', $issues );

		return sprintf( '%d templates, parts, and patterns have balanced delimiters and valid block attributes.', count( $documents ) );
	}

	/**
	 * Build a stable signature for a parsed WordPress block tree.
	 *
	 * @param array<int, array<mixed>> $blocks Parsed blocks.
	 * @return array<int, array<mixed>> Signature.
	 */
	private function parsed_block_signature( array $blocks ): array {
		$signature = array();

		foreach ( $blocks as $block ) {
			$signature[] = array(
				'name'     => $block['blockName'] ?? null,
				'attrs'    => $block['attrs'] ?? array(),
				'children' => $this->parsed_block_signature( $block['innerBlocks'] ?? array() ),
			);
		}

		return $signature;
	}

	/**
	 * Flatten parsed block names and detect recovered delimiters in freeform HTML.
	 *
	 * @param array<int, array<mixed>> $blocks   Parsed blocks.
	 * @param string                   $relative Source label.
	 * @param string[]                 $issues   Collected issues.
	 * @return string[] Named blocks in preorder.
	 */
	private function flatten_parsed_block_names( array $blocks, string $relative, array &$issues ): array {
		$names = array();

		foreach ( $blocks as $block ) {
			$name = $block['blockName'] ?? null;
			if ( null === $name ) {
				$freeform = (string) ( $block['innerHTML'] ?? '' );
				if ( preg_match( '/<!--\s*\/?wp:/i', $freeform ) ) {
					$issues[] = $relative . ': WordPress recovered a block delimiter as freeform HTML';
				}
			} else {
				$names[] = $name;
			}

			$names = array_merge(
				$names,
				$this->flatten_parsed_block_names( $block['innerBlocks'] ?? array(), $relative, $issues )
			);
		}

		return $names;
	}

	/**
	 * Check static accessibility invariants that do not need a browser.
	 *
	 * @return string Success summary.
	 */
	private function check_a11y(): string {
		$issues   = array();
		$patterns = $this->pattern_documents( $issues );
		$parts    = array();

		foreach ( glob( $this->theme_root . '/parts/*.html' ) ?: array() as $file ) {
			$parts[ basename( $file, '.html' ) ] = array(
				'relative' => $this->relative_path( $file ),
				'body'     => $this->read_file( $file ),
			);
		}

		$template_files = glob( $this->theme_root . '/templates/*.html' ) ?: array();
		foreach ( $template_files as $file ) {
			$relative      = $this->relative_path( $file );
			$source        = $this->read_file( $file );
			$template_tokens = $this->block_tokens( $source, $relative, $issues );
			$header_refs   = 0;
			$footer_refs   = 0;

			foreach ( $template_tokens as $token ) {
				if ( 'core/template-part' !== $token['name'] ) {
					continue;
				}
				if ( 'header' === ( $token['attrs']['slug'] ?? '' ) && 'header' === ( $token['attrs']['tagName'] ?? '' ) ) {
					++$header_refs;
				}
				if ( 'footer' === ( $token['attrs']['slug'] ?? '' ) && 'footer' === ( $token['attrs']['tagName'] ?? '' ) ) {
					++$footer_refs;
				}
			}

			if ( 1 !== $header_refs ) {
				$issues[] = $relative . ': expected one header template part with tagName header';
			}
			if ( 1 !== $footer_refs ) {
				$issues[] = $relative . ': expected one footer template part with tagName footer';
			}

			$expanded_sources = array();
			$this->collect_referenced_documents(
				$relative,
				$source,
				$patterns,
				$parts,
				array(),
				$expanded_sources,
				$issues
			);

			$main_blocks = 0;
			$navigation  = 0;
			$raw_main    = 0;

			foreach ( $expanded_sources as $expanded_relative => $expanded_source ) {
				foreach ( $this->block_tokens( $expanded_source, $expanded_relative, $issues ) as $token ) {
					if ( 'main' === ( $token['attrs']['tagName'] ?? '' ) ) {
						++$main_blocks;
					}
					if ( 'core/navigation' === $token['name'] ) {
						++$navigation;
					}
				}
				$masked    = $this->mask_php( $expanded_source );
				$raw_main += preg_match_all( '/<main\b/i', $masked ) ?: 0;
			}

			if ( 1 !== $main_blocks || 1 !== $raw_main ) {
				$issues[] = sprintf(
					'%s: generated skip-link precondition needs exactly one semantic main block and one <main> element (found %d/%d)',
					$relative,
					$main_blocks,
					$raw_main
				);
			}
			if ( $navigation < 1 ) {
				$issues[] = $relative . ': expanded template has no Navigation block landmark';
			}
		}

		$html_documents = $this->component_documents( $issues );
		foreach ( glob( $this->theme_root . '/blocks/*/render.php' ) ?: array() as $file ) {
			$html_documents[ $this->relative_path( $file ) ] = $this->read_file( $file );
		}

		$images_checked = 0;
		$icons_checked  = 0;
		foreach ( $html_documents as $relative => $source ) {
			$masked = $this->mask_php( $source );

			if ( preg_match_all( '/<img\b[^>]*>/is', $masked, $image_matches, PREG_OFFSET_CAPTURE ) ) {
				foreach ( $image_matches[0] as $image_match ) {
					++$images_checked;
					$tag = $image_match[0];
					if ( ! preg_match( '/\balt\s*=\s*([\'\"])(.*?)\1/is', $tag ) ) {
						$issues[] = $relative . ': every img element must have an alt attribute';
					}

					if ( str_contains( $tag, 'assets/icons/' ) ) {
						++$icons_checked;
						if ( ! preg_match( '/\balt\s*=\s*([\'\"])\1/is', $tag ) ) {
							$issues[] = $relative . ': bundled decorative icon images must use alt=""';
						}
						$offset  = $image_match[1];
						$context = substr( $masked, max( 0, $offset - 250 ), strlen( $tag ) + 500 );
						if ( ! preg_match( '/class\s*=\s*([\'\"])[^\'\"]*icon[^\'\"]*\1/i', $context ) ) {
							$issues[] = $relative . ': bundled icon markup needs an icon class hook';
						}
					}
				}
			}

			if ( preg_match_all( '/<svg\b(?P<attrs>[^>]*)>(?P<body>.*?)<\/svg>/is', $masked, $svg_matches, PREG_SET_ORDER ) ) {
				foreach ( $svg_matches as $svg ) {
					++$icons_checked;
					$is_hidden = (bool) preg_match( '/\baria-hidden\s*=\s*([\'\"])true\1/i', $svg['attrs'] );
					$is_named  = (bool) preg_match( '/\brole\s*=\s*([\'\"])img\1/i', $svg['attrs'] )
						&& ( preg_match( '/\baria-(?:label|labelledby)\s*=/i', $svg['attrs'] ) || preg_match( '/<title\b/i', $svg['body'] ) );

					if ( ! $is_hidden && ! $is_named ) {
						$issues[] = $relative . ': inline SVG must be aria-hidden or expose an img role and accessible name';
					}
					if ( ! preg_match( '/\bclass\s*=\s*([\'\"])[^\'\"]*icon[^\'\"]*\1/i', $svg['attrs'] ) ) {
						$issues[] = $relative . ': inline SVG icons need an icon class hook';
					}
				}
			}

			if ( preg_match_all( '/<a\b[^>]*\btarget\s*=\s*([\'\"])_blank\1[^>]*>/is', $masked, $link_matches ) ) {
				foreach ( $link_matches[0] as $tag ) {
					if ( ! preg_match( '/\brel\s*=\s*([\'\"])([^\'\"]*)\1/is', $tag, $rel_match )
						|| ! in_array( 'noopener', preg_split( '/\s+/', strtolower( trim( $rel_match[2] ) ) ) ?: array(), true )
					) {
						$issues[] = $relative . ': target="_blank" links must include rel="noopener"';
					}
				}
			}
		}

		$editor_script = $this->theme_root . '/blocks/theme-switcher/index.js';
		if ( is_file( $editor_script ) ) {
			$script    = $this->read_file( $editor_script );
			$svg_count = preg_match_all( '/\bel\(\s*[\'\"]svg[\'\"]/', $script ) ?: 0;
			if ( $svg_count > 0 ) {
				if ( ! preg_match( '/[\'\"]aria-hidden[\'\"]\s*:\s*[\'\"]true[\'\"]/', $script ) ) {
					$issues[] = 'blocks/theme-switcher/index.js: editor SVG icon must be aria-hidden';
				}
				if ( ! preg_match( '/className\s*:\s*[\'\"][^\'\"]*icon[^\'\"]*[\'\"]/', $script ) ) {
					$issues[] = 'blocks/theme-switcher/index.js: editor SVG needs an icon class hook';
				}
			}
		}

		$stylesheet = $this->read_file( $this->theme_root . '/style.css' );
		foreach ( array( 'content: ""', 'background-color: currentColor', 'mask-image:' ) as $invariant ) {
			if ( ! str_contains( $stylesheet, $invariant ) ) {
				$issues[] = 'style.css: decorative post-meta masks require ' . $invariant;
			}
		}

		$this->throw_for_issues( 'Static accessibility errors:', $issues );

		return sprintf(
			'%d templates preserve header/main/nav/footer landmarks; %d images and %d icons have static semantics.',
			count( $template_files ),
			$images_checked,
			$icons_checked
		);
	}

	/**
	 * Recursively collect a template and its local pattern/part references.
	 *
	 * @param string                                                                 $relative  Document label.
	 * @param string                                                                 $source    Document source.
	 * @param array<string, array{relative:string,body:string,title:string,description:string}> $patterns  Pattern map.
	 * @param array<string, array{relative:string,body:string}>                       $parts     Part map.
	 * @param array<string, bool>                                                     $visited   Visited documents.
	 * @param array<string, string>                                                   $collected Collected documents.
	 * @param string[]                                                               $issues    Collected issues.
	 * @return void
	 */
	private function collect_referenced_documents(
		string $relative,
		string $source,
		array $patterns,
		array $parts,
		array $visited,
		array &$collected,
		array &$issues
	): void {
		if ( isset( $visited[ $relative ] ) ) {
			$issues[] = $relative . ': recursive template component reference';
			return;
		}

		$visited[ $relative ] = true;
		$collection_key       = $relative;
		$occurrence           = 2;
		while ( isset( $collected[ $collection_key ] ) ) {
			$collection_key = sprintf( '%s (occurrence %d)', $relative, $occurrence );
			++$occurrence;
		}
		$collected[ $collection_key ] = $source;

		foreach ( $this->block_tokens( $source, $relative, $issues ) as $token ) {
			$reference = null;
			if ( 'core/pattern' === $token['name'] ) {
				$slug = $token['attrs']['slug'] ?? '';
				if ( is_string( $slug ) && isset( $patterns[ $slug ] ) ) {
					$reference = $patterns[ $slug ];
				}
			} elseif ( 'core/template-part' === $token['name'] ) {
				$slug = $token['attrs']['slug'] ?? '';
				if ( is_string( $slug ) && isset( $parts[ $slug ] ) ) {
					$reference = $parts[ $slug ];
				}
			}

			if ( is_array( $reference ) ) {
				$this->collect_referenced_documents(
					$reference['relative'],
					$reference['body'],
					$patterns,
					$parts,
					$visited,
					$collected,
					$issues
				);
			}
		}
	}

	/**
	 * Mask PHP tags so HTML tag scans are not confused by PHP's closing angle.
	 *
	 * Icon asset paths are retained for decorative-image checks.
	 *
	 * @param string $source Mixed PHP/HTML source.
	 * @return string Masked source.
	 */
	private function mask_php( string $source ): string {
		$masked = preg_replace_callback(
			'/<\?php.*?\?>/s',
			static function ( array $match ): string {
				$paths = array();
				preg_match_all( '#assets/icons/[A-Za-z0-9._/-]+#', $match[0], $paths );
				return 'PHP' . implode( ' ', $paths[0] ?? array() ) . 'PHP';
			},
			$source
		);

		return is_string( $masked ) ? $masked : $source;
	}

	/**
	 * Compare source gettext strings and translatable metadata with the POT file.
	 *
	 * @return string Success summary.
	 */
	private function check_i18n(): string {
		$issues   = array();
		$expected = array();
		$headers  = $this->theme_headers();

		$this->add_translation_message( $expected, $headers['Theme Name'], '', 'style.css Theme Name' );
		$this->add_translation_message( $expected, $headers['Description'], '', 'style.css Description' );

		$theme = $this->decode_json_file( $this->theme_root . '/theme.json' );
		foreach ( $theme['settings']['color']['palette'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json palette' );
		}
		foreach ( $theme['settings']['color']['gradients'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json gradients' );
		}
		foreach ( $theme['settings']['color']['duotone'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json duotone' );
		}
		foreach ( $theme['settings']['spacing']['spacingSizes'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json spacingSizes' );
		}
		foreach ( $theme['settings']['typography']['fontFamilies'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json fontFamilies' );
		}
		foreach ( $theme['settings']['typography']['fontSizes'] ?? array() as $item ) {
			$this->add_translation_message( $expected, $item['name'] ?? '', '', 'theme.json fontSizes' );
		}
		foreach ( array_merge( $theme['templateParts'] ?? array(), $theme['customTemplates'] ?? array() ) as $item ) {
			$this->add_translation_message( $expected, $item['title'] ?? '', '', 'theme.json templates' );
		}

		foreach ( glob( $this->theme_root . '/styles/*.json' ) ?: array() as $file ) {
			$document = $this->decode_json_file( $file );
			$this->add_translation_message( $expected, $document['title'] ?? '', '', $this->relative_path( $file ) . ' title' );
		}

		foreach ( glob( $this->theme_root . '/blocks/*/block.json' ) ?: array() as $file ) {
			$document = $this->decode_json_file( $file );
			foreach ( array( 'title', 'description' ) as $field ) {
				$this->add_translation_message( $expected, $document[ $field ] ?? '', '', $this->relative_path( $file ) . ' ' . $field );
			}
			foreach ( $document['keywords'] ?? array() as $keyword ) {
				$this->add_translation_message( $expected, $keyword, '', $this->relative_path( $file ) . ' keywords' );
			}
		}

		foreach ( $this->pattern_documents( $issues ) as $pattern ) {
			$this->add_translation_message( $expected, $pattern['title'], '', $pattern['relative'] . ' Title' );
			$this->add_translation_message( $expected, $pattern['description'], '', $pattern['relative'] . ' Description' );
		}

		foreach ( $this->files_with_extensions( array( 'php' ) ) as $file ) {
			if ( str_starts_with( $this->relative_path( $file ), 'tests/' ) ) {
				continue;
			}
			$this->extract_php_translations( $file, $expected, $issues );
		}

		foreach ( $this->files_with_extensions( array( 'js' ) ) as $file ) {
			if ( str_starts_with( $this->relative_path( $file ), 'tests/' ) ) {
				continue;
			}
			$this->extract_js_translations( $file, $expected, $issues );
		}

		$pot_file = $this->theme_root . '/languages/ntc-block.pot';
		$pot      = $this->parse_pot( $this->read_file( $pot_file ), $issues );
		$header   = $pot['header'];

		if ( ! str_contains( $header, 'X-Domain: ntc-block' ) ) {
			$issues[] = 'languages/ntc-block.pot: X-Domain must be ntc-block';
		}

		$actual = $pot['messages'];
		foreach ( array_diff_key( $expected, $actual ) as $key => $sources ) {
			$issues[] = sprintf(
				'languages/ntc-block.pot: missing %s (source: %s)',
				$this->translation_key_label( $key ),
				implode( ', ', $sources )
			);
		}
		foreach ( array_diff_key( $actual, $expected ) as $key => $unused ) {
			$issues[] = 'languages/ntc-block.pot: stale ' . $this->translation_key_label( $key );
		}

		$this->throw_for_issues( 'Translation catalog drift:', $issues );

		return sprintf( '%d unique source messages match the POT catalog and use the ntc-block domain.', count( $expected ) );
	}

	/**
	 * Add a message to a gettext-keyed set.
	 *
	 * @param array<string, string[]> $messages Message set.
	 * @param mixed                   $message  Message value.
	 * @param string                  $context  Optional gettext context.
	 * @param string                  $source   Source label.
	 * @return void
	 */
	private function add_translation_message( array &$messages, $message, string $context, string $source ): void {
		if ( ! is_string( $message ) || '' === $message ) {
			return;
		}

		$key = $context . "\x04" . $message;
		if ( ! isset( $messages[ $key ] ) ) {
			$messages[ $key ] = array();
		}
		if ( ! in_array( $source, $messages[ $key ], true ) ) {
			$messages[ $key ][] = $source;
		}
	}

	/**
	 * Extract literal WordPress gettext calls from one PHP file.
	 *
	 * @param string                  $file     PHP file.
	 * @param array<string, string[]> $messages Message set.
	 * @param string[]                $issues   Collected issues.
	 * @return void
	 */
	private function extract_php_translations( string $file, array &$messages, array &$issues ): void {
		$definitions = array(
			'__'          => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'_e'          => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'_x'          => array( 'message' => array( 0 ), 'context' => 1, 'domain' => 2 ),
			'_ex'         => array( 'message' => array( 0 ), 'context' => 1, 'domain' => 2 ),
			'_n'          => array( 'message' => array( 0, 1 ), 'context' => null, 'domain' => 3 ),
			'_nx'         => array( 'message' => array( 0, 1 ), 'context' => 3, 'domain' => 4 ),
			'esc_attr__'  => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'esc_attr_e'  => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'esc_attr_x'  => array( 'message' => array( 0 ), 'context' => 1, 'domain' => 2 ),
			'esc_html__'  => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'esc_html_e'  => array( 'message' => array( 0 ), 'context' => null, 'domain' => 1 ),
			'esc_html_x'  => array( 'message' => array( 0 ), 'context' => 1, 'domain' => 2 ),
		);
		$tokens      = token_get_all( $this->read_file( $file ) );
		$relative    = $this->relative_path( $file );

		foreach ( $tokens as $index => $token ) {
			if ( ! is_array( $token ) || T_STRING !== $token[0] || ! isset( $definitions[ $token[1] ] ) ) {
				continue;
			}

			$open_index = $this->next_significant_token( $tokens, $index + 1 );
			if ( null === $open_index || '(' !== $tokens[ $open_index ] ) {
				continue;
			}

			$arguments  = $this->php_call_arguments( $tokens, $open_index );
			$definition = $definitions[ $token[1] ];
			$line_label = $relative . ':' . $token[2];
			$domain     = $this->php_literal_argument( $arguments[ $definition['domain'] ] ?? array() );

			if ( 'ntc-block' !== $domain ) {
				$issues[] = sprintf( '%s: %s() must use the literal ntc-block text domain', $line_label, $token[1] );
				continue;
			}

			$context = '';
			if ( null !== $definition['context'] ) {
				$context = $this->php_literal_argument( $arguments[ $definition['context'] ] ?? array() );
				if ( null === $context ) {
					$issues[] = sprintf( '%s: %s() context must be a literal string', $line_label, $token[1] );
					continue;
				}
			}

			foreach ( $definition['message'] as $argument_index ) {
				$message = $this->php_literal_argument( $arguments[ $argument_index ] ?? array() );
				if ( null === $message ) {
					$issues[] = sprintf( '%s: %s() source text must be a literal string', $line_label, $token[1] );
					continue;
				}
				$this->add_translation_message( $messages, $message, $context, $line_label );
			}
		}
	}

	/**
	 * Find the next non-whitespace/comment PHP token.
	 *
	 * @param array<int, array<mixed>|string> $tokens PHP tokens.
	 * @param int                             $start  Start offset.
	 * @return int|null Token index.
	 */
	private function next_significant_token( array $tokens, int $start ): ?int {
		$count = count( $tokens );
		for ( $index = $start; $index < $count; ++$index ) {
			$token = $tokens[ $index ];
			if ( is_array( $token ) && in_array( $token[0], array( T_WHITESPACE, T_COMMENT, T_DOC_COMMENT ), true ) ) {
				continue;
			}
			return $index;
		}
		return null;
	}

	/**
	 * Split a tokenized PHP call into arguments.
	 *
	 * @param array<int, array<mixed>|string> $tokens     PHP tokens.
	 * @param int                             $open_index Opening-parenthesis index.
	 * @return array<int, array<int, array<mixed>|string>> Arguments.
	 */
	private function php_call_arguments( array $tokens, int $open_index ): array {
		$arguments = array( array() );
		$depth     = 0;
		$count     = count( $tokens );

		for ( $index = $open_index + 1; $index < $count; ++$index ) {
			$token = $tokens[ $index ];
			if ( is_string( $token ) ) {
				if ( in_array( $token, array( '(', '[', '{' ), true ) ) {
					++$depth;
				} elseif ( in_array( $token, array( ')', ']', '}' ), true ) ) {
					if ( ')' === $token && 0 === $depth ) {
						break;
					}
					--$depth;
				} elseif ( ',' === $token && 0 === $depth ) {
					$arguments[] = array();
					continue;
				}
			}

			$arguments[ array_key_last( $arguments ) ][] = $token;
		}

		return $arguments;
	}

	/**
	 * Decode a PHP argument when it is exactly one literal string.
	 *
	 * @param array<int, array<mixed>|string> $tokens Argument tokens.
	 * @return string|null Literal value.
	 */
	private function php_literal_argument( array $tokens ): ?string {
		$significant = array_values(
			array_filter(
				$tokens,
				static fn( $token ): bool => ! is_array( $token ) || ! in_array( $token[0], array( T_WHITESPACE, T_COMMENT, T_DOC_COMMENT ), true )
			)
		);

		if ( 1 !== count( $significant ) || ! is_array( $significant[0] ) || T_CONSTANT_ENCAPSED_STRING !== $significant[0][0] ) {
			return null;
		}

		$literal = $significant[0][1];
		$quote   = $literal[0];
		$value   = substr( $literal, 1, -1 );

		if ( "'" === $quote ) {
			return str_replace( array( '\\\\', '\\\'' ), array( '\\', '\'' ), $value );
		}

		return stripcslashes( $value );
	}

	/**
	 * Extract literal i18n calls from one JavaScript file.
	 *
	 * @param string                  $file     JavaScript file.
	 * @param array<string, string[]> $messages Message set.
	 * @param string[]                $issues   Collected issues.
	 * @return void
	 */
	private function extract_js_translations( string $file, array &$messages, array &$issues ): void {
		$source   = $this->read_file( $file );
		$relative = $this->relative_path( $file );
		$found    = 0;
		$patterns = array(
			'__' => '/\bi18n\.__\(\s*([\'\"])(.*?)\1\s*,\s*([\'\"])ntc-block\3\s*\)/s',
			'_x' => '/\bi18n\._x\(\s*([\'\"])(.*?)\1\s*,\s*([\'\"])(.*?)\3\s*,\s*([\'\"])ntc-block\5\s*\)/s',
		);

		foreach ( $patterns as $function => $pattern ) {
			if ( ! preg_match_all( $pattern, $source, $matches, PREG_SET_ORDER ) ) {
				continue;
			}
			foreach ( $matches as $match ) {
				++$found;
				$message = stripcslashes( $match[2] );
				$context = '_x' === $function ? stripcslashes( $match[4] ) : '';
				$this->add_translation_message( $messages, $message, $context, $relative );
			}
		}

		$call_count = preg_match_all( '/\bi18n\.(?:__|_x|_n|_nx)\s*\(/', $source ) ?: 0;
		if ( $found !== $call_count ) {
			$issues[] = sprintf( '%s: %d i18n call(s) use unsupported or nonliteral arguments', $relative, $call_count - $found );
		}
	}

	/**
	 * Parse POT entries into a gettext-keyed set.
	 *
	 * @param string   $contents POT contents.
	 * @param string[] $issues   Collected issues.
	 * @return array{header:string,messages:array<string,bool>} Parsed catalog.
	 */
	private function parse_pot( string $contents, array &$issues ): array {
		$messages = array();
		$header   = '';
		$entries  = preg_split( '/\R{2,}/', trim( $contents ) ) ?: array();

		foreach ( $entries as $entry ) {
			$message = $this->po_field( $entry, 'msgid' );
			if ( null === $message ) {
				continue;
			}

			if ( '' === $message ) {
				$header = (string) $this->po_field( $entry, 'msgstr' );
				continue;
			}

			$context = (string) $this->po_field( $entry, 'msgctxt' );
			$key     = $context . "\x04" . $message;
			if ( isset( $messages[ $key ] ) ) {
				$issues[] = 'languages/ntc-block.pot: duplicate ' . $this->translation_key_label( $key );
			}
			$messages[ $key ] = true;
			$plural = $this->po_field( $entry, 'msgid_plural' );
			if ( is_string( $plural ) && '' !== $plural ) {
				$plural_key              = $context . "\x04" . $plural;
				$messages[ $plural_key ] = true;
			}
		}

		if ( '' === $header ) {
			$issues[] = 'languages/ntc-block.pot: gettext header entry is missing';
		}

		return array(
			'header'   => $header,
			'messages' => $messages,
		);
	}

	/**
	 * Read one possibly multiline PO field.
	 *
	 * @param string $entry POT entry.
	 * @param string $field Field name.
	 * @return string|null Decoded value.
	 */
	private function po_field( string $entry, string $field ): ?string {
		$lines   = preg_split( '/\R/', $entry ) ?: array();
		$value   = '';
		$reading = false;

		foreach ( $lines as $line ) {
			if ( ! $reading ) {
				if ( ! preg_match( '/^' . preg_quote( $field, '/' ) . '\s+("(?:[^"\\\\]|\\\\.)*")$/', $line, $match ) ) {
					continue;
				}
				$reading = true;
				$piece   = json_decode( $match[1], true );
				$value  .= is_string( $piece ) ? $piece : '';
				continue;
			}

			if ( preg_match( '/^("(?:[^"\\\\]|\\\\.)*")$/', $line, $match ) ) {
				$piece  = json_decode( $match[1], true );
				$value .= is_string( $piece ) ? $piece : '';
			} else {
				break;
			}
		}

		return $reading ? $value : null;
	}

	/**
	 * Format a gettext key for failure output.
	 *
	 * @param string $key Context-null-delimited message key.
	 * @return string Human-readable key.
	 */
	private function translation_key_label( string $key ): string {
		list( $context, $message ) = array_pad( explode( "\x04", $key, 2 ), 2, '' );
		if ( '' === $context ) {
			return 'msgid "' . $message . '"';
		}
		return sprintf( 'msgctxt "%s" / msgid "%s"', $context, $message );
	}

	/**
	 * Find theme files by extension, pruning dependency and generated output trees.
	 *
	 * @param string[] $extensions Lowercase extensions without dots.
	 * @return string[] Absolute paths.
	 */
	private function files_with_extensions( array $extensions ): array {
		$files    = array();
		$iterator = new RecursiveIteratorIterator(
			new RecursiveCallbackFilterIterator(
				new RecursiveDirectoryIterator( $this->theme_root, FilesystemIterator::SKIP_DOTS ),
				static function ( SplFileInfo $file ): bool {
					// Prune before descending: Playwright can remove its output mid-run.
					return ! $file->isLink() && ( ! $file->isDir() || ! in_array(
						$file->getFilename(),
						array( '.git', '.local', 'node_modules', 'vendor', 'artifacts', 'test-results', 'playwright-report' ),
						true
					) );
				}
			)
		);

		foreach ( $iterator as $file ) {
			if ( ! $file->isFile() ) {
				continue;
			}

			$path = $file->getPathname();

			if ( in_array( strtolower( $file->getExtension() ), $extensions, true ) ) {
				$files[] = $path;
			}
		}

		sort( $files );
		return $files;
	}

	/**
	 * Return a normalized path relative to the theme.
	 *
	 * @param string $path Absolute path.
	 * @return string Relative path.
	 */
	private function relative_path( string $path ): string {
		$relative = substr( $path, strlen( $this->theme_root ) );
		return ltrim( str_replace( '\\', '/', $relative ), '/' );
	}

	/**
	 * Read a file or fail clearly.
	 *
	 * @param string $path Absolute path.
	 * @return string File contents.
	 */
	private function read_file( string $path ): string {
		$contents = file_get_contents( $path );
		if ( false === $contents ) {
			throw new RuntimeException( 'Unable to read ' . $this->relative_path( $path ) );
		}
		return $contents;
	}

	/**
	 * Decode and cache a JSON file.
	 *
	 * @param string $path Absolute path.
	 * @return array<mixed> Decoded document.
	 */
	private function decode_json_file( string $path ): array {
		if ( isset( $this->json_cache[ $path ] ) ) {
			return $this->json_cache[ $path ];
		}

		$contents = $this->read_file( $path );
		if ( str_starts_with( $contents, "\xEF\xBB\xBF" ) ) {
			throw new RuntimeException( 'UTF-8 BOM is not allowed' );
		}

		try {
			$decoded = json_decode( $contents, true, 512, JSON_THROW_ON_ERROR );
		} catch ( JsonException $error ) {
			throw new RuntimeException( $error->getMessage(), 0, $error );
		}

		if ( ! is_array( $decoded ) ) {
			throw new RuntimeException( 'top-level JSON value must be an object or array' );
		}

		$this->json_cache[ $path ] = $decoded;
		return $decoded;
	}

	/**
	 * Read WordPress theme metadata from style.css.
	 *
	 * @return array<string, string> Theme headers.
	 */
	private function theme_headers(): array {
		$contents = substr( $this->read_file( $this->theme_root . '/style.css' ), 0, 8192 );
		$headers  = array();

		foreach ( array( 'Theme Name', 'Description', 'Requires at least', 'Tested up to', 'Requires PHP', 'Version', 'Text Domain' ) as $name ) {
			if ( preg_match( '/^[ \t\/*#@]*' . preg_quote( $name, '/' ) . ':\s*(.+)$/mi', $contents, $match ) ) {
				$headers[ $name ] = trim( $match[1] );
			} else {
				throw new RuntimeException( 'style.css is missing the ' . $name . ' header' );
			}
		}

		return $headers;
	}

	/**
	 * Require a key of an expected PHP type.
	 *
	 * @param array<mixed> $document Document being checked.
	 * @param string       $key      Required key.
	 * @param string       $label    File label.
	 * @param string[]     $issues   Collected issues.
	 * @param string       $type     Expected gettype() value.
	 * @return void
	 */
	private function require_array_key( array $document, string $key, string $label, array &$issues, string $type ): void {
		if ( ! array_key_exists( $key, $document ) ) {
			$issues[] = $label . ': missing ' . $key;
			return;
		}

		if ( $type !== gettype( $document[ $key ] ) ) {
			$issues[] = sprintf( '%s: %s must be a %s', $label, $key, $type );
		}
	}

	/**
	 * Extract a WordPress release from a theme schema URL.
	 *
	 * @param mixed $schema Schema value.
	 * @return string Version or empty string.
	 */
	private function wordpress_schema_version( $schema ): string {
		if ( is_string( $schema ) && preg_match( '#^https://schemas\.wp\.org/wp/([0-9]+(?:\.[0-9]+)+)/theme\.json$#', $schema, $match ) ) {
			return $match[1];
		}
		return '';
	}

	/**
	 * Validate block metadata's file: references.
	 *
	 * @param string       $metadata_file block.json path.
	 * @param array<mixed> $document      Decoded block metadata.
	 * @param string[]     $issues        Collected issues.
	 * @return void
	 */
	private function validate_block_file_references( string $metadata_file, array $document, array &$issues ): void {
		$fields = array( 'editorScript', 'editorStyle', 'render', 'script', 'style', 'viewScript', 'viewScriptModule', 'viewStyle' );

		foreach ( $fields as $field ) {
			if ( ! isset( $document[ $field ] ) ) {
				continue;
			}

			$values = is_array( $document[ $field ] ) ? $document[ $field ] : array( $document[ $field ] );
			foreach ( $values as $value ) {
				if ( ! is_string( $value ) || ! str_starts_with( $value, 'file:' ) ) {
					continue;
				}

				$relative = preg_replace( '#^\./#', '', substr( $value, 5 ) );
				$target   = dirname( $metadata_file ) . '/' . $relative;
				if ( ! is_file( $target ) ) {
					$issues[] = sprintf( '%s: %s references missing file %s', $this->relative_path( $metadata_file ), $field, $relative );
				}
			}
		}
	}

	/**
	 * Ensure theme.json font files exist.
	 *
	 * @param array<mixed> $theme  Decoded theme.json.
	 * @param string[]     $issues Collected issues.
	 * @return void
	 */
	private function validate_font_references( array $theme, array &$issues ): void {
		$families = $theme['settings']['typography']['fontFamilies'] ?? array();

		foreach ( $families as $family ) {
			if ( ! empty( $family['fontFace'] ) ) {
				$issues[] = 'theme.json: fonts belong to the site Font Library, not the theme package';
			}
			foreach ( $family['fontFace'] ?? array() as $face ) {
				$sources = $face['src'] ?? array();
				$sources = is_array( $sources ) ? $sources : array( $sources );
				foreach ( $sources as $source ) {
					if ( ! is_string( $source ) || ! str_starts_with( $source, 'file:' ) ) {
						continue;
					}

					$relative = preg_replace( '#^\./#', '', substr( $source, 5 ) );
					if ( ! is_file( $this->theme_root . '/' . $relative ) ) {
						$issues[] = 'theme.json: font source does not exist: ' . $relative;
					}
				}
			}
		}
	}

	/**
	 * Compare the requested schema with local WordPress core when available.
	 *
	 * @param string   $schema_version Theme schema release.
	 * @param string[] $issues         Collected issues.
	 * @return void
	 */
	private function validate_schema_against_local_core( string $schema_version, array &$issues ): void {
		$wordpress_root = $this->find_wordpress_root();
		$version_file   = '' === $wordpress_root ? '' : $wordpress_root . '/wp-includes/version.php';

		if ( '' === $schema_version || ! is_readable( $version_file ) ) {
			return;
		}

		$contents = $this->read_file( $version_file );
		if ( preg_match( '/\$wp_version\s*=\s*[\'\"]([^\'\"]+)[\'\"]/', $contents, $match ) ) {
			$core_version = preg_replace( '/[^0-9.].*$/', '', $match[1] );
			if ( version_compare( $core_version, $schema_version, '<' ) ) {
				$issues[] = sprintf( 'theme.json: schema %s is newer than local WordPress core %s', $schema_version, $core_version );
			}
		}
	}

	/**
	 * Locate WordPress from NTC_WORDPRESS_ROOT or this theme's installation.
	 *
	 * @return string Absolute WordPress root or empty string.
	 */
	private function find_wordpress_root(): string {
		$environment = getenv( 'NTC_WORDPRESS_ROOT' );
		$candidates  = array();

		if ( is_string( $environment ) && '' !== trim( $environment ) ) {
			$candidates[] = trim( $environment );
		}

		$candidates[] = dirname( $this->theme_root, 3 );

		foreach ( $candidates as $candidate ) {
			$candidate = rtrim( str_replace( '\\', '/', $candidate ), '/' );
			if ( is_file( $candidate . '/wp-includes/class-wp-block-parser.php' ) ) {
				return $candidate;
			}
		}

		return '';
	}

	/**
	 * Throw one readable exception for a set of issues.
	 *
	 * @param string   $heading Failure heading.
	 * @param string[] $issues  Collected issues.
	 * @return void
	 */
	private function throw_for_issues( string $heading, array $issues ): void {
		if ( empty( $issues ) ) {
			return;
		}

		$issues = array_values( array_unique( $issues ) );
		sort( $issues );
		throw new RuntimeException( $heading . "\n  - " . implode( "\n  - ", $issues ) );
	}
}
