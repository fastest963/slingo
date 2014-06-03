<?php

class Auth_SessionAuth implements Auth_Template
{
    public function start($sessionID, $userIDKey = 'userID', $cookieName = 'TRNSSESS')
    {
        if (session_id() == "") {
            if (!empty($sessionID)) {
                session_id($sessionID);
            }
            if (isset($config['cookieName'])) {
                ini_set('session.name', $config['cookieName']);
            }
            session_start();
        }
        if (!isset($config['userIDKey'])) {
            throw new Exception("TranslationAuth cannot load userID from session without a specified userIDKey!");
        }
        $user = array('userID' => null,
                      'username' => null,
                      );
        $key = $config['userIDKey'];
        if (isset($_SESSION[$key])) {
            $user['userID'] = $_SESSION[$key];
        }
        return $user;
    }

    public function getCurrentUsername($userID)
    {
        //since our username is stored in the DB it'll be covered by load() in TranslationAuth
        return null;
    }

    public function login($username, $password)
    {
        $db = TranslationDB::getInstance();
        //todo: login?
        //todo: prevent _all_ from logging in
    }

    public function logout()
    {
        session_destroy();
        return true;
    }
}

//EOF
