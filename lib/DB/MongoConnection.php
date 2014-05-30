<?php

/**
 * Requires pecl mongo driver version 1.2+
 */
class DB_MongoConnection implements DB_Template
{
    const COLL_TRANSLATIONS = 'translations';
    const COLL_USERS = 'users';

    const KEY_ID = "i";
    const KEY_PROJECT = "p";
    const KEY_NAME = "n";
    const KEY_STRINGS = "s"; //keyed by stringID
    const KEY_PERMISSIONS = "m"; //object keyed by userID for translations and int for users
    const KEY_SUGGESTIONS = "sg"; //keyed by stringID and value of array
    const KEY_TSMODIFIED = "ts";
    const KEY_STRING_USERID = "u"; //last userID to modify the string
    const KEY_STRING_VARIABLES = "v";
    const KEY_STRING_VALUE = "s";
    const KEY_SUGGESTION_USERID = "u";
    const KEY_SUGGESTION_CREATED = "t";
    const KEY_SUGGESTION_VALUE = "v";
    const KEY_SUGGESTION_VOTES = "p"; //userIDs as a "set"
    const KEY_USERNAME = "u";
    const KEY_GLOBAL_ADMIN = "ga";
    const KEY_USER_POINTS = "p";
    const KEY_USER_PASSWORD = "w";

    private static $langMap = array(self::KEY_ID => 'id',
                                    self::KEY_PROJECT => 'project',
                                    self::KEY_NAME => 'displayName',
                                    self::KEY_PERMISSIONS => 'permissions',
                                    );

    private static $userMap = array(self::KEY_ID => 'userID',
                                    self::KEY_USERNAME => 'username',
                                    self::KEY_GLOBAL_ADMIN => 'globalAdmin',
                                    self::KEY_PERMISSIONS => 'permissions',
                                    self::KEY_USER_POINTS => 'points',
                                    );

