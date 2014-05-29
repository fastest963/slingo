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

    const CAN_SUBMIT_SUGGESTION = 1;
    const CAN_APPROVE_PERMISSION = 2;

    /**
     * @var object implements DB_Template
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

    public function storeNewUser($userID, $username = null, $password = null, $permissions = 0, $globalAdmin = false)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }
        //todo: password requirements??
        //todo: hash password
        $createResult = $this->connection->storeNewUser($userID, $username, $password, $permissions, $globalAdmin);
        $return['success'] = $createResult['success'];
        if (!$createResult['success'] && $createResult['exists']) {
            $return['errorCode'] = self::ERROR_DUP_EXISTS;
            return $return;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    public function modifyUserPermissions($userID, $permissions = null, $globalAdmin = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || (is_null($permissions) && is_null($globalAdmin))) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        $return['success'] = $this->connection->modifyUserPermissions($userID, $permissions, $globalAdmin);
        if (!$return['success']) {
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
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

        if (empty($oldPassword) && !TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }
        //todo: password requirements?
        //todo: hash passwords

        //todo: what do we do about a custom auth situation?
    }

    public function modifyUserPoints($userID, $pointsToAdd = 0)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($userID) || empty($pointsToAdd)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        $result = $this->connection->modifyUserPoints($userID, $pointsToAdd);
        $return['success'] = $result;
        if (!$result) {
            //probably means oldPassword wasn't right
            $return['errorCode'] = self::ERROR_NOT_FOUND;
        } else {
            $return['errorCode'] = 0;
        }
        return $return;
    }

    //todo: storeNewProject

    public function storeNewLanguage($id, $project, $displayName = null, $everyonePermission = 0, $strings = null, $copyPermissionsFrom = null)
    {
        $return = array('success' => false,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );

        if (empty($locale) || empty($project)) {
            $return['errorCode'] = self::ERROR_INVALID_PARAMS;
            return $return;
        }

        if (!TranslationAuth::getInstance()->getIsGlobalAdmin()) {
            $return['errorCode'] = self::ERROR_INVALID_PERMISSIONS;
            return $return;
        }

        if (empty($displayName)) {
            $displayName = $id;
        }

        if (is_null($copyPermissionsFrom)) {
            $permissions = array(self::DEFAULT_USER => 0,
                                 );
            if (!empty($everyonePermission)) {
                $permissions[self::DEFAULT_USER] = (int)$everyonePermission;
            }
        } else {
            if (empty($copyPermissionsFrom['id']) || empty($copyPermissionsFrom['project'])) {
                $return['errorCode'] = self::ERROR_INVALID_PARAMS;
                return $return;
            }
            $lang = $this->connection->getLanguagePermissions($copyPermissionsFrom['id'], $copyPermissionsFrom['project']);
            if (empty($lang) || !isset($lang['permissions'])) {
                $return['errorCode'] = self::ERROR_NOT_FOUND;
                return $return;
            }
            $permissions = $lang['permissions'];
        }
        $result = $this->connection->storeNewLanguage($id, $project, $displayName, $permissions, $strings);
        if (!$result['success']) {
            if ($result['exists']) {
                $return['errorCode'] = self::ERROR_DUP_EXISTS;
            } else {
                $return['errorCode'] = self::ERROR_DB_ERROR;
            }
        } else {
            $return['errorCode'] = 0;
            $return['success'] = true;
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
        return $lang;
    }

    public function getTopUsers($limit = 10)
    {

    }

    public function getString($stringID, $project, $lang = self::TEMPLATE_LANG, $includeSuggestions = false)
    {
        $return = array('string' => null,
                        'errorCode' => self::ERROR_UNKNOWN,
                        );
        if (empty($stringID) || empty($project)) {
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

    public function storeNewSuggestion($stringID, $project, $lang, $suggestion)
    {

    }
}

if (isset(TranslationConfig::$config['db'])) {
    TranslationDB::setConfig(TranslationConfig::$config['db']);
}

//EOF
