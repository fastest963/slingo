<?php
//don't allow this page to be cached at all
header('Expires: Thu, 19 Nov 1981 08:52:00 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
header('Pragma: no-cache');

function callAPI($method, $sessionID = null, $params = null, $protocol = 'http')
{
    $header = array();
    if (isset($sessionID)) {
        $header['sessionID'] = $sessionID;
    }
    $request = array('method' => $method,
                     'header' => $header,
                     );
    if (isset($params)) {
        $request['params'] = $params;
    }
    $url = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/api.php';
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($curl, CURLOPT_POST, 1);
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($request));
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
    $result = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    $decoded = json_decode($result, true);
    return array('result' => $result,
                 'httpCode' => $httpCode,
                 'decoded' => $decoded,
                 );
}

$allMethodsResp = callAPI('_methods_');
if ($allMethodsResp['httpCode'] != 200 || empty($allMethodsResp['decoded'])) {
    echo "<h1>Failed to load methods!</h1>";
    exit;
}
$allMethods = $allMethodsResp['decoded'];
$selectedMethod = key($allMethods);
if (!empty($_POST['selectedMethod']) && isset($allMethods[$_POST['selectedMethod']])) {
    $selectedMethod = $_POST['selectedMethod'];
}

$sessionID = "";
if (!empty($_POST['sessionID'])) {
    $sessionID = $_POST['sessionID'];
}

$apiCallResult = null;
if (isset($_POST['submitType']) && $_POST['submitType'] === 'call' && !empty($selectedMethod)) {
    if (empty($sessionID)) {
        //just want to generate a new sessionID once and not store it anywhere
        ini_set('session.cache_limiter', '');
        ini_set('session.use_cookies', 0);
        function doNothing() {}
        session_set_save_handler('doNothing', 'doNothing', 'doNothing', 'doNothing', 'doNothing', 'doNothing');
        session_start();
        $sessionID = session_id();
    }
    $params = array();
    foreach ($_POST as $key => $value) {
        if (substr($key, 0, 6) !== 'param-') {
            continue;
        }
        //try to detect and cast type, starting with json first
        if ($value[0] === '{' || $value[0] === '[') {
            $jsonValue = json_decode($value, true);
            if (!is_null($jsonValue)) {
                $value = $jsonValue;
            }
        } elseif (is_numeric($value) && $value < PHP_INT_MAX) {
            $value = (int)$value;
        } elseif ($value === 'true') {
            $value = true;
        } elseif ($value === 'false') {
            $value = false;
        }
        $params[substr($key, 6)] = $value;
    }
    $apiCallResult = callAPI($selectedMethod, $sessionID, $params);
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Slingo JSON API Explorer</title>
</head>
<body>
    <h1>Slingo API Explorer</h1>

    <h3>Methods</h3>
    <form id="methodSelectorForm" method="POST">
        <select name="selectedMethod" id="methodSelector">
<?php

$outputStrings = array();
foreach ($allMethods as $methodName => $params) {
    $output = '<option value="' . $methodName . '"';
    if ($methodName === $selectedMethod) {
        $output .= 'selected="selected"';
    }
    $output .= ">$methodName</option>";
    $outputStrings[] = $output;
}
echo implode("\n", $outputStrings);

?>
        </select>
        <input type="hidden" name="submitType" value="parameters" />
        <input type="hidden" name="sessionID" value="<?= $sessionID ?>" />
    </form>

    <script type="application/javascript">
        document.getElementById('methodSelector').addEventListener('change', function() {
            document.getElementById('methodSelectorForm').submit();
        });
    </script>

    <h3>Parameters</h3>
    <form id="methodForm" method="POST">
<?php

$outputStrings = array();
foreach ($allMethods[$selectedMethod] as $param) {
    $paramName = $param['name'];
    $inputName = "param-$paramName";
    $output = '<p>';
    $output .= '<label for="' . $inputName . '">' . $paramName . '</label>';
    $type = 'text';
    if ($paramName === 'password') {
        $type = 'password';
    }
    $output .= '<input type="' . $type . '" name="' . $inputName . '" id="' . $inputName . '" />';
    if (!$param['required']) {
        $output .= '<span>(Optional)</span>';
    }
    $output .= '</p>';
    $outputStrings[] = $output;
}
echo implode("\n", $outputStrings);

?>

        <p style="border-top: 1px solid #000; width: 350px; padding-top: 5px;">
            <label for="sessionID">header sessionID</label>
            <input type="text" name="sessionID" id="sessionID" value="<?= $sessionID ?>" />
            <span>(Optional)</span>
        </p>
        <input type="hidden" name="submitType" value="call" />
        <input type="hidden" name="selectedMethod" value="<?= $selectedMethod ?>" />
        <input type="submit" value="Submit" />
    </form>
<?php

if (!is_null($apiCallResult)) {

?>
    <h3>Result</h3>
    <p>HTTP Code: <?= $apiCallResult['httpCode'] ?></p>
    <p style="font-family: monospace, fixed;"><?= $apiCallResult['result'] ?></p>
<?php

}

?>
</body>
</html>