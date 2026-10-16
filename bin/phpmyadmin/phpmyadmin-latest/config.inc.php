<?php
/* phpMyAdmin 5.2.2 Configuration for ToggleAMP */
$cfg['blowfish_secret'] = 'ToggleAMP_secure_cookie_secret_key_32_bytes_random_991823';
$cfg['CookieName'] = 'pma_latest_session';
$cfg['Lang'] = 'ko';
$cfg['DefaultLang'] = 'ko';
$cfg['DefaultCharset'] = 'utf-8';
$cfg['TempDir'] = __DIR__ . '/tmp';
$cfg['PmaNoRelation_DisableWarning'] = true;
$cfg['SuhosinDisableWarning'] = true;
$cfg['SendErrorReports'] = 'never';
$cfg['LoginCookieValidity'] = 14400;
$cfg['LoginCookieRecall'] = true;

// Dynamic DB Port detection from ToggleAMP.json
$dbPort = '3306';
$toggleJson = __DIR__ . '/../../../config/ToggleAMP.json';
if (file_exists($toggleJson)) {
    $tj = @json_decode(file_get_contents($toggleJson), true);
    if (!empty($tj['database']['port'])) {
        $dbPort = (string)$tj['database']['port'];
    }
}

$i = 0;
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['user'] = '';
$cfg['Servers'][$i]['password'] = '';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = $dbPort;
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Servers'][$i]['nopassword'] = true;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
?>
