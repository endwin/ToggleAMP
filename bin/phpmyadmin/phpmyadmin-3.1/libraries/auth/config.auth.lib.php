<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * Set of functions used to run config authentication (ie no authentication).
 *
 * @version $Id$
 */


/**
 * Displays authentication form
 *
 * @return  boolean   always true
 *
 * @access  public
 */
function PMA_auth()
{
    return TRUE;
} // end of the 'PMA_auth()' function


/**
 * Gets advanced authentication settings
 *
 * @return  boolean   always true
 *
 * @access  public
 */
function PMA_auth_check()
{
    return TRUE;
} // end of the 'PMA_auth_check()' function


/**
 * Set the user and password after last checkings if required
 *
 * @return  boolean   always true
 *
 * @access  public
 */
function PMA_auth_set_user()
{
    return TRUE;
} // end of the 'PMA_auth_set_user()' function


/**
 * User is not allowed to login to MySQL -> authentication failed
 *
 * @global  string    the MySQL error message PHP returns
 * @global  string    the connection type (persistent or not)
 * @global  string    the MySQL server port to use
 * @global  string    the MySQL socket port to use
 * @global  array     the current server settings
 * @global  string    the font face to use in case of failure
 * @global  string    the default font size to use in case of failure
 * @global  string    the big font size to use in case of failure
 * @global  boolean   tell the "PMA_mysqlDie()" function headers have been
 *                    sent
 *
 * @return  boolean   always true (no return indeed)
 *
 * @access  public
 */
function PMA_auth_fails()
{
    global $php_errormsg, $cfg;

    $conn_error = PMA_DBI_getError();
    if (!$conn_error) {
        if (isset($php_errormsg)) {
            $conn_error = $php_errormsg;
        } else {
            $conn_error = $GLOBALS['strConnectionError'];
        }
    }

    // Defines the charset to be used
    header('Content-Type: text/html; charset=' . $GLOBALS['charset']);
    /* HTML header */
    $page_title = $GLOBALS['strAccessDenied'];
    require './libraries/header_meta_style.inc.php';
    ?>
</head>

<body>
<br /><br />
<center>
    <h1><?php echo sprintf($GLOBALS['strWelcome'], ' phpMyAdmin '); ?></h1>
</center>
<br />
<table border="0" cellpadding="0" cellspacing="3" align="center" width="80%">
    <tr>
        <td>

    <?php
    $GLOBALS['is_header_sent'] = TRUE;
    ?>
    <div style="max-width: 650px; margin: 30px auto; padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="font-size: 24px; margin-right: 10px;">⚠️</div>
            <h2 style="margin: 0; font-size: 18px; color: #1e293b;">MySQL 데이터베이스에 연결할 수 없습니다</h2>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
            현재 데이터베이스(MySQL) 서비스가 <strong>정지(Stopped)</strong> 상태이거나 아직 시작되지 않았습니다.
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 12px 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
                <strong>해결 방법:</strong><br>
                1. <strong><a href="http://localhost:4000" target="_blank" style="color: #0284c7; text-decoration: underline;">nobreak 대시보드 (http://localhost:4000)</a></strong>로 이동합니다.<br>
                2. 상단의 <strong>[ ▶ Start All ]</strong> 버튼(또는 Database 카드의 <strong>[ ▶ ]</strong> 버튼)을 클릭하여 서비스를 시작합니다.<br>
                3. 이 페이지를 <strong>새로고침(F5)</strong>하면 정상적으로 관리 화면이 열립니다.
            </p>
        </div>
        <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            오류 메시지: <?php echo htmlspecialchars($conn_error); ?>
        </div>
    </div>
    </td>
    </tr>
<?php
    if (count($GLOBALS['cfg']['Servers']) > 1) {
        // offer a chance to login to other servers if the current one failed
        require_once './libraries/select_server.lib.php';
        echo '<tr>' . "\n";
        echo ' <td>' . "\n";
        PMA_select_server(TRUE, TRUE);
        echo ' </td>' . "\n";
        echo '</tr>' . "\n";
    }
    echo '</table>' . "\n";
    require_once './libraries/footer.inc.php';
    return TRUE;
} // end of the 'PMA_auth_fails()' function

?>
