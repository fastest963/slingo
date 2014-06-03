<?php

interface Auth_Template
{
    public function __construct();

    /**
     * Returning username is optional.
     * @return array (userID => int|string, username => string|null)
     */
    public function start($sessionID);

    /**
     * Get the userID's username if it wasn't returned in start.
     * If null is returned then we will fetch the username from DB
     * @return string|null
     */
    public function getCurrentUsername($userID);

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
