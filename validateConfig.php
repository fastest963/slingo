<?php

$fromCommandLine = false;
if (!class_exists('TranslationConfig', false)) {
    if (empty($argv[1]) || !file_exists($argv[1])) {
        echo "Usage: validateConfig.php {fileToValidate}\n";
        exit;
    }
    $fromCommandLine = true;
    require($argv[1]);

    if (!class_exists('TranslationConfig', false)) {
        echo "Config Error: Included {$argv[1]} but still missing TranslationConfig class. Did you change the code below the\n/* DO NOT EDIT BELOW THIS LINE */\n?\n";
        exit;
    }
}
if (!class_exists('TranslationAPI')) {
    echo "Config Error: Autoloader is broken! Failed to load TranslationAPI.php!\n";
    exit;
}

$config = TranslationConfig::$config;

if (empty($config['db'])) {
    echo "Config Error: Missing \"db\" configuration options!\n";
    exit;
}
if (empty($config['db']['className'])) {
    echo "Config Error: Missing \"[db][className]\" configuration options!\n";
    exit;
}
if (!class_exists('DB_' . $config['db']['className'])) {
    echo "Config Error: [db][className] is set to a class that cannot be found!\n";
    exit;
}
//todo: attempt to connect

if (empty($config['auth'])) {
    echo "Config Error: Missing \"auth\" configuration options!\n";
    exit;
}
if (empty($config['auth']['className'])) {
    echo "Config Error: Missing \"[auth][className]\" configuration options!\n";
    exit;
}
if (!class_exists('Auth_' . $config['auth']['className'])) {
    echo "Config Error: [auth][className] is set to a class that cannot be found!\n";
    exit;
}
//todo: attempt to start

if (isset($config['staticRegex']) && preg_match($config['staticRegex'], '') === false) {
    echo "Config Error: Invalid regex specified for \"staticRegex\"!\n";
    exit;
}
if (isset($config['variableRegex']) && preg_match($config['variableRegex'], '') === false) {
    echo "Config Error: Invalid regex specified for \"variableRegex\"!\n";
    exit;
}

if ($fromCommandLine) {
    echo "Config file is valid!\n";
}

//EOF
