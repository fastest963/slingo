<?php

interface Auth_Template
{
    public function __construct();

    /**
     * @return array (userID => int|string, username => string)
     */
    public function start($sessionID);

    /**
     * $password is NOT hashed
     *
     * @return array (userID => int|string, username => string)
     */
    public function login($username, $password);

    /**
     * @return bool success
     */
    public function logout();
}

//EOF
