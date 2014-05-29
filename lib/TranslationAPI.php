<?php

class TranslationAPI
{

    public static function login($username, $password)
    {
        $auth = TranslationAuth::getInstance();
        $success = $auth->login($username, $password);
        $return = array('success' => $success,
                        'user' => $auth->getUserArray(),
                        );
        return $return;
    }

    public static function addSuggestion($stringID, $project, $language, $suggestion)
    {
        $return = array('success' => false);
        if (empty($stringID) || empty($project) || empty($language) || empty($suggestion)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsLoggedIn()) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        $db = TranslationDB::getInstance();
        $string = $db->getString($stringID, $project, $language, false);
        if (empty($string['string'])) {
            $return['errorCode'] = $string['errorCode'];
            return $return;
        }

        $variables = array();
        if (isset($string['string']['variables'])) {
            $variables = $string['string']['variables'];
        }
        $valid = TranslationString::validateString($suggestion, $variables);
        if (!$valid) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $db->storeNewSuggestion($stringID, $project, $language, $suggestion);
        //todo: this
        return $return;
    }

}
?>
