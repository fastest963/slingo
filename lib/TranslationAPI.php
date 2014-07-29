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
        $result = TranslationAuth::getInstance()->logout();
        return $result;
    }

    public static function getLoggedInUser()
    {
        $auth = TranslationAuth::getInstance();
        $user = $auth->getUserArray();
        return $user;
    }

    /*** User-related methods ***/

    //returns a keyed assoc array by projectID and then keyed by language
    //each "level" also returns a "default" which is the fallback if a permission isn't defined somewhere
    public static function getMyPermissions($projectID = null, $language = null)
    {
        $auth = TranslationAuth::getInstance();
        $permissions = $auth->getLanguagesPermissions($projectID, $language);
        return $permissions;
    }

    public static function getPermissionsForUserID($userID)
    {
        $permissions = TranslationUser::getUserPermissions($userID);
        return $permissions;
    }

    public static function modifyMySettings($disablePoints = null)
    {
        $auth = TranslationAuth::getInstance();
        $result = $auth->modifySettings($disablePoints);
        return $result;
    }

    public static function modifyUserGlobalPermissions($userID, $permissions = null, $globalAdmin = null, $deleteAnyOtherPermissions = null)
    {
        if (is_null($deleteAnyOtherPermissions)) {
            $deleteAnyOtherPermissions = true;
        }
        $result = TranslationUser::modifyUserGlobalPermissions($userID, $permissions, $globalAdmin, $deleteAnyOtherPermissions);
        return $result;
    }

    public static function modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null)
    {
        $result = TranslationUser::modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID);
        return $result;
    }

    public static function modifyUserProjectPermissions($userID, $projectID, $permissions, $deleteOtherLanguagePermissions = null)
    {
        if (is_null($deleteOtherLanguagePermissions)) {
            $deleteOtherLanguagePermissions = false;
        }
        $result = TranslationUser::modifyUserProjectPermissions($userID, $projectID, $permissions, $deleteOtherLanguagePermissions);
        return $result;
    }

    public static function increaseUserPoints($userID, $points)
    {
        //when an admin adds points, it skips checking disabled
        $result = TranslationUser::increaseUserPoints($userID, $points, false);
        return $result;
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
        //todo: max length on name?
        $db = TranslationDB::getInstance();
        $return = $db->storeNewProject($name, $everyonePermission);
        return $return;
    }

    public static function deleteProject($projectID)
    {
        //todo: max length on name?
        $db = TranslationDB::getInstance();
        $return = $db->deleteProject($projectID);
        return $return;
    }

    public static function createLanguage($name, $projectID, $everyonePermission = null, $copyPermsFromLangID = null, $copyPermsFromLangProjectID = null)
    {
        $db = TranslationDB::getInstance();
        $copyPermissionsFrom = array();
        if (!empty($copyPermsFromLangID)) {
            $copyPermissionsFrom['id'] = $copyPermsFromLangID;
        }
        if (!empty($copyPermsFromLangProjectID)) {
            $copyPermissionsFrom['project'] = $copyPermsFromLangProjectID;
        }
        if (empty($copyPermissionsFrom)) {
            $copyPermissionsFrom = null;
        }
        $return = $db->storeNewLanguage($name, $projectID, null, $everyonePermission, $copyPermissionsFrom);
        return $return;
    }

    public static function deleteLanguage($languageID, $projectID)
    {
        $db = TranslationDB::getInstance();
        $return = $db->deleteLanguage($languageID, $projectID);
        return $return;
    }

    public static function getLanguage($languageID, $projectID)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getLanguage($languageID, $projectID);
        return $return;
    }

    public static function getLanguagesInProject($projectID)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getLanguagesInProject($projectID);
        return $return;
    }

    public static function getLanguagesStatsInProject($projectID, $languageIDs = null)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getLanguagesStats($projectID, $languageIDs);
        return $return;
    }

    /*** Language-related methods ***/

    public static function getUntranslatedLanguageStrings($projectID, $langID, $orderedByPriority = null, $limit = null)
    {
        if (is_null($orderedByPriority)) {
            $orderedByPriority = true;
        }
        if (is_null($limit)) {
            $limit = 10;
        }
        $db = TranslationDB::getInstance();
        $return = $db->getUntranslatedStrings($projectID, $langID, $orderedByPriority, $limit);
        return $return;
    }

    /*** String-related methods ***/

    public static function getString($stringID, $projectID, $langID)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getString($stringID, $projectID, $langID);
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

    /*** Admin-related methods ***/

    public static function getAutocompleteForUsername($query)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getAutocompleteForUsername($query);
        return $return;
    }

    public static function getAutocompleteForLanguage($query)
    {
        $db = TranslationDB::getInstance();
        $return = $db->getAutocompleteForLanguage($query);
        return $return;
    }

}
?>
