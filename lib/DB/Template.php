<?php

interface DB_Template
{
    //todo: fix/move all these @return statements
    //todo: specify which unique indexes should exist

    public function __construct();

    /**
     * if connecting fails, it should throw an exception
     */
    public function connect();

    /**
     * Called from install.php
     * Add any indexes that don't already exist, add db if it doesn't exist, etc
     * @return bool success
     */
    public function install($displayDebugOutput = false);

    /**
     * if user isn't found return null
     *
     * @return array|null user information
     */
    public function getUser($userID);

    /**
     * @return int|string
     */
    public function getNextUserID();

    /**
     * @return array (success => bool, errorCode => int)
     */
    public function storeNewUser($userID, $username = null, $password = null, $permissions = 0, $globalAdmin = false);

    /**
     * @return bool success
     */
    public function modifyUserPermissions($userID, $permissions = null, $globalAdmin = null);

    /**
     * If user wasn't found, return null
     * @return array|null (permissions => int, globalAdmin => bool)
     */
    public function getUserPermissions($userID);

    /**
     * If globalAdmin then oldPassword is optional
     *
     * @return array (success => bool, errorCode => int)
     */
    public function modifyUserPassword($userID, $newPassword, $oldPassword = null);

    /**
     * This does NOT check permissions so you must not allow this to be called directly from the API
     * Returns null if user wasn't found
     *
     * @return int|null new value
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
    public function storeNewLanguage($projectID, $displayName, $id = null, $everyonePermission = 0, $strings = null);

    /**
     * if $ids is null, then return all languages in that project
     * @return array mapped languages keyed by languageID
     */
    public function getLanguages($projectID, $ids = null, $includeStrings = true, $includeSuggestions = true);

    /**
     * If not found, don't include key in array.
     * If $projectIDs is null, then return language from all projects
     * @return array mapped languages keyed by projectID
     */
    public function getLanguageFromProjects($id, $projectIDs = null, $includeStrings = true, $includeSuggestions = true);

    /**
     * If not found, return null
     * @return array|null mapped language
     */
    public function getLanguage($ids, $projectID, $includeStrings = true, $includeSuggestions = true);

    public function getString($id, $projectID, $lang, $includeSuggestions);

}

//EOF
