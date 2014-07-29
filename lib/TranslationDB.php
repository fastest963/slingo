<?php

class TranslationDB
{
    private static $config;
    private static $instance;

    const ERROR_INVALID_PERMISSIONS = 1;
    const ERROR_DB_ERROR = 2;
    const ERROR_INVALID_PARAMS = 3;
    const ERROR_NOT_FOUND = 4;
    const ERROR_DUP_EXISTS = 5;
    const ERROR_UNKNOWN = 9;

    const DEFAULT_USER = "_all_";
    const TEMPLATE_LANG = "_template_";

    const PERMISSION_CAN_SUGGEST = 1;
    const PERMISSION_CAN_APPROVE = 2;
    const PERMISSION_ALL = 3; // 1|2

    /**
     * @var DB_Template
     */
    private $connection;

    public function __construct()
    {
        if (!isset(TranslationDB::$config['className'])) {
            throw new Exception("TranslationDB created without a valid configuration!");
        }

        $class = 'DB_' . TranslationDB::$config['className'];
        $this->connection = new $class();
        if (isset(TranslationDB::$config['connectArgs'])) {
            call_user_func_array(array($this->connection, 'connect'), TranslationDB::$config['connectArgs']);
        } else {
            call_user_func(array($this->connection, 'connect'));
        }
    }

    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new TranslationDB();
        }
        return self::$instance;
    }

    public static function setConfig($config)
    {
        self::$config = $config;
    }

    public function install($displayDebugOutput = false)
    {
        if (isset($_SERVER['REQUEST_METHOD'])) {
            throw new Exception("Cannot run TranslationDB::install from a web server request!");
        }
        return $this->connection->install($displayDebugOutput);
    }

    public function getUser($userID)
    {
        $return = array('user' => null,
                        'errorCode' => self::ERROR_NOT_FOUND,
                        );
        if (!empty($userID)) {
            $user = $this->connection->getUser($userID);
            if (!is_null($user)) {
                $return['user'] = $user;
                $return['errorCode'] = 0;
            }
        }
        return $return;
    }

    public function storeNewUser($username = null, $password = null, $userID = null, $permissions = null, $globalAdmin = false, $flags = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) && !is_null($userID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        if (!is_null($password)) {
            //todo: other password requirements??
            if (empty($password)) {
                $return['errorCode'] = self::ERROR_INVALID_PARAMS;
                return $return;
            }
            $password = TranslationUser::hashPassword($password, TranslationConfig::$config['auth']['passwordSalt']);
        }
        $generatedUserID = false;
        if (is_null($userID)) {
            $userID = $this->connection->getNextUserID();
            $generatedUserID = true;
        }
        if (!is_null($permissions)) {
            $permissions = (int)$permissions;
        }
        $globalAdmin = (bool)$globalAdmin;
        if (!is_null($flags)) {
            $flags = (int)$flags;
        }

        //todo: regex for username?

        $createResult = $this->connection->storeNewUser($userID, $username, $password, $permissions, $globalAdmin, $flags);
        $return['success'] = $createResult['success'];
        if (!$createResult['success'] && $createResult['exists']) {
            //if we generated a userID, fetch another one and try again in case there was a race condition with another storeNewUser call
            if ($generatedUserID) {
                $userID = $this->connection->getNextUserID();
                return $this->storeNewUser($username, $password, $userID, $permissions, $globalAdmin, $flags);
            }
            $return['errorCode'] = self::ERROR_DUP_EXISTS;
            return $return;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    //set permissions to false to remove global permissions (and fallback to defaults)
    public function modifyUserGlobalPermissions($userID, $permissions = null, $globalAdmin = null, $deleteOtherPermissions = true)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || (is_null($permissions) && is_null($globalAdmin))) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        //make sure they aren't changing the globalAdmin status of the default admin
        if ($globalAdmin === false && $userID == TranslationConfig::getDefaultAdminUserID()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }
        //they cannot make everyone a globalAdmin because wtf
        if ($globalAdmin === true && $userID == self::DEFAULT_USER) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $return['success'] = $this->connection->modifyUserGlobalPermissions($userID, $permissions, $globalAdmin, $deleteOtherPermissions);
        if (!$return['success']) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    //set permissions to false to remove permissions (and fallback to defaults)
    public function modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null, $deleteOtherLangPermissions = false)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || empty($projectID) || empty($languageID) || is_null($permissions)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $return['success'] = $this->connection->modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID, $deleteOtherLangPermissions);
        if (!$return['success']) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    //if there are literally NO permissions for a particular language/project it will NOT be returned in the assoc array
    public function getUserLanguagesPermissions($userID, $projectID = null, $language = null)
    {
        $return = array('permissions' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->getUserLanguagesPermissions($userID, $projectID, $language);
        if (empty($result['exists'])) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } elseif (!is_null($result['permissions'])) {
            $return['permissions'] = $result['permissions'];
            $return['errorCode'] = 0;
        }
        return $return;
    }

    public function modifyUserPassword($userID, $newPassword, $oldPassword = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || empty($newPassword)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        if ($userID == self::DEFAULT_USER) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (empty($oldPassword) && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }
        //todo: password requirements?
        $oldPassword = TranslationUser::hashPassword($oldPassword, TranslationConfig::$config['auth']['passwordSalt']);
        $newPassword = TranslationUser::hashPassword($newPassword, TranslationConfig::$config['auth']['passwordSalt']);

        //todo: what do we do about a custom auth situation?
    }

    public function modifyUserPoints($userID, $pointsToAdd = 0, $skipIfDisabled = true)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
        );

        if (empty($userID) || empty($pointsToAdd)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->modifyUserPoints($userID, $pointsToAdd, $skipIfDisabled);
        if (!$result['success']) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['newPoints'] = $result['newPoints'];
            $return['errorCode'] = 0;
        }
        return $return;
    }

    public function modifyUserFlags($userID, $flagsToAdd = 0, $flagsToRemove = 0)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || (empty($flagsToAdd) && empty($flagsToRemove))) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $return['success'] = $this->connection->modifyUserFlags($userID, $flagsToAdd, $flagsToRemove);
        if (!$return['success']) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    public function modifyUserUsername($userID, $newUsername, $password = null, $checkPassword = true)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || ($checkPassword && empty($password))) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        //todo: regex for username?

        $result = $this->connection->modifyUserUsername($userID, $newUsername, $password, $checkPassword);
        if (!$result['success']) {
            if ($result['exists']) {
                $return['errorCode'] = self::ERROR_DUP_EXISTS;
            } else {
                $return['errorCode'] = self::ERROR_NOT_FOUND;
            }
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
        }
        return $return;
    }

    //todo: delete account (except config's defaultAdminUserID or 1)

    //todo: copy permissions?
    public function storeNewProject($displayName, $everyonePermission = 0)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($displayName)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        //todo: figure out a better project ID?
        $projectID = substr(md5($displayName . time()), 0, 8);
        $result = $this->connection->storeNewLanguage($projectID, $displayName, self::TEMPLATE_LANG, $everyonePermission);
        if (!$result['success']) {
            if ($result['exists']) {
                $return['errorCode'] = self::ERROR_DUP_EXISTS;
            } else {
                $return['errorCode'] = self::ERROR_DB_ERROR;
            }
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
            $return['projectID'] = $projectID;
        }
        return $return;
    }

    public function deleteProject($projectID)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($projectID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        $result = $this->connection->deleteAllLanguagesForProject($projectID);
        if (!$result) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
        }
        return $return;
    }

    //todo: rename project

    public function storeNewLanguage($displayName, $projectID, $id = null, $everyonePermission = null, $copyPermissionsFrom = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($displayName) || empty($projectID) || (!empty($strings) && !is_array($strings))) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        if (is_null($copyPermissionsFrom)) {
            $permissions = new stdClass();
            if (!is_null($everyonePermission)) {
                $permissions[self::DEFAULT_USER] = (int)$everyonePermission;
            }
        } else {
            if (empty($copyPermissionsFrom['id']) || empty($copyPermissionsFrom['project'])) {
                $return['errorCode'] = self::ERROR_INVALID_PARAMS;
                return $return;
            }
            $lang = $this->connection->getLanguage($copyPermissionsFrom['id'], $copyPermissionsFrom['project'], false, false);
            if (empty($lang) || !isset($lang['permissions'])) {
                $return['errorCode'] = self::ERROR_NOT_FOUND;
                return $return;
            }
            $permissions = $lang['permissions'];
        }

        //todo: make sure $id is actually something valid

        if (empty($id)) {
            $id = mb_strtolower(preg_replace("/[^a-zA-Z0-9]+/", "", $displayName));
        }

        $result = $this->getTemplateForProject($projectID);
        if (empty($result['template'])) {
            $return['errorCode'] = $result['errorCode'];
            return $return;
        }
        $template = $result['template'];
        $strings = array();
        if (!empty($template['strings'])) {
            $strings = $template['strings'];
        }
        $version = (int)$template['version'];

        $result = $this->connection->storeNewLanguage($projectID, $displayName, $id, $strings, $version, $permissions);
        if (!$result['success']) {
            if ($result['exists']) {
                $return['errorCode'] = self::ERROR_DUP_EXISTS;
            } else {
                $return['errorCode'] = self::ERROR_DB_ERROR;
            }
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
            $return['languageID'] = $id;
        }
        return $return;
    }

    //todo: rename language

    public function deleteLanguage($id, $projectID = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($id)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        $result = $this->connection->deleteLanguage($id, $projectID);
        if (!$result) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
        }
        return $return;
    }

    public function getProjects($projectIDs = null, $includeStrings = false, $includeSuggestions = false)
    {
        $return = array('projects' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        $projects = $this->connection->getLanguageFromProjects(self::TEMPLATE_LANG, $projectIDs, $includeStrings, $includeSuggestions);
        if (empty($projects)) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $projectsStripped = array();
            foreach ($projects as $project) {
                unset($project['id']);
                $projectsStripped[] = $project;
            }
            $return['projects'] = $projectsStripped;
        }
        return $return;
    }

    public function getLanguage($id, $project)
    {
        $return = array('language' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($id) || empty($project)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $lang = $this->connection->getLanguage($id, $project);
        if (empty($lang)) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $return['language'] = $lang;
        }
        return $return;
    }

    public function getTemplateForProject($projectID)
    {
        $return = array('template' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($projectID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $lang = $this->connection->getLanguage(self::TEMPLATE_LANG, $projectID, true, false);
        if (empty($lang)) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $return['template'] = $lang;
        }
        return $return;
    }

    public function getLanguagesInProject($projectID)
    {
        $return = array('languages' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($projectID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $return['languages'] = $this->connection->getLanguages($projectID);
        $return['errorCode'] = 0;
        return $return;
    }

    public function getLanguagesStats($projectID, $ids = null)
    {
        $return = array('languages' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($projectID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->getLanguagesStats($projectID, $ids);
        if (!$result['success']) {
            $return['errorCode'] = self::ERROR_DB_ERROR;
        } elseif (empty($result['languages'])) {
            $return['languages'] = array();
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
            $return['languages'] = $result['languages'];
        }
        return $return;
    }

    public function getString($stringID, $project, $lang = self::TEMPLATE_LANG, $includeSuggestions = false)
    {
        $return = array('string' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($stringID) || empty($project) || empty($lang)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->getString($stringID, $project, $lang, $includeSuggestions);
        if (empty($result['string'])) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
            return $return;
        }
        $return = $result;
        if (!$includeSuggestions) {
            unset($return['suggestions']);
        }
        $return['errorCode'] = 0;
        return $return;
    }

    public function getUntranslatedStrings($project, $lang = self::TEMPLATE_LANG, $orderedByPriority = true, $limit = 0)
    {
        $return = array('strings' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($project) || empty($lang)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->getUntranslatedStrings($project, $lang, $orderedByPriority, $limit);
        if (is_null($result['strings'])) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
            return $return;
        }
        $return['strings'] = $result['strings'];
        return $return;
    }

    public function storeNewSuggestion($stringID, $projectID, $languageID, $suggestion)
    {

    }

    public function storeNewTemplate($projectID, $parsedStrings)
    {
        $return = array('success' => false,
                        'diffStrings' => null,
                        'newVersion' => null,
                        'errorCode' => TranslationDB::ERROR_UNKNOWN,
                        );
        if (!is_array($parsedStrings)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }

        //check permissions here??
        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PERMISSIONS;
            return $return;
        }
        //regex for stringID??

        foreach ($parsedStrings as $string) {
            if (!isset($string['stringID'])) {
                $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
                return $return;
            }
        }

        $result = $this->connection->updateProjectTemplate($projectID, $parsedStrings, self::TEMPLATE_LANG);
        if (!$result['success']) {
            $return['errorCode'] = TranslationDB::ERROR_NOT_FOUND;
            return $return;
        }
        $return['success'] = true;
        $return['errorCode'] = 0;
        $return['diffStrings'] = TranslationString::getDiffOfStrings($result['oldStrings'], $result['newStrings']);
        $return['newVersion'] = $result['newVersion'];
        return $return;
    }

    public function updateProjectFromStringsDiff($projectID, $diffStrings, $newVersion)
    {
        $return = array('languagesUpdated' => null,
                        'languagesFailed' => null,
                        'errorCode' => TranslationDB::ERROR_UNKNOWN,
                        );
        if (empty($projectID) || empty($diffStrings) || !is_array($diffStrings) || empty($newVersion) || !is_numeric($newVersion)) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
            return $return;
        }
        //check permissions here??
        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = TranslationDB::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        foreach ($diffStrings as $stringID => $string) {
            if (!isset($string['stringID']) || $stringID != $string['stringID']) {
                $return['errorCode'] = TranslationDB::ERROR_INVALID_PARAMS;
                return $return;
            }
        }

        $newVersion = (int)$newVersion;
        $requiredVersion = $newVersion - 1;
        $result = $this->connection->updateProjectFromStringsDiff($projectID, $diffStrings, $newVersion, $requiredVersion);
        $return['languagesUpdated'] = $result['updated'];
        $return['languagesFailed'] = $result['failed'];
        $return['errorCode'] = 0; //todo: if there are failed, should this still be 0??
        return $return;
    }

    //todo: make updateProjectFromTemplate

    //will also return user if their userID is an exact match for $query
    public function getAutocompleteForUsername($query, $limit = 10)
    {
        $return = array('users' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($query)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result['users'] = $this->connection->getAutocompleteForUsername($query, $limit);
        $result['errorCode'] = 0;
        return $result;
    }

    //will also return user if their userID is an exact match for $query
    public function getAutocompleteForLanguage($query, $limit = 10)
    {
        $return = array('languages' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($query)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result['languages'] = $this->connection->getAutocompleteForLanguages($query, $limit);
        $result['errorCode'] = 0;
        return $result;
    }
}

if (isset(TranslationConfig::$config['db'])) {
    TranslationDB::setConfig(TranslationConfig::$config['db']);
}

//EOF
