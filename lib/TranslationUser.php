<?php

class TranslationUser
{
    const FLAG_DISABLE_AUTO_POINTS = 1;
    /**
     * To decrease user points send in negative $points
     * @return array (errorCode => int, newPoints => int)
     */
    public static function increaseUserPoints($userID, $points = 0, $skipIfDisabled = true, $bypassAuth = false)
    {
        if (empty($userID) || empty($points) || is_infinite($points)) {
            return array('errorCode' => TranslationDB::ERROR_INVALID_PARAMS);
        }

        if (!$bypassAuth && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            return array('errorCode' => TranslationDB::ERROR_INVALID_PERMISSIONS);
        }

        $db = TranslationDB::getInstance();
        $result = $db->modifyUserPoints($userID, $points, $skipIfDisabled);
        return $result['success'];
    }

    public static function changeUserPassword($userID, $newPassword, $oldPassword = null)
    {
        //todo: do this
    }

    public static function hashPassword($password, $configuredSalt = null)
    {
        if (empty($configuredSalt)) {
            throw new Exception("Not salt provided for TranslationUser::hashPassword! Did you forget to set it in config?");
        }
        if (PHP_VERSION_ID > 50307) {
            $salt = '$2y$12$';
        } else {
            $salt = '$2a$12$';
        }
        return crypt($password, "{$salt}{$configuredSalt}\$");
    }

    public static function modifyUserGlobalPermissions($userID, $permissions = null, $globalAdmin = null, $deleteAnyOtherPermissions = true, $bypassAuth = false)
    {
        if (!$bypassAuth && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            return array('success' => false,
                         'errorCode' => TranslationDB::ERROR_INVALID_PERMISSIONS
                         );
        }

        $db = TranslationDB::getInstance();
        $result = $db->modifyUserGlobalPermissions($userID, $permissions, $globalAdmin, $deleteAnyOtherPermissions);
        return $result;
    }

    public static function getUserPermissions($userID)
    {
        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            return array('success' => false,
                         'errorCode' => TranslationDB::ERROR_INVALID_PERMISSIONS
                         );
        }

        $db = TranslationDB::getInstance();
        $result = $db->getUserLanguagesPermissions($userID);
        return $result;
    }

    public static function modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null, $bypassAuth = false)
    {
        if (!$bypassAuth && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            return array('success' => false,
                         'errorCode' => TranslationDB::ERROR_INVALID_PERMISSIONS
                         );
        }

        $db = TranslationDB::getInstance();
        $result = $db->modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null);
        return $result;
    }

    public static function modifyUserProjectPermissions($userID, $projectID, $permissions, $deleteOtherLanguagePermissions = true, $bypassAuth = false)
    {
        if (!$bypassAuth && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            return array('success' => false,
                         'errorCode' => TranslationDB::ERROR_INVALID_PERMISSIONS
                         );
        }

        $db = TranslationDB::getInstance();
        $result = $db->modifyUserLanguagePermissions($userID, $projectID, TranslationDB::TEMPLATE_LANG, $permissions, $deleteOtherLanguagePermissions);
        return $result;
    }

}

//EOF
