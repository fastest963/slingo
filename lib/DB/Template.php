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
    public function storeNewUser($userID, $username = null, $password = null, $permissions = null, $globalAdmin = false, $flags = null);

    /**
     * @return bool success
     */
    public function modifyUserGlobalPermissions($userID, $permissions = null, $globalAdmin = null, $deleteOtherPermissions = true);

    /**
     * @return bool success
     */
    public function modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null, $deleteOtherLangPermissions = false);

    /**
     * If user wasn't found, return null
     * @return array|null (permissions => int, globalAdmin => bool)
     */
    public function getUserLanguagesPermissions($userID, $projectID = null, $language = null);

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
     * @return array (success => bool, newPoints => int)
     */
    public function modifyUserPoints($userID, $pointsToAdd, $skipIfDisabled = true);

    /**
     * This does NOT check permissions so you must not allow this to be called directly from the API
     * Returns null if user wasn't found
     *
     * @return bool success
     */
    public function modifyUserFlags($userID, $flagsToAdd = 0, $flagsToRmove = 0);

    /**
     * @return array (success => bool, exists => bool)
     */
    public function modifyUserUsername($userID, $newUsername, $password = null, $checkPassword = true);

    /**
     * @return array ('success' => bool, 'errorCode' => int)
     */
    public function storeNewLanguage($projectID, $displayName, $id, $strings, $version = 0, $permissions = null);

    /**
     * This does NOT check permissions so you must not allow this to be called directly from the API
     * Returns false if there were no languages found
     *
     * @return bool success
     */
    public function deleteAllLanguagesForProject($projectID);

    /**
     * This does NOT check permissions so you must not allow this to be called directly from the API
     * Returns false if there were no languages found
     *
     * If projectID is not sent, then this language will be deleted from all projects
     *
     * @return bool success
     */
    public function deleteLanguage($id, $projectID = null);

    /**
     * if $ids is null, then return all languages in that project
     * @return array mapped languages keyed by languageID
     */
    public function getLanguages($projectID, $ids = null, $includeStrings = false, $includeSuggestions = false);

    /**
     * if $ids is null, then return all languages in that project
     * @return array (languages => of languages each with languageID, projectID, totalCount, translatedCount, success => bool)
     */
    public function getLanguagesStats($projectID, $ids = null);

    /**
     * If not found, don't include key in array.
     * If $projectIDs is null, then return language from all projects
     * @return array mapped languages keyed by projectID
     */
    public function getLanguageFromProjects($id, $projectIDs = null, $includeStrings = false, $includeSuggestions = false);

    /**
     * If not found, return null
     * @return array|null mapped language
     */
    public function getLanguage($ids, $projectID, $includeStrings = true, $includeSuggestions = true);

    public function getString($id, $projectID, $lang, $includeSuggestions);

    public function getUntranslatedStrings($project, $lang, $orderedByPriority = true, $limit = 0);

    public function updateProjectTemplate($projectID, $newStrings, $languageID = TranslationDB::TEMPLATE_LANG);

    public function updateProjectFromStringsDiff($projectID, $diffStrings, $newVersion, $requiredVersion = null);

    /**
     * Should also check to see if $search is exact match on userID
     *
     * @return array users
     */
    public function getAutocompleteForUsername($search, $limit = null);

    /**
     * Should also check to see if $search is exact match on languageID
     *
     * @return array languages
     */
    public function getAutocompleteForLanguages($search, $limit = null);

}

//EOF
