<?php

/**
 * Requires pecl mongo driver version 1.2+
 */
class DB_MongoConnection implements DB_Template
{
    const COLL_TRANSLATIONS = 'translations';
    const COLL_USERS = 'users';

    const KEY_USER_ID = "_id";
    const KEY_LANG_ID = "i";
    const KEY_PROJECT = "p";
    const KEY_NAME = "n";
    const KEY_STRINGS = "s";
    const KEY_STRING_ID = "i";
    const KEY_PERMISSIONS = "m"; //object keyed by userID for translations and int for users
    const KEY_SUGGESTIONS = "sg"; //keyed by stringID and value of array
    const KEY_TSMODIFIED = "ts";
    const KEY_STRING_USERID = "u"; //last userID to modify the string
    const KEY_STRING_VARIABLES = "v";
    const KEY_STRING_VALUE = "s";
    const KEY_STRING_TRANSLATED = "st";
    const KEY_SUGGESTION_USERID = "u";
    const KEY_SUGGESTION_CREATED = "t";
    const KEY_SUGGESTION_VALUE = "v";
    const KEY_SUGGESTION_VOTES = "p"; //userIDs as a "set"
    const KEY_USERNAME = "u";
    const KEY_GLOBAL_ADMIN = "ga";
    const KEY_USER_POINTS = "p";
    const KEY_USER_PASSWORD = "w";
    const KEY_PRIORITY = "pr";
    const KEY_IS_TRANSLATED = "tr";
    const KEY_FLAGS = "f";
    const KEY_VERSION = "vs";

    private static $langMap = array(self::KEY_LANG_ID => 'id',
                                    self::KEY_PROJECT => 'projectID',
                                    self::KEY_NAME => 'displayName',
                                    self::KEY_PERMISSIONS => 'permissions',
                                    self::KEY_STRINGS => 'strings',
                                    self::KEY_SUGGESTIONS => 'suggestions',
                                    self::KEY_VERSION => 'version',
                                    );

    private static $userMap = array(self::KEY_USER_ID => 'userID',
                                    self::KEY_USERNAME => 'username',
                                    self::KEY_GLOBAL_ADMIN => 'globalAdmin',
                                    self::KEY_PERMISSIONS => 'permissions',
                                    self::KEY_USER_POINTS => 'points',
                                    self::KEY_FLAGS => 'flags',
                                    );

    private static $stringMap = array(self::KEY_STRING_ID => 'stringID',
                                      self::KEY_STRING_VALUE => 'value',
                                      self::KEY_STRING_TRANSLATED => 'translated',
                                      self::KEY_STRING_USERID => 'lastModifiedUserID',
                                      self::KEY_STRING_VARIABLES => 'variables',
                                      self::KEY_TSMODIFIED => 'tsModified',
                                      self::KEY_PRIORITY => 'priority',
                                      );

    private static $suggestionMap = array(self::KEY_SUGGESTION_VALUE => 'value',
                                          self::KEY_SUGGESTION_CREATED => 'tsCreated',
                                          self::KEY_SUGGESTION_USERID => 'submitterUserID',
                                          self::KEY_SUGGESTION_VOTES => 'userIDsVoted',
                                          );

    /**
     * @var MongoDB
     */
    private $db;
    private $collectionNames;

    public function __construct()
    {

    }

    public function connect($databaseName = 'translations', $host = '127.0.0.1', $port = '27017', $collectionNames = null)
    {
        if (empty($databaseName)) {
            throw new Exception("MongoConnection is missing databaseName in connect.");
        }
        if (isset($collectionNames)) {
            if (empty($collectionNames[self::COLL_TRANSLATIONS])) {
                throw new Exception("MongoConnection is missing collection name for translations collection.");
            }
            if (empty($collectionNames[self::COLL_USERS])) {
                throw new Exception("MongoConnection is missing collection name for users collection.");
            }
            $this->collectionNames = $collectionNames;
        } else {
            $this->collectionNames = array(self::COLL_TRANSLATIONS => self::COLL_TRANSLATIONS,
                                           self::COLL_USERS => self::COLL_USERS,
                                           );
        }
        $mongo = new Mongo("mongodb://$host:$port");
        $this->db = $mongo->selectDB($databaseName);
        //todo: slaveokay?
    }

    private function getCollection($collName)
    {
        if (!isset($this->db)) {
            throw new Exception("MongoConnection::connect was never called!");
        }
        return $this->db->selectCollection($this->collectionNames[$collName]);
    }

    private static function mapUser($doc)
    {
        if (empty($doc)) {
            return array();
        }

        $mapped = array();
        foreach ($doc as $key => $value) {
            if (isset(self::$userMap[$key])) {
                $mapped[self::$userMap[$key]] = $value;
            }
        }
        return $mapped;
    }

    private static function mapLanguage($doc)
    {
        if (empty($doc)) {
            return array();
        }

        $mapped = array();
        foreach ($doc as $key => $value) {
            if (!isset(self::$langMap[$key])) {
                continue;
            }
            switch ($key) {
                case self::KEY_STRINGS:
                    $mapped[self::$langMap[$key]] = self::mapStrings($value);
                    break;
                case self::KEY_SUGGESTIONS:
                    $mapped[self::$langMap[$key]] = self::mapSuggestions($value);
                    break;
                default:
                    $mapped[self::$langMap[$key]] = $value;
                    break;
            }
        }
        return $mapped;
    }

