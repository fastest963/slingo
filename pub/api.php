<?php
require('../config.php');

// If an optional parameter is not sent with an API call then null will be sent
// params order should match the associated TranslationAPI function definition's order

class TranslationAPIDefinitions
{
    const OPTIONAL = 0;
    const REQUIRED = 1;

    public static function login()
    {
        $params = array('username' => self::REQUIRED,
                        'password' => self::REQUIRED,
        );
        return array('params' => $params);
    }

    public static function addSuggestion()
    {
        $params = array('stringID' => self::REQUIRED,
                        'project' => self::REQUIRED,
                        'language' => self::REQUIRED,
                        'suggestion' => self::REQUIRED,
                        );
        return array('params' => $params);
    }
}

function returnBadRequest($reason = null)
{
    header("{$_SERVER['SERVER_PROTOCOL']} 400 Bad Request", 400);
    if (!empty($reason)) {
        echo "Reason: $reason";
    }
    exit;
}

function returnJSON($return)
{
    echo json_encode($return);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    returnBadRequest('invalid_request');
    exit;
}

$postData = file_get_contents('php://input');
if (!empty($postData)) {
    //PHP 5.3 supports a depth param, which we want to utilize, if possible
    if (PHP_VERSION_ID > 50300) {
        $postData = json_decode($postData, true, 16);
    } else {
        $postData = json_decode($postData, true);
    }
}
if (empty($postData) || !isset($postData['header']) || empty($postData['method'])) {
    returnBadRequest('invalid_json');
    exit;
}

if (!method_exists('TranslationAPIDefinitions', $postData['method'])) {
    returnJSON(array('result' => null, 'error' => 'unknown_method'));
    exit;
}

if (!empty($postData['header']['sessionID'])) {
    TranslationAuth::setStartSessionID($postData['header']['sessionID']);
}

$definition = call_user_func(array('TranslationAPIDefinitions', $postData['method']));

if (!empty($definition['params'])) {
    //make array to hold args for the function we will eventually call on TranslationAPI
    $args = array();
    foreach ($definition['params'] as $paramName => $flags) {
        if (($flags & TranslationAPIDefinitions::REQUIRED) == TranslationAPIDefinitions::REQUIRED) {
            if (!isset($postData['params'][$paramName])) {
                returnJSON(array('result' => null, 'error' => 'missing_param', 'param' => $paramName));
                exit;
            }
        }
        if (isset($postData['params'][$paramName])) {
            $args[] = $postData['params'][$paramName];
        } else {
            $args[] = null;
        }
    }
    $return = call_user_func_array(array('TranslationAPI', $postData['method']), $args);
} else {
    $return = call_user_func(array('TranslationAPI', $postData['method']));
}

returnJSON($return);

//EOF
