<?php

class TranslationString
{
    /**
     * @var TranslationString
     */
    private static $extractInstance; //used for extraction, we re-use the same instance as an optimization

    private static $staticRegex = '/{[a-zA-Z0-9\_\-]+\}/';
    private static $variableRegex = '/{([0-9]+)}/';

    //todo: priorities

    private $value;
    private $nextVarIndex = 0;
    private $variables;

    function __construct($value)
    {
        $this->setValue($value);
    }

    public static function setVariableRegex($variableRegex)
    {
        self::$variableRegex = $variableRegex;
    }

    public static function setStaticRegex($staticRegex)
    {
        self::$staticRegex = $staticRegex;
    }

    public function setValue($value)
    {
        $this->value = $value;
        //if the value changed then we can't assume that the variables are the same
        $this->nextVarIndex = 0;
        $this->variables = array();
    }

    private function replaceAndStoreStatic($matches)
    {
        if (empty($matches[0])) {
            return '';
        }
        $this->variables[] = $matches[0];
        $i = $this->nextVarIndex++;
        return '{' . $i . '}';
    }

    public function parseRawString()
    {
        if (empty(self::$variableRegex) || empty($this->value)) {
            return $this->value;
        }

        $replacedValue = preg_replace_callback(self::$staticRegex, array($this, "replaceAndStoreStatic"), $this->value);
        if (is_null($replacedValue)) {
            trigger_error("Failed to parse string! preg_replace_callback returned NULL. String: " . $this->value, E_USER_ERROR);
            return null;
        }
        $this->value = $replacedValue;
        return $replacedValue;
    }

    public function getValue()
    {
        return $this->value;
    }

    public function getVariables()
    {
        return $this->variables;
    }

    public static function convertToRawString($string, $variables)
    {
        //there is no mb_str_replace and preg_replace_callback sounds slow
        $variableIndex = 0;
        $variableCount = count($variables);
        $stringIndex = 0;
        $stringLength = mb_strlen($string);
        $finalString = "";
        while ($variableIndex < $variableCount && $stringIndex < $stringLength) {
            $replace = '{' . $variableIndex . '}';
            $nextIndex = mb_strpos($string, $replace, $stringIndex);
            if ($nextIndex === false) {
                break;
            }
            //copy over the part of the string before the {
            $finalString .= mb_substr($string, $stringIndex, ($nextIndex - $stringIndex - 1));
            $finalString .= $variables[$variableIndex];
            $stringIndex = $nextIndex + strlen($replace); //we know the text doens't contain non-ascii chars
        }
        if ($stringIndex < $stringLength) {
            //copy the rest of the string
            $finalString .= mb_substr($string, $stringIndex, ($stringLength - $stringIndex));
        }
        return $finalString;
    }

    public static function extractVariablesFromRawString($raw)
    {
        if (!isset(self::$extractInstance)) {
            self::$extractInstance = new TranslationString($raw);
        } else {
            self::$extractInstance->setValue($raw);
        }
        self::$extractInstance->parseRawString();
        $result = array('string' => self::$extractInstance->getValue(),
                        'variables' => self::$extractInstance->getVariables(),
                        );
        return $result;
    }

    public static function validateString($string, $variables)
    {
        $matches = null;
        $countMatches = preg_match_all(self::$variableRegex, $string, $matches);
        if ($countMatches != count($variables)) {
            return false;
        }
        foreach ($matches[1] as $index) {
            $index = (int)$index;
            if (!isset($variables[$index])) {
                return false;
            }
            unset($variables[$index]); //make sure they don't have the same variable twice
        }
        return true;
    }
}

if (isset(TranslationConfig::$config['staicRegex'])) {
    TranslationString::setStaticRegex(TranslationConfig::$config['staicRegex']);
}
if (isset(TranslationConfig::$config['variableRegex'])) {
    TranslationString::setStaticRegex(TranslationConfig::$config['variableRegex']);
}

//EOF