    private static function mapStrings($strings)
    {
        if (empty($strings)) {
            return array();
        }

        $mapped = array();
        foreach ($strings as $string) {
            if (is_null($string)) {
                continue;
            }

            $mappedString = array();
            foreach ($string as $key => $value) {
                if (isset(self::$stringMap[$key])) {
                    $mappedString[self::$stringMap[$key]] = $value;
                }
            }
            if (!empty($mappedString) && !empty($mappedString[self::$stringMap[self::KEY_STRING_VALUE]])) {
                $mapped[] = $mappedString;
            }
        }
        return $mapped;
    }

    private static function mapSuggestions($suggestions)
    {
        if (empty($suggestions)) {
            return array();
        }

        $mapped = array();
        foreach ($suggestions as $stringID => $values) {
            $mappedSuggestions = array();
            foreach ($values as $suggestion) {
                $mappedSuggestion = array();
                foreach ($suggestion as $key => $value) {
                    if (isset(self::$suggestionMap[$key])) {
                        $mappedSuggestion[self::$suggestionMap[$key]] = $value;
                    }
                }
                if (!empty($mappedSuggestion)) {
                    $mappedSuggestions[] = $suggestion;
                }
            }
            if (!empty($mappedSuggestions)) {
                $mapped[$stringID] = $mappedSuggestions;
            }
        }
        return $mapped;
    }

    private static function reverseMapStrings($mappedStrings, $newTSModified = null)
    {
        $reverseStringMap = array_flip(self::$stringMap);
        $stringsToStore = array();
        foreach ($mappedStrings as $string) {
            $newString = array();
            foreach ($string as $key => $value) {
                if (isset($reverseStringMap[$key])) {
                    $newString[$reverseStringMap[$key]] = $value;
                }
            }
            if (!empty($newString[self::KEY_STRING_ID])) {
                if (!is_null($newTSModified)) {
                    $newString[self::KEY_TSMODIFIED] = $newTSModified;
                }
                $stringsToStore[] = $newString;
            }
        }
        return $stringsToStore;
    }

    private static function getDoesIndexMatchTemplate($template, $index)
    {
        foreach ($template as $k => $v) {
            if (!isset($index[$k])) {
                return false;
            }
            $v2 = $index[$k];
            if (is_array($v)) {
                if (!is_array($v2) || !self::getDoesIndexMatchTemplate($v, $v2)) {
                    return false;
                }
            } elseif ($v != $v2) {
                return false;
            }
        }
        return true;
    }

