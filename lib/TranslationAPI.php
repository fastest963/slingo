<?php

class TranslationAPI
{

    /*** Auth-related methods ***/

    public static function login($username, $password)
    {
        $auth = TranslationAuth::getInstance();
        $success = $auth->login($username, $password);
        $return = array('success' => $success,
                        'user' => $auth->getUserArray(),
                        );
        return $return;
    }

    public static function logout()
    {
        return TranslationAuth::getInstance()->logout();
    }

    public static function getLoggedInUser()
    {
        return TranslationAuth::getInstance()->getUserArray();
    }

    /*** Project-related methods ***/

    public static function listAllProjects()
    {
        $db = TranslationDB::getInstance();
        $return = $db->getProjects();
        return $return;
    }

    public static function createProject($name, $everyonePermission = null)
    {
        $return = array('success' => false);
        //todo: max length on name?
        if (empty($name)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }
        $db = TranslationDB::getInstance();
        $return = $db->storeNewProject($name, $everyonePermission);
        return $return;
    }

    public static function createLanguage($name, $projectID, $everyonePermission = null)
    {
        $return = array('success' => false);
        //todo: max length on name?
        if (empty($name)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }
        $db = TranslationDB::getInstance();
        $return = $db->storeNewLanguage($name, $projectID, null, $everyonePermission);
        return $return;
    }

    public static function addSuggestion($stringID, $projectID, $language, $suggestion)
    {
        $return = array('success' => false);
        if (empty($stringID) || empty($projectID) || empty($language) || empty($suggestion)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsLoggedIn()) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        $db = TranslationDB::getInstance();
        $string = $db->getString($stringID, $projectID, $language, false);
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
