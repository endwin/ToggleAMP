<?php
/* phpMyAdmin 5.2.2 Configuration for nobreak */
$cfg['blowfish_secret'] = 'nobreak_fresh_secret_key_32_bytes_1234567890';
$cfg['CookieName'] = 'pma_latest_session';
$cfg['Lang'] = 'ko';
$cfg['DefaultLang'] = 'ko';
$cfg['DefaultCharset'] = 'utf-8';
$cfg['TempDir'] = 'C:/koken/bin/phpmyadmin/phpmyadmin-latest/tmp';
$cfg['PmaNoRelation_DisableWarning'] = true;
$cfg['SuhosinDisableWarning'] = true;
$cfg['SendErrorReports'] = 'never';

$i = 0;
$i++;
$cfg['Servers'][$i]['auth_type'] = 'config';
$cfg['Servers'][$i]['user'] = 'root';
$cfg['Servers'][$i]['password'] = '';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Servers'][$i]['nopassword'] = true;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
?>
