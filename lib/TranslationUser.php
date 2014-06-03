<?php

class TranslationUser
{
    /**
     * To decrease user points send in negative $points
     * @return bool success
     */
    public static function increaseUserPoints($userID, $points = 0)
    {
        if (empty($userID) || empty($points)) {
            return false;
        }

        $db = TranslationDB::getInstance();
        $result = $db->modifyUserPoints($userID, $points);
        return $result['success'];
    }

    public static function changeUserPassword($userID, $newPassword, $oldPassword = null)
    {

    }

    public static function hashPassword($password, $configuredSalt = null)
    {
        if (empty($configuredSalt)) {
            throw new Exception("Not salt provided for TranslationUser::hashPassword! Did you forget to set it in config?");
        }
        if (PHP_VERSION_ID > 50307) {
            $salt = '$2y$12$';
        } else {
            $salt = '$2a$12$';
        }
        return crypt($password, "{$salt}{$configuredSalt}\$");
    }
}

//EOF