    public function install($displayDebugOutput = false)
    {
        $stringIsTranslatedKey = self::KEY_STRINGS . "." . self::KEY_IS_TRANSLATED;
        $stringPriorityKey = self::KEY_STRINGS . "." . self::KEY_PRIORITY;
        $indexes = array(self::COLL_TRANSLATIONS => array(array('key' => array('_id' => 1)),
                                                          array('key' => array(self::KEY_LANG_ID => 1, self::KEY_PROJECT => 1), 'unique' => true, 'background' => true),
                                                          array('key' => array(self::KEY_PROJECT => 1), 'background' => true),
                                                          array('key' => array($stringIsTranslatedKey => 1, $stringPriorityKey => -1), 'background' => true),
                                                          ),
                         self::COLL_USERS => array(array('key' => array('_id' => 1)),
                                                   array('key' => array(self::KEY_USERNAME => 1), 'sparse' => true, 'unique' => true, 'background' => true),
                                                   array('key' => array(self::KEY_USER_POINTS => 1), 'sparse' => true, 'background' => true),
                                                   ),
                         );
        foreach ($indexes as $collName => $indexesToMatch) {
            $coll = $this->getCollection($collName);
            $currentIndexes = $coll->getIndexInfo();
            foreach ($currentIndexes as $index) {
                $foundMatch = false;
                foreach($indexesToMatch as $i => $template) {
                    if (self::getDoesIndexMatchTemplate($template, $index)) {
                        array_splice($indexesToMatch, $i, 1);
                        $foundMatch = true;
                        break;
                    }
                }
                if (!$foundMatch) {
                    //cannot use deleteIndex() because of a bug with the PHP driver and named indexes
                    $result = $this->db->command(array("deleteIndexes" => $collName,
                                                       "index" => $index['name'],
                                                       ));
                    if (empty($result['ok'])) {
                        trigger_error("Failed to remove index {$index['name']} from collection $collName!", E_USER_WARNING);
                        return false;
                    }
                    if ($displayDebugOutput) {
                        echo "MongoConnection: Deleted index {$index['name']} from $collName\n";
                    }
                }
            }
            foreach($indexesToMatch as $indexToAdd) {
                //everything is options but the "key"
                $keys = $indexToAdd['key'];
                unset($indexToAdd['key']);
                $options = $indexToAdd;
                $options['w'] = true;
                $options['timeout'] = 300000; //5 minutes
                if ($displayDebugOutput) {
                    echo "MongoConnection: Adding index on " . json_encode($keys) . " to collection $collName. This may take a while...\n";
                }
                try {
                    $result = $coll->ensureIndex($keys, $options);
                } catch (MongoDuplicateKeyException $e) {
                    if ($e->getCode() != 11000) {
                        throw $e;
                    }
                    $message = $e->getMessage();
                    $dupKey = mb_substr($message, stripos($message, 'dup key: ') + 9);
                    trigger_error("Failed to add index on " . json_encode($keys) . " to collection $collName! Duplicate key exists in the database: $dupKey", E_USER_WARNING);
                    return false;
                }
                if (empty($result['ok'])) {
                    trigger_error("Failed to add index on " . json_encode($keys) . " to collection $collName!", E_USER_WARNING);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @return array|null
     * @throws MongoException
     */
    public function getUser($userID)
    {
        $coll = $this->getCollection(self::COLL_USERS);
        $query = array(self::KEY_USER_ID => $userID);
        $fields = array(self::KEY_USER_PASSWORD => 0);
        $doc = $coll->findOne($query, $fields);
        if (is_null($doc)) {
            return null;
        }
        return self::mapUser($doc);
    }

    public function getNextUserID()
    {
        //todo: should this just return mongoID?
        $coll = $this->getCollection(self::COLL_USERS);
        $cursor = $coll->find()->sort(array(self::KEY_USER_ID => -1))->limit(1);
        $firstDoc = $cursor->getNext();
        if (empty($firstDoc)) {
            return 1;
        }
        return $firstDoc[self::KEY_USER_ID] + 1;
    }

    /**
     * @return array ('success' => bool, 'exists' => bool)
     * @throws MongoException
     */
    public function storeNewUser($userID, $username = null, $password = null, $permissions = null, $globalAdmin = false, $flags = null)
    {
        $doc = array(self::KEY_USER_ID => $userID,
                     self::KEY_GLOBAL_ADMIN => $globalAdmin,
                     self::KEY_TSMODIFIED => time(),
                     );
        if (!empty($username)) {
            $doc[self::KEY_USERNAME] = $username;
        }
        if (!empty($password)) {
            $doc[self::KEY_USER_PASSWORD] = $password;
        }
        if (!is_null($permissions)) {
            $doc[self::KEY_PERMISSIONS] = $permissions;
        }
        if (!is_null($flags)) {
            $doc[self::KEY_FLAGS] = $flags;
        }

        $result = array('success' => false,
                        'exists' => false,
                        );
        $coll = $this->getCollection(self::COLL_USERS);
        try {
            $insertResult = $coll->insert($doc, array('w' => true));
        } catch (MongoCursorException $e) {
            //duplicate userID already exists
            if ($e->getCode() == 11000) {
                $result['exists'] = true;
                return $result;
            }
            throw $e;
        }
        $result['success'] = $insertResult['ok'];
        return $result;
    }

    public function modifyUserGlobalPermissions($userID, $permissions = null, $globalAdmin = null, $deleteOtherPermissions = true)
    {
        $query = array(self::KEY_USER_ID => $userID,
                       );
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        $unset = array();
        if (!is_null($permissions)) {
            if ($permissions === false) {
                $unset[self::KEY_PERMISSIONS] = 1;
            } else {
                $set[self::KEY_PERMISSIONS] = (int)$permissions;
            }
        }
        if (!is_null($globalAdmin)) {
            //todo: should we unset if false?
            $set[self::KEY_GLOBAL_ADMIN] = (bool)$globalAdmin;
        }

        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set);
        if (!empty($unset)) {
            $update['$unset'] = $unset;
        }
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'w' => true));
        if (empty($updateResult['n'])) {
            return false;
        }
        if ($deleteOtherPermissions) {
            $unset = array(self::KEY_PERMISSIONS  . ".$userID" => 1);
            $coll = $this->getCollection(self::COLL_TRANSLATIONS);
            $update = array('$unset' => $unset);
            $coll->update($query, $update, array('upsert' => false, 'multiple' => true, 'w' => true));
            //todo: what do we do if this fails?
        }
        return true;
    }

    public function modifyUserLanguagePermissions($userID, $languageID, $permissions, $projectID = null, $deleteOtherLangPermissions = false)
    {
        $multiple = true;
        $query = array(self::KEY_LANG_ID => $languageID,
                       );
        if (!empty($projectID)) {
            $query[self::KEY_PROJECT] = $projectID;
            $multiple = false;
        }
        if ($permissions === false) {
            $update['$unset'][self::KEY_PERMISSIONS][$userID] = 1;
        } else {
            $update['$set'][self::KEY_PERMISSIONS][$userID] = (int)$permissions;
        }
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => $multiple, 'w' => true));
        if (empty($updateResult['n'])) {
            return false;
        }
        if ($deleteOtherLangPermissions) {
            //todo: do this
        }
        return true;
    }

    //returns false if not found, null if no permissions and int if there are permissions
    private function getUserGlobalPermissions($userID)
    {
        $result = array('exists' => false,
                        'globalAdmin' => false,
                        'permissions' => null,
                        );
        $query = array(self::KEY_USER_ID => $userID,
                       );
        $coll = $this->getCollection(self::COLL_USERS);
        $keys = array(self::KEY_PERMISSIONS => 1,
                      self::KEY_GLOBAL_ADMIN => 1
                      );
        $doc = $coll->findOne($query, $keys);
        if (empty($doc)) {
            return $result;
        }
        $result['exists'] = true;
        if (isset($doc[self::KEY_PERMISSIONS])) {
            $result['permissions'] = $doc[self::KEY_PERMISSIONS];
        }
        if (!empty($doc[self::KEY_GLOBAL_ADMIN])) {
            $result['globalAdmin'] = true;
        }
        return $result;
    }

    public function getUserLanguagesPermissions($userID, $projectID = null, $language = null)
    {
        $result = array('permissions' => null,
                        'exists' => false,
                        );
        $userGlobalPermissions = $this->getUserGlobalPermissions($userID);
        if (!$userGlobalPermissions['exists']) {
            return $result;
        }
        $result['exists'] = true;

        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $pipeline = array();
        if (!empty($projectID) || !empty($language)) {
            $where = array();
            if (!empty($projectID)) {
                $where[self::KEY_PROJECT] = $projectID;
            }
            if (!empty($projectID)) {
                //need to get the template lang in case we need to fallback
                $where[self::KEY_LANG_ID] = array('$in' => array($language, TranslationDB::TEMPLATE_LANG));
            }
            $pipeline[] = array('$match' => $pipeline);
        }
        //use sort so we can get the _all_ lang's first
        $pipeline[] = array('$sort' => array(self::KEY_LANG_ID => 1, self::KEY_PROJECT => 1));
        $keys = array('_id' => 0,
                      self::KEY_PROJECT => 1,
                      self::KEY_LANG_ID => 1,
                      'user' => '$' . self::KEY_PERMISSIONS . "." . $userID,
                      'default' => '$' . self::KEY_PERMISSIONS . "." . TranslationDB::DEFAULT_USER,
                      );
        $pipeline[] = array('$project' => $keys);
        //if we can use aggregateCursor then we can get the docs in batches instead of all at once, using less memory
        //todo: test both!!!
        if (false && method_exists($coll, 'aggregateCursor')) {
            $cursor = $coll->aggregateCursor($pipeline);
        } else {
            $aggregate = $coll->aggregate($pipeline);
            if (empty($aggregate) || !isset($aggregate['result'])) {
                return $result;
            }
            $cursor = $aggregate['result'];
        }
        //this relys on the mongo stuff returning all the template's first
        $defaultsPerProject = array();
        $userPerProject = array();
        $permissions = array();
        foreach ($cursor as $doc) {
            $projectID = $doc[self::KEY_PROJECT];
            $lang = $doc[self::KEY_LANG_ID];
            if ($lang == TranslationDB::TEMPLATE_LANG) {
                //even though they're 2 separate arrays we don't need to set the defaults one if we got the user one
                if (isset($doc['user'])) {
                    $userPerProject[$projectID] = $doc['user'];
                } elseif (isset($doc['default'])) {
                    $defaultsPerProject[$projectID] = $doc['default'];
                }
                continue;
            }

            //first try language-specific user permission
            //next try project defaults for the user
            //next try user global permission
            //next try default for language
            //next try default for project
            if ($userGlobalPermissions['globalAdmin']) {
                $permissions[$projectID][$lang] = TranslationDB::PERMISSION_ALL;
            } elseif (isset($doc['user'])) {
                $permissions[$projectID][$lang] = $doc['user'];
            } elseif (isset($userPerProject[$projectID])) {
                $permissions[$projectID][$lang] = $userPerProject[$projectID];
            } elseif (!is_null($userGlobalPermissions['permissions'])) {
                $permissions[$projectID][$lang] = $userGlobalPermissions['permissions'];
            } elseif (isset($doc['default'])) {
                $permissions[$projectID][$lang] = $doc['default'];
            } elseif (isset($defaultsPerProject[$projectID])) {
                $permissions[$projectID][$lang] = $defaultsPerProject[$projectID];
            } else {
                //if we haven't fetched the default perms, do that now
                if (!isset($defaultGlobalPermissions)) {
                    $defaultGlobalPermissions = $this->getUserGlobalPermissions(TranslationDB::DEFAULT_USER);
                }
                if (!is_null($defaultGlobalPermissions['permissions'])) {
                    $permissions[$projectID][$lang] = $defaultGlobalPermissions['permissions'];
                }
            }
        }
        $result['permissions'] = $permissions;
        return $result;
    }

    /**
     * Passwords should already be hashed before this
     */
    public function modifyUserPassword($userID, $newPassword, $oldPassword = null)
    {
        $query = array(self::KEY_USER_ID => $userID,
                       );
        if (!is_null($oldPassword)) {
            $query[self::KEY_USER_PASSWORD] = $oldPassword;
        }
        $set = array(self::KEY_TSMODIFIED => time(),
                     self::KEY_USER_PASSWORD => $newPassword,
                     );
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'w' => true));
        if (!empty($updateResult['n'])) {
            return true;
        }
        return false;
    }

    public function modifyUserPoints($userID, $pointsToAdd, $skipIfDisabled = true)
    {
        $return = array('success' => false,
                        'newPoints' => 0,
                        );
        $query = array(self::KEY_USER_ID => $userID,
                       );
        $coll = $this->getCollection(self::COLL_USERS);
        if ($skipIfDisabled) {
            //todo: when https://jira.mongodb.org/browse/SERVER-3518 is fixed, then use bitwise operators in findAndModify
            $bitQuery = $query;
            $bitQuery[self::KEY_FLAGS] = array('$exists' => true); //only fetch a doc if the flags key actually exists
            $doc = $coll->findOne($bitQuery, array(self::KEY_USER_POINTS => 1, self::KEY_FLAGS => 1));
            if (!empty($doc[self::KEY_FLAGS]) && ($doc[self::KEY_FLAGS] & TranslationUser::FLAG_DISABLE_AUTO_POINTS) == TranslationUser::FLAG_DISABLE_AUTO_POINTS) {
                $return['success'] = true;
                $return['newPoints'] = $doc[self::KEY_USER_POINTS];
                return $return;
            }
        }
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        $inc = array(self::KEY_USER_POINTS => $pointsToAdd,
                     );
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set, '$inc' => $inc);
        $newDoc = $coll->findAndModify($query, $update, array(self::KEY_USER_POINTS => 1), array('upsert' => false, 'new' => true, 'w' => true));
        if (empty($newDoc)) {
            return $return;
        }
        $return['success'] = true;
        $return['newPoints'] = $newDoc[self::KEY_USER_POINTS];
        return $return;
    }

    public function modifyUserFlags($userID, $flagsToAdd = 0, $flagsToRemove = 0)
    {
        $query = array(self::KEY_USER_ID => $userID,
                       );
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        $bit = array(self::KEY_FLAGS => array());
        if ($flagsToAdd > 0) {
            $bit[self::KEY_FLAGS]['or'] = (int)$flagsToAdd;
        }
        if ($flagsToRemove > 0) {
            $bit[self::KEY_FLAGS]['and'] = ~$flagsToRemove;
        }
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$bit' => $bit, '$set' => $set);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'w' => true));
        if (empty($updateResult['n'])) {
            return false;
        }
        return true;
    }

    public function modifyUserUsername($userID, $newUsername, $password = null, $checkPassword = true)
    {
        $return = array('success' => false,
                        'exists' => false,
                        );
        $query = array(self::KEY_USER_ID => $userID,
                       );
        if ($checkPassword) {
            $query[self::KEY_USER_PASSWORD] = $password;
        }
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        $unset = array();
        if (empty($newUsername)) {
            $unset[self::KEY_USERNAME] = 1;
        } else {
            $set[self::KEY_USERNAME] = $newUsername;
        }
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set);
        if (!empty($unset)) {
            $update['$unset'] = $unset;
        }
        try {
            $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'w' => true));
        } catch (MongoCursorException $e) {
            if ($e->getCode() == 11000) {
                $return['exists'] = true;
            } else {
                throw $e;
            }
        }
        if (!empty($updateResult['n'])) {
            $return['success'] = true;
        }
        return $return;
    }

    /**
     * @return array ('success' => bool, 'exists' => bool)
     * @throws MongoException
     */
    public function storeNewLanguage($projectID, $displayName, $id, $strings, $version = 0, $permissions = null)
    {
        $now = time();
        $doc = array(self::KEY_LANG_ID => $id,
                     self::KEY_NAME => $displayName,
                     self::KEY_PROJECT => $projectID,
                     self::KEY_SUGGESTIONS => new stdClass(),
                     self::KEY_VERSION => (int)$version,
                     self::KEY_TSMODIFIED => $now,
                     );
        if (empty($strings)) {
            //make sure that we store it as an object in mongo
            $strings = array();
        } else {
            $strings = self::reverseMapStrings($strings, $now);
        }
        $doc[self::KEY_STRINGS] = $strings;
        if (empty($permissions)) {
            //make sure that we store it as an object in mongo
            $doc[self::KEY_PERMISSIONS] = new stdClass();
        } else {
            $doc[self::KEY_PERMISSIONS] = $permissions;
        }

        $result = array('success' => false,
                        'exists' => false,
                        );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        try {
            $insertResult = $coll->insert($doc, array('w' => true));
        } catch (MongoCursorException $e) {
            //duplicate language already exists
            if ($e->getCode() == 11000) {
                $result['exists'] = true;
                return $result;
            }
            throw $e;
        }
        $result['success'] = $insertResult['ok'];
        return $result;
    }

    public function deleteAllLanguagesForProject($projectID)
    {
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $query = array(self::KEY_PROJECT => $projectID);
        $result = $coll->remove($query, array('w' => true, 'justOne' => false));
        if (empty($result['n'])) {
            return false;
        }
        return true;
    }

    public function deleteLanguage($id, $projectID = null)
    {
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $query = array(self::KEY_LANG_ID => $id);
        if (!empty($projectID)) {
            $query[self::KEY_PROJECT] = $projectID;
        }
        $result = $coll->remove($query, array('w' => true, 'justOne' => false));
        if (empty($result['n'])) {
            return false;
        }
        return true;
    }

    /**
     * @return array languages keyed by languageID
     */
    public function getLanguages($projectID, $ids = null, $includeStrings = false, $includeSuggestions = false)
    {
        $query = array(self::KEY_PROJECT => $projectID,
                       );
        if (!empty($ids)) {
            $query[self::KEY_LANG_ID] = array('$in' => $ids);
        } else {
            $query[self::KEY_LANG_ID] = array('$ne' => TranslationDB::TEMPLATE_LANG);
        }
        $fields = array();
        if (!$includeSuggestions || !$includeStrings) {
            $fields = array();
            if (!$includeStrings) {
                $fields[self::KEY_STRINGS] = 0;
            }
            if (!$includeSuggestions){
                $fields[self::KEY_SUGGESTIONS] = 0;
            }
        }
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        $cursor = $coll->find($query, $fields);
        $languagesKeyed = array();
        foreach ($cursor as $doc) {
            $languagesKeyed[$doc[self::KEY_LANG_ID]] = self::mapLanguage($doc);
        }
        return $languagesKeyed;
    }

    public function getLanguagesStats($projectID, $ids = null)
    {
        $result = array('success' => false,
                        'languages' => array(),
                        );
        $query = array(self::KEY_PROJECT => $projectID,
                       );
        if (!empty($ids)) {
            $query[self::KEY_LANG_ID] = array('$in' => $ids);
        } else {
            $query[self::KEY_LANG_ID] = array('$ne' => TranslationDB::TEMPLATE_LANG);
        }
        //if there is an empty strings array then make it an array with just null in it so unwind actually does something...
        $stringCond = array(array('$eq' => array('$' . self::KEY_STRINGS, array())), array(null), '$' . self::KEY_STRINGS);
        //add one if the key is translated and if its not translated add 0
        $translateSum = array('$cond' => array(array('$eq' => array('$' . self::KEY_STRINGS . '.' . self::KEY_IS_TRANSLATED, true)), 1, 0));
        //add 0 if the string is null, otherwise add 1
        $totalSum = array('$cond' => array(array('$eq' => array('$' . self::KEY_STRINGS, null)), 0, 1));
        $group = array('_id' => '$' . self::KEY_LANG_ID,
                       'translatedCount' => array('$sum' => $translateSum),
                       'totalCount' => array('$sum' => $totalSum),
                       );
        $pipeline = array(array('$match' => $query),
                          array('$project' => array(self::KEY_STRINGS => array('$cond' => $stringCond), self::KEY_LANG_ID => 1, self::KEY_NAME => 1)),
                          array('$unwind' => '$' . self::KEY_STRINGS),
                          array('$group' => $group),
                          );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        if (false && method_exists($coll, 'aggregateCursor')) {
            $cursor = $coll->aggregateCursor($pipeline);
        } else {
            $aggregate = $coll->aggregate($pipeline);
            if (empty($aggregate) || !isset($aggregate['result'])) {
                return $result;
            }
            $cursor = $aggregate['result'];
        }
        foreach ($cursor as $doc) {
            $doc[self::$langMap[self::KEY_LANG_ID]] = $doc['_id'];
            unset($doc['_id']);
            $doc[self::$langMap[self::KEY_PROJECT]] = $projectID;
            $result['languages'][] = $doc;
        }
        $result['success'] = true;
        return $result;
    }

    /**
     * @return array languages keyed by projectID
     */
    public function getLanguageFromProjects($id, $projectIDs = null, $includeStrings = false, $includeSuggestions = false)
    {
        $query = array(self::KEY_LANG_ID => $id,
                       );
        if (!empty($projectIDs)) {
            $query[self::KEY_PROJECT] = array('$in' => $projectIDs);
        }
        $fields = array();
        if (!$includeSuggestions || !$includeStrings) {
            $fields = array();
            if (!$includeStrings) {
                $fields[self::KEY_STRINGS] = 0;
            }
            if (!$includeSuggestions){
                $fields[self::KEY_SUGGESTIONS] = 0;
            }
        }
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        $cursor = $coll->find($query, $fields);
        $languagesKeyed = array();
        foreach ($cursor as $doc) {
            $languagesKeyed[$doc[self::KEY_PROJECT]] = self::mapLanguage($doc);
        }
        return $languagesKeyed;
    }

    /**
     * @return array|null mapped language
     */
    public function getLanguage($id, $projectID, $includeStrings = true, $includeSuggestions = true)
    {
        $languages = self::getLanguages($projectID, array($id), $includeStrings, $includeSuggestions);
        if (!isset($languages[$id])) {
            return null;
        }
        return $languages[$id];
    }

    public function getString($id, $project, $lang, $includeSuggestions)
    {
        $result = array('string' => null,
                        'stringID' => $id,
                        );
        $query = array(self::KEY_LANG_ID => $lang,
                       self::KEY_PROJECT => $project,
                       self::KEY_STRINGS . '.' . self::KEY_STRING_ID => $id,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        $fields = array(self::KEY_STRINGS . '.$' => 1);
        if ($includeSuggestions) {
            $fields[self::KEY_SUGGESTIONS . "." . $id] = 1;
            $result['suggestions'] = array();
        }
        $doc = $coll->findOne($query, $fields);
        if (empty($doc) || empty($doc[self::KEY_STRINGS])) {
            return $result;
        }
        //only map one string and one set of suggestions
        $mapped = self::mapStrings($doc[self::KEY_STRINGS]);
        $result['string'] = reset($mapped);
        if ($includeSuggestions) {
            $mapped = self::mapSuggestions($doc[self::KEY_SUGGESTIONS]);
            $result['suggestions'] = reset($mapped);
        }
        return $result;
    }

    public function getStrings($ids, $project, $lang)
    {
        $result = array('strings' => null,
                        );
        $query = array(self::KEY_LANG_ID => $lang,
                       self::KEY_PROJECT => $project,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        //todo: limit num of ids
        $elemMatch = array(self::KEY_STRING_ID => array('$in', $ids));
        $fields = array(self::KEY_STRINGS => array('$elemMatch' => $elemMatch));
        $doc = $coll->findOne($query, $fields);
        if (empty($doc)) {
            return $result;
        }
        $result['strings'] = self::mapStrings($doc[self::KEY_STRINGS]);
        return $result;
    }

    public function getUntranslatedStrings($projectID, $languageID, $orderedByPriority = true, $limit = 0)
    {
        $result = array('strings' => null,
                        );
        $query = array(self::KEY_LANG_ID => $languageID,
                       self::KEY_PROJECT => $projectID,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        //todo: test the performance of this
        $pipeline = array(array('$match' => $query),
                          array('$project' => array('$' . self::KEY_STRINGS => 1)), //limit fields to ONLY strings so we don't unwind a ton of fields
                          array('$unwind' => '$' . self::KEY_STRINGS),
                          array('$match' => array(self::KEY_STRINGS . "." . self::KEY_IS_TRANSLATED => array('$ne' => true))),
                          );
        if ($orderedByPriority) {
            $pipeline[] = array('$sort' => array(self::KEY_STRINGS . "." . self::KEY_PRIORITY => -1));
        }
        if ($limit > 0) {
            //when a $sort immediately precedes a $limit, the $sort only maintains the top n results as it progresses
            $pipeline[] = array('$limit' => $limit);
        }
        //if we can use aggregateCursor then we can get the docs in batches instead of all at once, using less memory
        if (method_exists($coll, 'aggregateCursor')) {
            $cursor = $coll->aggregateCursor($pipeline);
        } else {
            $aggregate = $coll->aggregate($pipeline);
            if (empty($aggregate) || !isset($aggregate['result'])) {
                return $result;
            }
            $cursor = $aggregate['result'];
        }
        $strings = array();
        foreach ($cursor as $doc) {
            $strings[] = $doc[self::KEY_STRINGS];
        }
        $result['strings'] = self::mapStrings($strings);
        return $result;
    }

    //todo: store who last updated
    public function updateProjectTemplate($projectID, $newStrings, $languageID = TranslationDB::TEMPLATE_LANG)
    {
        $return = array('oldStrings' => null,
                        'newStrings' => null,
                        'newVersion' => null,
                        'success' => false,
                        );
        $query = array(self::KEY_LANG_ID => $languageID,
                       self::KEY_PROJECT => $projectID,
                       );
        $stringsToStore = self::reverseMapStrings($newStrings);
        $set = array(self::KEY_STRINGS => $stringsToStore,
                     self::KEY_TSMODIFIED => time(),
                     );
        $inc = array(self::KEY_VERSION => 1);
        $update = array('$set' => $set,
                        '$inc' => $inc,
                        );
        $coll = self::getCollection(self::COLL_TRANSLATIONS);
        //get the old value so we can compare to new
        $oldDoc = $coll->findAndModify($query, $update, array(self::KEY_STRINGS => 1, self::KEY_VERSION => 1), array('upsert' => false, 'new' => false, 'w' => true));
        if (empty($oldDoc)) {
            return $return;
        }
        $return['success'] = true;
        $return['newStrings'] = $newStrings;
        $return['oldStrings'] = self::mapStrings($oldDoc[self::KEY_STRINGS]);
        if (empty($oldDoc[self::KEY_VERSION])) { //temporary while existing docs don't have a version field
            $return['newVersion'] = 1;
        } else {
            $return['newVersion'] = $oldDoc[self::KEY_VERSION] + 1;
        }
        return $return;
    }

    public function updateProjectFromStringsDiff($projectID, $diffStrings, $newVersion, $requiredVersion = null)
    {
        $return = array('updated' => array(),
                        'failed' => array(),
                        );
        $query = array(self::KEY_PROJECT => $projectID,
                       self::KEY_LANG_ID => array('$ne' => TranslationDB::TEMPLATE_LANG),
                       self::KEY_VERSION => array('$lt' => $newVersion),
                       );
        $now = time();
        $reverseStringMap = array_flip(self::$stringMap);
        $coll = self::getCollection(self::COLL_TRANSLATIONS);
        $cursor = $coll->find($query, array(self::KEY_SUGGESTIONS => false));
        foreach ($cursor as $doc) {
            $languageID = $doc[self::KEY_LANG_ID];
            if (!is_null($requiredVersion)) {
                if ($doc[self::KEY_VERSION] !== $requiredVersion) {
                    $return['failed'][] = $languageID;
                    continue;
                }
            }

            $query = array(self::KEY_PROJECT => $projectID,
                           self::KEY_LANG_ID => $languageID,
                           self::KEY_VERSION => $doc[self::KEY_VERSION],
                           );
            $localDiff = $diffStrings;
            $deletedAnything = false;
            $set = array(self::KEY_VERSION => $newVersion,
                         self::KEY_TSMODIFIED => $now,
                         );
            $unset = array();
            $i = 0;
            foreach ($doc[self::KEY_STRINGS] as $i => $string) {
                if (is_null($string)) {
                    $deletedAnything = true;
                    continue;
                }
                $stringID = $string[self::KEY_STRING_ID];
                if (empty($localDiff[$stringID])) {
                    continue;
                }
                $diff = $localDiff[$stringID];
                unset($localDiff[$stringID]);
                if (!empty($diff['deleted'])) {
                    $deletedAnything = true;
                    $set[self::KEY_STRINGS . ".$i"] = null;
                    continue;
                }
                unset($diff['stringID']); //don't allow changing of this
                foreach ($diff as $key => $value) {
                    if (isset($reverseStringMap[$key])) {
                        $set[self::KEY_STRINGS . ".$i.{$reverseStringMap[$key]}"] = $value;
                    }
                }
                $set[self::KEY_STRINGS . ".$i." . self::KEY_TSMODIFIED] = $now;
                //if value changed then we should removed translation
                if (isset($diff['value'])) {
                    $unset[self::KEY_STRINGS . ".$i." . self::KEY_STRING_TRANSLATED] = 1;
                    $unset[self::KEY_STRINGS . ".$i." . self::KEY_IS_TRANSLATED] = 1;
                    $unset[self::KEY_STRINGS . ".$i." . self::KEY_STRING_USERID] = 1;
                }
            }
            if (!empty($localDiff)) {
                foreach ($localDiff as $string) {
                    $newString = array();
                    foreach ($string as $key => $value) {
                        if (isset($reverseStringMap[$key])) {
                            $newString[$reverseStringMap[$key]] = $value;
                        }
                    }
                    if (empty($newString[self::KEY_STRING_ID])) {
                        continue;
                    }
                    $newString[self::KEY_TSMODIFIED] = $now;
                    //cannot use $push with $set so we gotta just keep incrementing in here :/
                    $i++;
                    $set[self::KEY_STRINGS . ".$i"] = $newString;
                }
            }
            $update = array('$set' => $set);
            if (!empty($unset)) {
                $update['$unset'] = $unset;
            }
            $result = $coll->update($query, $update, array('multiple' => false, 'upsert' => false, 'w' => true));
            if ($result['n'] <= 0) {
                $return['failed'][] = $languageID;
                continue;
            }
            if ($deletedAnything) {
                //remove all the nulls left over from the removed strings
                $query[self::KEY_VERSION] = $newVersion;
                $update = array('$pull' => array(self::KEY_STRINGS => null));
                //todo: should we actually care about the result??
                $coll->update($query, $update, array('multiple' => false, 'upsert' => false, 'w' => false));
            }
            $return['updated'][] = $languageID;
        }
        return $return;
    }

    public function getAutocompleteForUsername($search, $limit = null)
    {
        //todo: some sanity checks on the search value??

        $search = addcslashes($search, "/.+?*[]()$^");
        $regex = new MongoRegex("/^$search/i");
        if (is_numeric($search)) {
            //if they sent an all numeric search then they're probably looking for an int userID, optimize for that since mongo is type sensitive
            $search = (int)$search;
        }
        $or = array(array(self::KEY_USERNAME => array('$regex' => $regex)),
                    array(self::KEY_USER_ID => $search),
                    );
        $query = array('$or' => $or);
        $coll = $this->getCollection(self::COLL_USERS);
        $coll->setSlaveOkay(true);
        $fields = array(self::KEY_USER_ID => 1,
                        self::KEY_USERNAME => 1,
                        self::KEY_GLOBAL_ADMIN => 1,
                        );
        $cursor = $coll->find($query, $fields)->sort(array(self::KEY_USERNAME => 1));
        if (!empty($limit)) {
            $cursor->limit($limit);
        }
        $users = array();
        foreach ($cursor as $user) {
            $users[] = self::mapUser($user);
        }
        return $users;
    }

    public function getAutocompleteForLanguages($search, $limit = null)
    {
        //todo: some sanity checks on the search value??

        $search = addcslashes($search, "/.+?*[]()$^");
        $regex = new MongoRegex("/^$search/i");
        if (is_numeric($search)) {
            //if they sent an all numeric search then they're probably looking for an int userID, optimize for that since mongo is type sensitive
            $search = (int)$search;
        }
        //todo: this DOES NOT use an index
        $or = array(array(self::KEY_NAME => array('$regex' => $regex)),
                    array(self::KEY_LANG_ID => $search),
                    );
        $query = array('$or' => $or);
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        $fields = array(self::KEY_LANG_ID => 1,
                        self::KEY_NAME => 1,
                        self::KEY_PROJECT => 1,
                        );
        //todo: sort by name
        $cursor = $coll->find($query, $fields);
        if (!empty($limit)) {
            $cursor->limit($limit);
        }
        $langs = array();
        //todo: return project names for each one...
        foreach ($cursor as $lang) {
            $langs[] = self::mapLanguage($lang);
        }
        return $langs;
    }

}

//EOF
