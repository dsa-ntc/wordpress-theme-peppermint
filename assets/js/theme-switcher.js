( function () {
	'use strict';

	var storageKey = 'ntc-color-scheme';
	var root = document.documentElement;
	var media = window.matchMedia ? window.matchMedia( '(prefers-color-scheme: dark)' ) : null;
	var preference = readPreference();
	var buttons = [];

	function isScheme( value ) {
		return 'light' === value || 'dark' === value;
	}

	function readPreference() {
		try {
			var value = window.localStorage.getItem( storageKey );
			return isScheme( value ) ? value : '';
		} catch ( error ) {
			return '';
		}
	}

	function writePreference( value ) {
		preference = value;

		try {
			if ( value ) {
				window.localStorage.setItem( storageKey, value );
			} else {
				window.localStorage.removeItem( storageKey );
			}
		} catch ( error ) {
			// If storage is unavailable, keep the choice for this page.
		}
	}

	function applyPreference() {
		if ( preference ) {
			root.setAttribute( 'data-ntc-color-scheme', preference );
		} else {
			root.removeAttribute( 'data-ntc-color-scheme' );
		}
	}

	// The appearance without a visitor override: a forced Light or Dark site
	// style from Global Styles, otherwise the device setting.
	function getAutomaticScheme() {
		var override = root.getAttribute( 'data-ntc-color-scheme' );

		// Read the CSS default after styles load, then restore the visitor override.
		root.removeAttribute( 'data-ntc-color-scheme' );
		var declaredScheme = window.getComputedStyle( root ).colorScheme || '';

		if ( null !== override ) {
			root.setAttribute( 'data-ntc-color-scheme', override );
		}

		if ( declaredScheme.includes( 'dark' ) !== declaredScheme.includes( 'light' ) ) {
			return declaredScheme.includes( 'dark' ) ? 'dark' : 'light';
		}

		return media && media.matches ? 'dark' : 'light';
	}

	function update() {
		var resolvedScheme = preference || getAutomaticScheme();

		root.setAttribute( 'data-ntc-resolved-scheme', resolvedScheme );
		buttons.forEach( function ( button ) {
			button.setAttribute( 'aria-pressed', 'dark' === resolvedScheme ? 'true' : 'false' );
			button.hidden = false;
		} );
	}

	function toggle() {
		var automaticScheme = getAutomaticScheme();
		var next = 'dark' === ( preference || automaticScheme ) ? 'light' : 'dark';

		// Choosing the automatic appearance clears the override, so the page
		// follows later device changes again.
		writePreference( next === automaticScheme ? '' : next );
		applyPreference();
		update();
	}

	function bindButtons() {
		document.querySelectorAll( '[data-ntc-theme-switcher]' ).forEach( function ( button ) {
			if ( -1 === buttons.indexOf( button ) ) {
				buttons.push( button );
				button.addEventListener( 'click', toggle );
			}
		} );

		update();
	}

	// Restore a saved Light or Dark choice before paint.
	applyPreference();
	if ( preference ) {
		root.setAttribute( 'data-ntc-resolved-scheme', preference );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', bindButtons, { once: true } );
	} else {
		bindButtons();
	}

	if ( media ) {
		var handleMediaChange = function () {
			if ( ! preference ) {
				update();
			}
		};

		if ( media.addEventListener ) {
			media.addEventListener( 'change', handleMediaChange );
		} else if ( media.addListener ) {
			media.addListener( handleMediaChange );
		}
	}

	// Keep other open tabs in step with this visitor's choice.
	window.addEventListener( 'storage', function ( event ) {
		if ( storageKey !== event.key && null !== event.key ) {
			return;
		}

		preference = readPreference();
		applyPreference();
		update();
	} );
}() );
