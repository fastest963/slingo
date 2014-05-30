<?php

require("config.php");
//we should try to validate the config at least before attempting to install
require("validateConfig.php");
ini_set('display_errors', 'On');
if (defined('E_DEPRECATED')) {
    error_reporting(E_ALL & ~E_DEPRECATED);
} else {
    error_reporting(E_ALL);
}

echo "Installing database...\n";
$db = TranslationDB::getInstance();
if ($db->install(true)) {
    echo "Successfully installed database...\n";
} else {
    echo "Failed to install database!\n";
    die();
}

//todo: ask for login of global admin
//todo: should we ask for default permissions?

//EOF