    private static $stringMap = array(self::KEY_STRING_VALUE => 'value',
                                      self::KEY_STRING_USERID => 'lastModifiedUserID',
                                      self::KEY_STRING_VARIABLES => 'variables',
                                      self::KEY_TSMODIFIED => 'tsModified',
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
        foreach ($strings as $stringID => $string) {
            $mappedString = array();
            foreach ($string as $key => $value) {
                if (isset(self::$stringMap[$key])) {
                    $mappedString[self::$stringMap[$key]] = $value;
                }
            }
            if (!empty($mappedString) && !empty($mappedString[self::$stringMap[self::KEY_STRING_VALUE]])) {
                $mapped[$stringID] = $mappedString;
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

    private static function escapeStringID($key)
    {
        return preg_replace('/$\.\s/', '_', $key); //replace characters not allowed in key names
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
        $indexes = array(self::COLL_TRANSLATIONS => array(array('key' => array('_id' => 1)),
                                                          array('key' => array(self::KEY_ID => 1, self::KEY_PROJECT => 1), 'unique' => true, 'background' => true)
                                                          ),
                         self::COLL_USERS => array(array('key' => array('_id' => 1)),
                                                   array('key' => array(self::KEY_ID => 1), 'unique' => true, 'background' => true),
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
                    //$coll->deleteIndex($index['name']);
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
                $options['safe'] = true;
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
        $doc = $coll->findOne(array(self::KEY_ID => $userID));
        if (is_null($doc)) {
            return null;
        }
        return self::mapUser($doc);
    }

    /**
     * @return array ('success' => bool, 'exists' => bool)
     * @throws MongoException
     */
    public function storeNewUser($userID, $username = null, $password = null, $permissions = 0, $globalAdmin = false)
    {
        $doc = array(self::KEY_ID => $userID,
                     self::KEY_PERMISSIONS => $permissions,
                     self::KEY_GLOBAL_ADMIN => $globalAdmin,
                     self::KEY_TSMODIFIED => time(),
                     );
        if (!empty($username)) {
            $doc[self::KEY_USERNAME] = $username;
        }
        if (!empty($password)) {
            $doc[self::KEY_USER_PASSWORD] = $password;
        }

        $result = array('success' => false,
                        'exists' => false,
                        );
        $coll = $this->getCollection(self::COLL_USERS);
        try {
            $insertResult = $coll->insert($doc, array('safe' => true));
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

    public function modifyUserPermissions($userID, $permissions = null, $globalAdmin = null)
    {
        $query = array(self::KEY_ID => $userID,
                       );
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        if (!is_null($permissions)) {
            $set[self::KEY_PERMISSIONS] = (int)$permissions;
        }
        if (!is_null($globalAdmin)) {
            $set[self::KEY_GLOBAL_ADMIN] = (bool)$globalAdmin;
        }

        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'safe' => true));
        if (!empty($updateResult['n'])) {
            return true;
        }
        return false;
    }

    /**
     * Passwords should already be hashed before this
     */
    public function modifyUserPassword($userID, $newPassword, $oldPassword = null)
    {
        $query = array(self::KEY_ID => $userID,
                       );
        if (!is_null($oldPassword)) {
            $query[self::KEY_USER_PASSWORD] = $oldPassword;
        }
        $set = array(self::KEY_TSMODIFIED => time(),
                     self::KEY_USER_PASSWORD => $newPassword,
                     );
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'safe' => true));
        if (!empty($updateResult['n'])) {
            return true;
        }
        return false;
    }

    public function modifyUserPoints($userID, $pointsToAdd = 0)
    {
        $query = array(self::KEY_ID => $userID,
                       );
        $set = array(self::KEY_TSMODIFIED => time(),
                     );
        $inc = array(self::KEY_USER_POINTS => $pointsToAdd,
                     );
        $coll = $this->getCollection(self::COLL_USERS);
        $update = array('$set' => $set, '$inc' => $inc);
        $updateResult = $coll->update($query, $update, array('upsert' => false, 'multiple' => false, 'safe' => true));
        if (!empty($updateResult['n'])) {
            return true;
        }
        return false;
    }

    /**
     * @return array ('success' => bool, 'exists' => bool)
     * @throws MongoException
     */
    public function storeNewLanguage($project, $displayName, $id = null, $permissions = null, $strings = null)
    {
        if (empty($id)) {
            $idObj = new MongoId();
            $id = $idObj->__toString();
        }
        $doc = array(self::KEY_ID => $id,
                     self::KEY_NAME => $displayName,
                     self::KEY_PROJECT => $project,
                     self::KEY_SUGGESTIONS => new stdClass(),
                     );

        if (empty($strings)) {
            //make sure that we store it as an object in mongo
            $strings = new stdClass();
        } else {
            $escapedStrings = array();
            foreach ($strings as $stringID => $value) {
                $escapedStrings[self::escapeStringID($stringID)] = $value;
            }
            $strings = $escapedStrings;
        }
        $doc[self::KEY_STRINGS] = $strings;
        if (empty($permissions)) {
            //make sure that we store it as an object in mongo
            $permissions = new stdClass();
        }
        $doc[self::KEY_PERMISSIONS] = $permissions;

        $result = array('success' => false,
                        'exists' => false,
                        );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        try {
            $insertResult = $coll->insert($doc, array('safe' => true));
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

    /**
     * @return array ('permissions' => array)
     */
    public function getLanguagePermissions($id, $project)
    {
        $query = array(self::KEY_ID => $id,
                       self::KEY_PROJECT => $project,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $doc = $coll->findOne($query, array(self::KEY_PERMISSIONS));
        return self::mapLanguage($doc);
    }

    /**
     * @return array
     */
    public function getLanguage($id, $project, $includeSuggestions = true)
    {
        $query = array(self::KEY_ID => $id,
                       self::KEY_PROJECT => $project,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        //todo: actually use fields to ignore suggestions instead of just doing it in php and incurring the transfer cost
        $doc = $coll->findOne($query);
        if (!$includeSuggestions && !empty($doc)) {
            unset($doc[self::KEY_SUGGESTIONS]);
        }
        return self::mapLanguage($doc);
    }

    public function getString($id, $project, $lang, $includeSuggestions)
    {
        $id = self::escapeStringID($id);
        $result = array('string' => null,
                        'stringID' => $id,
                        );
        $query = array(self::KEY_ID => $lang,
                       self::KEY_PROJECT => $project,
                       );
        $coll = $this->getCollection(self::COLL_TRANSLATIONS);
        $coll->setSlaveOkay(true);
        $fields = array(self::KEY_STRINGS => 1);
        if ($includeSuggestions) {
            $fields[self::KEY_SUGGESTIONS] = 1;
            $result['suggestions'] = array();
        }
        $doc = $coll->findOne($query, $fields);
        if (empty($doc)) {
            return $result;
        }
        //only map one string and one set of suggestions
        foreach($doc[self::KEY_STRINGS] as $stringID => $string) {
            if ($stringID !== $id) {
                continue;
            }
            $mapped = self::mapStrings(array($stringID => $string));
            $result['string'] = $mapped[$stringID];
            break;
        }
        if ($includeSuggestions) {
            foreach ($doc[self::KEY_SUGGESTIONS] as $stringID => $suggestions) {
                if ($stringID !== $id) {
                    continue;
                }
                $mapped = self::mapSuggestions(array($stringID => $suggestions));
                $result['suggestions'] = $mapped[$stringID];
                break;
            }
        }
        return $result;
    }
}

//EOF
