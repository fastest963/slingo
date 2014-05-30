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
    private $permissions;
    private $points;
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
        call_user_func_array(array($this->auth, 'start'), $args);
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
                      'permissions' => $this->permissions,
                      'globalAdmin' => $this->globalAdmin,
                      'points' => $this->points,
                      );
        return $user;
    }

    public function load()
    {
        if ($this->loaded) {
            return;
        }
        if (empty($this->userID)) {
            //todo: should we load default permissions?
            $user = array();
        } else {
            $db = TranslationDB::getInstance();
            $result = $db->getUser($this->userID);
            if (empty($result['user']) && $result['errorCode'] == TranslationDB::ERROR_NOT_FOUND) {
                //store this user in the db since this is the first time we've encountered them
                //this could happen if they used a third-party auth system
                //todo: lookup->store->set default perms
                if (!$db->storeNewUser($this->userID, null, null, 0, false)) {
                    return false;
                }
                $this->globalAdmin = 0;
                $this->permissions = 0;
                $this->points = 0;
                return;
            }
            $user = $result['user'];
        }
        if (!empty($user['username'])) {
            $this->username = $user['username'];
        } else if (empty($this->username)) { //don't overwrite a name we got from login
            $this->username = self::DEFAULT_USERNAME;
        }
        if (isset($user['globalAdmin'])) {
            $this->globalAdmin = (bool)$user['globalAdmin'];
        } else {
            $this->globalAdmin = false;
        }
        if (!empty($user['permissions'])) {
            $this->permissions = (int)$user['permissions'];
        } else {
            $this->permissions = 0;
        }
        if (!empty($user['points'])) {
            $this->points = (int)$user['points'];
        } else {
            $this->points = 0;
        }
        $this->loaded = true;
    }

    /**
     * @return array
     */
    public function getPermissions()
    {
        if (!isset($this->permissions)){
            $this->load();
        }
        return $this->permissions;
    }

    /**
     * @return string
     */
    public function getUsername()
    {
        if (!isset($this->username)) {
            $this->load();
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
        if (!empty($result['username'])) {
            $this->username = $result['username'];
        } else {
            //todo: somehow generate some username
            $this->username = self::DEFAULT_USERNAME;
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
            return;
        }
        $this->userID = null;
        $this->username = null;
        $this->globalAdmin = null;
        $this->permissions = null;
        $this->points = null;
        $this->loaded = false;
    }

}

if (isset(TranslationConfig::$config['auth'])) {
    TranslationAuth::setConfig(TranslationConfig::$config['auth']);
}

//EOF
