<?php
/* phpMyAdmin 3.1.3.1 Configuration for nobreak */
$cfg['blowfish_secret'] = 'nobreak_legacy_secret_key_32_bytes_123';
$cfg['Lang'] = 'ko-utf-8';
$cfg['DefaultLang'] = 'ko-utf-8';
$cfg['DefaultCharset'] = 'utf-8';
$cfg['PmaNoRelation_DisableWarning'] = true;
$cfg['SuhosinDisableWarning'] = true;

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
$cfg['Servers'][$i]['AllowNoPasswordRoot'] = true;
$cfg['Servers'][$i]['nopassword'] = true;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
?>
