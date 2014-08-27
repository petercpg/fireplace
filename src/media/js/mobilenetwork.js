define('mobilenetwork',
       ['l10n', 'log', 'settings', 'tracking', 'user', 'utils'],
       function(l10n, log, settings, tracking, user, utils) {
    var console = log('mobilenetwork');
    var persistent_console = log.persistent('mobilenetwork', 'change');
    var gettext = l10n.gettext;

    var REGIONS = settings.REGION_CHOICES_SLUG;

    var regions = {
        // United States
        310: 'us',

        // United Kingdom
        235: 'uk',

        // Brazil
        724: 'br',

        // Spain
        214: 'es',

        // Colombia
        732: 'co',

        // Venezuela
        734: 've',

        // Poland
        260: 'pl',

        // Mexico
        334: 'mx',

        // Hungary
        216: 'hu',

        // Germany
        262: 'de',

        // Montenegro
        297: 'me',

        // Serbia
        220: 'rs',

        // Greece
        202: 'gr',

        // Peru
        716: 'pe',

        // Uruguay
        748: 'uy',

        // Argentina
        722: 'ar',

        // China
        460: 'cn',

        // Italy
        222: 'it',

        // Chile
        703: 'cl',

        // El Salvador
        706: 'sv',

        // Guatemala
        704: 'gt',

        // Ecuador
        740: 'ec',

        // Costa Rica
        712: 'cr',

        // Panama
        714: 'pa',

        // Nicaragua
        710: 'ni',

        // France
        208: 'fr',

        // Bangladesh
        470: 'bd',

        // Japan
        440: 'jp'
    };

    var carriers = [
        'america_movil',
        'carrierless',
        'china_unicom',
        'deutsche_telekom',
        'etisalat',
        'grameenphone',
        'hutchinson_three_group',
        'kddi',
        'kt',
        'megafon',
        'qtel',
        'singtel',
        'smart',
        'sprint',
        'telecom_italia_group',
        'telefonica',
        'telenor',
        'tmn',
        'vimpelcom'
    ];

    var carriersRegions = {
        // United States
        // 26, 160, 170, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290
        // 330, 490, 580, 660, 800, 310...
        310: 'deutsche_telekom',

        // United Kingdom
        235: {
            2: 'telefonica',
            10: 'telefonica',
            11: 'telefonica',
            30: 'deutsche_telekom'
        },

        // Brazil
        // 6, 10, 11, 23
        724: 'telefonica',

        // Spain
        // 5, 7
        214: 'telefonica',

        // Colombia
        // 102, 123
        732: 'telefonica',

        // Venezuela
        734: {
            4: 'telefonica'
        },

        // Poland
        260: {
            2: 'deutsche_telekom'
        },

        // Greece
        202: {
            // This actually belongs to Vodafone, which DT owns
            5: 'deutsche_telekom'
        },

        // Mexico
        334: {
            2: 'america_movil',
            3: 'telefonica',
            20: 'america_movil'
        },

        // Hungary
        216: {
            1: 'telenor',
            20: 'telenor',
            30: 'deutsche_telekom',
            // Actually Vodafone but treat like DT
            70: 'deutsche_telekom'
        },

        // Germany
        // 1, 6
        262: {
            1: 'deutsche_telekom',
            2: 'deutsche_telekom',
            7: 'o2'
        },

        // Slovakia
        231: {
            2: 'deutsche_telekom',
            4: 'deutsche_telekom',
            6: 'telefonica'
        },

        // Czech Republic
        // Austria
        // 2, 8
        232: 'telefonica',

        // Guatemala
        704: {
            3: 'telefonica'
        },

        // El Salvador
        706: {
            4: 'telefonica'
        },

        // Nicaragua
        710: {
            3: 'telefonica'
        },

        // Costa Rica
        712: {
            4: 'telefonica'
        },

        // Panama
        714: {
            2: 'telefonica',
            3: 'america_movil'
        },

        // Chile
        730: {
            2: 'telefonica'
        },

        // Ecuador
        740: {
            1: 'america_movil'
        },

        // Paraguay
        744: {
            4: 'telefonica',
        },

        // Peru
        716: {
            6: 'telefonica',
            10: 'america_movil'
        },

        // Argentina
        722: {
            10: 'telefonica',
            70: 'telefonica',
            // Claro
            310: 'america_movil',
            320: 'america_movil',
            330: 'america_movil'
        },

        // Uruguay
        748: {
            7: 'telefonica',
            // Claro.
            10: 'america_movil'
        },

        // Serbia
        // 1, 2
        220: 'telenor',

        // Montenegro
        297: {
            1: 'telenor'
        },

        // China
        // 1, 3, 6
        460: 'china_unicom',

        // Bangladesh
        470: {
            1: 'grameenphone'
        },

        // Japan
        // 7, 8, 49, 50, 51, 52, 53, 54, 55, 56, 70, 71, 72, 73, 74, 75, 76,
        // 77, 79, 88, 89
        440: 'kddi'
    };

    function getNetwork(mcc, mnc) {
        console.tagged('getNetwork').log('Trying MCC = ' + mcc + ', MNC = ' + mnc);

        // Look up region and carrier from MCC (Mobile Country Code)
        // and MNC (Mobile Network Code).

        // Strip leading zeros and make it a string.
        mcc = (+mcc || 0) + '';
        mnc = (+mnc || 0) + '';

        // Workaround for Polish SIMs (bug 876391, bug 880369).
        if (mcc === '260' && mnc[0] === '2') {
            mnc = 2;
        }
        // Colombia.
        if (mcc === '732' && mnc[0] === '1') {
            mnc = 123;
        }
        // Spain.
        if (mcc === '214') {
            if (mnc[0] === '5') {
                mnc = 5;
            }
            if (mnc[0] === '7') {
                mnc = '7';
            }
        }

        // Make them integers.
        mcc = +mcc || 0;
        mnc = +mnc || 0;

        var carrier = carriersRegions[mcc];

        // If it's a string, the carrier is the same for every MNC.
        // If it's an object, the carrier is different based on the MNC.
        if (typeof carrier === 'object') {
            carrier = carrier[mnc];
        }

        return {
            region: regions[mcc] || null,
            carrier: carrier || null
        };
    }

    // Parse and return mcc/mnc from a MozMobileConnection object.
    function handleConnection(conn, console) {
        function mccify(network) {
            var mccParts = (network || '-').split('-');
            if (mccParts.length < 2) {
                return null;
            }
            return {mcc: mccParts[0], mnc: mccParts[1]};
        }
        var lastNetwork = mccify(conn.lastKnownHomeNetwork ||
                                 conn.lastKnownNetwork);
        console.log('lastKnownNetwork:', conn.lastKnownNetwork);
        if (lastNetwork) {
            console.log('Using lastKnownNetwork:', lastNetwork);
            return lastNetwork;
        } else {
            console.log('Unknown network.');
            return {mcc: undefined, mnc: undefined};
        }
    }

    function detectMobileNetwork(navigator, _utils) {
        var GET = (_utils || utils).getVars();
        var carrier = GET.carrier || user.get_setting('carrier') || null;
        var consoleTagged = console.tagged('detectMobileNetwork');
        var newSettings = {};
        var mccs, region, source, i, pair;

        navigator = navigator || window.navigator;
        newSettings.carrier_sim = null;
        newSettings.region_sim = null;

        // Array of sources to look at, in order. Each source function returns
        // either an Array of mcc/mnc objects, or a falsey value.
        var sources = [
            ['GET mcc/mnc', getMCCMNC],
            ['GET mccs', getMCCs],
            ['dual SIM', getMultiSIM],
            ['SIM', getSIM],
            ['None', noNetwork],
        ];

        // Loop through the sources, continue as long as the result is falsey.
        // The first source to return a non-falsey value is the one we'll use.
        for (i = 0; i < sources.length && !mccs; i++) {
            source = sources[i][0];
            mccs = sources[i][1]();
        }

        if (mccs.length) {
            // Go through the list of mcc/mnc, try to extract network information
            // from each, stop as soon as we have a valid region, storing the
            // result in the settings.
            for (i = 0; i < mccs.length; i++) {
                pair = mccs[i];
                consoleTagged.log('mccs[' + i + ']:', pair);
                // Look up region and carrier from mcc/mnc, applying
                // workarounds for special cases.
                var network = getNetwork(pair.mcc, pair.mnc);

                if (carrier !== network.carrier) {
                    persistent_console.log('Carrier changed by ' + source + ':',
                                           carrier, '→', network.carrier);
                }

                if (network.region) {
                    region = newSettings.region_sim = network.region;
                    carrier = newSettings.carrier_sim = network.carrier;
                    break;
                }
            }
        }

        user.update_settings(newSettings);

        // Send the changed region to GA/UA.
        tracking.setVar(11, 'region', region);

        // Potential sources used by detectMobileNetwork() are defined below:

        // Get mobile region and carrier information passed via mcc/mnc
        // querystring parameters.
        function getMCCMNC() {
            if (GET.mcc || GET.mnc) {
                return [{mcc: GET.mcc, mnc: GET.mnc}];
            }
        }

        // Get mobile region and carrier information passed via a single 'mccs'
        // querystring parameter containing multiple mcc/mnc pairs.
        function getMCCs() {
            try {
                return JSON.parse(GET.mccs);
            } catch(e) {}
        }

        // Get mcc/mnc pairs using mozMobileConnections (needs to be privileged).
        function getMultiSIM() {
            try {
                if (navigator.mozMobileConnections) {
                    consoleTagged.log('navigator.mozMobileConnections available');
                    var mccs = [],
                        conns = navigator.mozMobileConnections;
                    for (var i = 0; i < conns.length; i++) {
                        mccs.push(handleConnection(conns[i], consoleTagged));
                    }
                    return mccs;
                }
            } catch(e) {
                // Fail gracefully if `navigator.mozMobileConnection(s)`
                // gives us problems.
                consoleTagged.warn('Error accessing navigator.mozMobileConnections:', e);
            }
        }

        // Get a single mcc/mnc pair using mozMobileConnection (needs to be privileged,
        // legacy API from before mozMobileConnections was introduced).
        function getSIM() {
            try {
                if (navigator.mozMobileConnection) {
                    consoleTagged.log('navigator.mozMobileConnection available');
                    return [handleConnection(navigator.mozMobileConnection, consoleTagged)];
                }
            } catch(e) {
                // Fail gracefully if `navigator.mozMobileConnection`
                // gives us problems.
                consoleTagged.warn('Error accessing navigator.mozMobileConnection:', e);
            }
        }

        // Fallback.
        function noNetwork() {
            consoleTagged.log('navigator.mozMobileConnection(s) unavailable and no GET parameter provided');
            return [];
        }
    }

    detectMobileNetwork(navigator);

    return {
        carriers: carriers,
        detectMobileNetwork: detectMobileNetwork,
        getNetwork: getNetwork
    };
});
