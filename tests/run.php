<?php
/**
 * Command-line entry point for Peppermint's offline test suite.
 *
 * @package Peppermint
 */

declare(strict_types=1);

require_once __DIR__ . '/suite.php';

exit( Peppermint_Test_Suite::main( $argv ) );
