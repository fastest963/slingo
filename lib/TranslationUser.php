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
}

//EOF
