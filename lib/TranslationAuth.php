<?php

class TranslationAuth
{
    const DEFAULT_USERNAME = "Unknown";

    private static $instance;
    private static $config;
    private static $startSessionID = '';

    /**
     * @var object implements Auth_Template
     */
    private $auth;

    private $userID = null;
    private $username;
    private $globalAdmin;
    private $points;
    private $flags;
    private $loaded = false;

    private function __construct()
    {
        if (!isset(TranslationAuth::$config['className'])) {
            throw new Exception("TranslationAuth created without a valid configuration!");
        }

        $args = array(self::$startSessionID);
        if (isset(TranslationAuth::$config['startArgs'])) {
            //array_merge is super slow
            foreach (TranslationAuth::$config['startArgs'] as $arg) {
                $args[] = $arg;
            }
        }
        $class = "Auth_" . TranslationAuth::$config['className'];
        $this->auth = new $class();
        $startResult = call_user_func_array(array($this->auth, 'start'), $args);
        $this->handleLoginResult($startResult);
    }

    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new TranslationAuth();
        }
        return self::$instance;
    }

    public static function setConfig($config)
    {
        self::$config = $config;
    }

    public static function setStartSessionID($sessionID)
    {
        self::$startSessionID = $sessionID;
    }

    public function setUserID($userID)
    {
        $this->userID = $userID;
    }

    //should only be called from install.php
    public function setIsGlobalAdmin($isGlobalAdmin)
    {
        $this->globalAdmin = (bool)$isGlobalAdmin;
    }

    public function getIsLoggedIn()
    {
        return !empty($this->userID);
    }

    /**
     * @return int|string|null
     */
    public function getUserID()
    {
        return $this->userID;
    }

    public function getUserArray()
    {
        if (!$this->loaded) {
            $this->load();
        }
        $user = array('userID' => $this->userID,
                      'username' => $this->username,
                      'globalAdmin' => $this->globalAdmin,
                      'points' => $this->points,
                      'flags' => $this->flags,
                      );
        return $user;
    }

    public function load()
    {
        if ($this->loaded || empty($this->userID)) {
            return;
        }

        if (!isset($this->username)) {
            $this->username = $this->auth->getCurrentUsername($this->userID);
        }
        $db = TranslationDB::getInstance();
        $result = $db->getUser($this->userID);
        if (empty($result['user']) && $result['errorCode'] == TranslationDB::ERROR_NOT_FOUND) {
            //store this user in the db since this is the first time we've encountered them
            //this could happen if they used a third-party auth system
            $storeResult = $db->storeNewUser(null, null, $this->userID);
            if (!$storeResult['success']) {
                trigger_error("Failed to store userID {$this->userID} into DB after successful auth!", E_USER_ERROR);
                return false;
            }
            $user = array('points' => 0);
        } else {
            $user = $result['user'];
        }
        if (!isset($this->username) && !empty($user['username'])) {
            $this->username = $user['username'];
        }
        if (isset($user['globalAdmin'])) {
            $this->globalAdmin = (bool)$user['globalAdmin'];
        } else {
            $this->globalAdmin = false;
        }
        if (!empty($user['points'])) {
            $this->points = (int)$user['points'];
        } else {
            $this->points = 0;
        }
        if (!empty($user['flags'])) {
            $this->flags = (int)$user['flags'];
        } else {
            $this->flags = 0;
        }
        $this->loaded = true;
    }

    //if there are literally NO permissions for a particular language/project it will NOT be returned in the assoc array
    public function getLanguagesPermissions($projectID = null, $language = null)
    {
        $db = TranslationDB::getInstance();
        $permissions = $db->getUserLanguagesPermissions($this->userID, $projectID, $language);
        return $permissions;
    }

    /**
     * @return string
     */
    public function getUsername()
    {
        if (!isset($this->username)) {
            //try auth-based call first, then fall-back to load()
            $this->username = $this->auth->getCurrentUsername($this->userID);
            if (!isset($this->username)) {
                $this->load();
            }
        }
        return $this->username;
    }

    /**
     * @return bool
     */
    public function getIsGlobalAdmin()
    {
        if (!isset($this->globalAdmin)) {
            $this->load();
        }
        return $this->globalAdmin;
    }

    /**
     * @return int
     */
    public function getFlags()
    {
        if (!isset($this->flags)) {
            $this->load();
        }
        return $this->flags;
    }

    /**
     * @return int
     */
    public function getPoints()
    {
        if (!isset($this->points)) {
            $this->load();
        }
        return $this->points;
    }

    private function handleLoginResult($result)
    {
        if (empty($result) || empty($result['userID'])) {
            return;
        }
        $this->userID = $result['userID'];
        if (isset($result['username'])) {
            $this->username = $result['username'];
        }
        $this->loaded = false;
    }

    public function login($username, $password)
    {
        if (empty($username) || empty($password)) {
            return false;
        }

        if (!empty($this->userID)) {
            $this->logout();
        }

        $user = $this->auth->login($username, $password);
        if (empty($user) || empty($user['userID'])) {
            return false;
        }
        $this->handleLoginResult($user);
        return true;
    }

    //todo: register function

    public function logout()
    {
        if ($this->auth->logout() === false) {
            return false;
        }
        $this->userID = null;
        $this->username = null;
        $this->globalAdmin = null;
        $this->points = null;
        $this->loaded = false;
        return true;
    }

    public function modifySettings($disablePoints = null)
    {
        if (empty($this->userID)) {
            return false;
        }

        $flagsToAdd = 0;
        $flagsToRemove = 0;
        if ($disablePoints) {
            $flagsToAdd |= TranslationUser::FLAG_DISABLE_AUTO_POINTS;
        } elseif (!is_null($disablePoints)) {
            $flagsToRemove |= TranslationUser::FLAG_DISABLE_AUTO_POINTS;
        }
        $db = TranslationDB::getInstance();
        $result = $db->modifyUserFlags($this->userID, $flagsToAdd, $flagsToRemove);
        return $result;
    }
}

if (isset(TranslationConfig::$config['auth'])) {
    TranslationAuth::setConfig(TranslationConfig::$config['auth']);
}

//EOF
