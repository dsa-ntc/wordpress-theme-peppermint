<?php
/**
 * Command-line entry point for NTC Block's offline test suite.
 *
 * @package NTC_Block
 */

declare(strict_types=1);

require_once __DIR__ . '/suite.php';

exit( NTC_Block_Test_Suite::main( $argv ) );
