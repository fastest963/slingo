<?php
if (!defined('CRYPT_BLOWFISH') || !CRYPT_BLOWFISH) {
    echo "Warning: Blowfish encryption is not enabled!\n";
}

require("config.php");
//we should try to validate the config at least before attempting to install
require("validateConfig.php");
ini_set('display_errors', 'On');
if (defined('E_DEPRECATED')) {
    error_reporting(E_ALL & ~E_DEPRECATED);
} else {
    error_reporting(E_ALL);
}

//ignore all session stuff for this script
ini_set('session.cache_limiter', '');
ini_set('session.use_cookies', 0);
function doNothing() {}
session_set_save_handler('doNothing', 'doNothing', 'doNothing', 'doNothing', 'doNothing', 'doNothing');
session_start();

//pretend we're the global admin
$auth = TranslationAuth::getInstance();
$auth->setIsGlobalAdmin(true);

echo "Install: Installing database...\n";
$db = TranslationDB::getInstance();
if ($db->install(true)) {
    echo "Install: Successfully installed database...\n";
} else {
    echo "Install: Failed to install database!\n";
    exit(1);
}
echo "\n";
echo "Install: Performing default user maintence/setup...\n";
$config = TranslationConfig::$config;
//check for default user permissions and create if doesn't exist
$user = $db->getUser(TranslationDB::DEFAULT_USER);
if ($user['errorCode'] == TranslationDB::ERROR_NOT_FOUND) {
    echo "DefaultUser: Creating default user account with permissions to suggest\n";
    $newUserResult = $db->storeNewUser(null, null, TranslationDB::DEFAULT_USER, TranslationDB::PERMISSION_CAN_SUGGEST);
    if (!$newUserResult['success']) {
        echo "DefaultUser: Failed to create default user account!\n";
        exit(1);
    }
}

//check for default admin
$defaultAdminUserID = TranslationConfig::getDefaultAdminUserID();
$admin = $db->getUser($defaultAdminUserID); //todo: wtfasdfasfd
if ($admin['errorCode'] == TranslationDB::ERROR_NOT_FOUND) {
    $password = uniqid("", true);
    if (empty($config['auth']['passwordSalt'])) {
        TranslationConfig::$config['auth']['passwordSalt'] = substr(sha1(time() . rand(0, 99999999)), 0, 23);
        echo "DefaultUser: Creating default admin account with username of \"admin\" and since no salt was provided, the password is incomprehensible.\n";
    } else {
        echo "DefaultUser: Creating default admin account with username of \"admin\" and password of \"$password\".\n";
    }
    $newUserResult = $db->storeNewUser("admin", $password, $defaultAdminUserID, 0, true);
    if (!$newUserResult['success']) {
        echo "DefaultUser: Failed to create default admin account!";
        exit(1);
    }
} elseif (!$admin['user']['globalAdmin']) {
    echo "DefaultUser: Adding global admin permissions to existing userID $defaultAdminUserID.\n";
    if (!$db->modifyUserGlobalPermissions($defaultAdminUserID, null, true)) {
        echo "DefaultUser: Failed to add global admin permissions to default admin account!\n";
        exit(1);
    }
}
echo "Install: Finished default user maintence/setup...\n";
echo "\n";

//EOF
