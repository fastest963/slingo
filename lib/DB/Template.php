<?php

interface DB_Template
{
    //todo: fix/move all these @return statements

    public function __construct();

    /**
     * if connecting fails, it should throw an exception
     */
    public function connect();

    /**
     * if user isn't found return null
     *
     * @return array|null user information
     */
    public function getUser($userID);

    /**
     * @return array (success => bool, errorCode => int)
     */
    public function storeNewUser($userID, $username = null, $password = null, $permissions = 0, $globalAdmin = false);

    /**
     * @return array (success => bool, errorCode => int)
     */
    public function modifyUserPermissions($userID, $permissions = null, $globalAdmin = null);

    /**
     * If globalAdmin then oldPassword is optional
     *
     * @return array (success => bool, errorCode => int)
     */
    public function modifyUserPassword($userID, $newPassword, $oldPassword = null);

    /**
     * This does NOT check permissions so you must not allow this to be called directly from the API
     *
     * @return array (success => bool, errorCode => int)
     */
    public function modifyUserPoints($userID, $pointsToAdd = 0);

    /**
     * If you want to copy permissions from another language then specify the ID/project
     * Ex: $copyPermissionsFrom = array('id' => 'en', 'project' => 'android');
     *
     * If specifying $everyonePermission and $copyPermissionsFrom then the copy overwrites
     *
     * @return array ('success' => bool, 'errorCode' => int)
     */
    public function storeNewLanguage($id, $project, $displayName, $everyonePermission = 0, $strings = null);

    /**
     * @return array ('language' => mixed, 'errorCode' => int)
     */
    public function getLanguage($id, $project);

    public function getString($id, $project, $lang, $includeSuggestions);

}

//EOF
