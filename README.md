# ⚡ `ToggleAMP` — Modern Multi-Stack Local Development Environment

<div align="center">
  <img src="web/logo.png" alt="ToggleAMP Logo" width="128" height="128">
  <br><br>
  <strong>Laragon을 현대적으로 재해석한 초경량, 고성능, 포터블 멀티 웹서버/멀티 런타임 로컬 개발 환경</strong>
  <br><br>

  [![Version](https://img.shields.io/badge/version-1.3.0-brightgreen.svg)](VERSION.txt)
  [![GitHub](https://img.shields.io/badge/GitHub-ToggleAMP-blue?logo=github)](https://github.com/endwin/ToggleAMP)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(x64)-informational.svg)]()
</div>

---

## 📖 개요 (Overview)

`ToggleAMP`는 Windows 환경에서 복잡한 설치 과정 없이 압축 해제만으로 즉시 사용할 수 있는 **독립형 포터블 로컬 웹 개발 스택 관리자**입니다.

- **네이티브 C# 데스크톱 앱 (`ToggleAMP.exe`) & 시스템 트레이 (`NotifyIcon`)** (Authenticode 디지털 서명 적용)
- **콘솔 화면 유지 런처 (`ToggleAMP.cmd`) 및 개발자 터미널 (`ToggleAMP terminal`)**
- **모던 반응형 웹 대시보드 (`http://localhost:4000`)**
- **Nginx ⇄ Apache 웹 서버 실시간 1-클릭 전환**
- **PHP 5.2 (Legacy) ~ PHP 8.4 최신 버전 자유 전환 & php.ini 실시간 핫리로드**
- **MariaDB 11.4/10.11 및 MySQL 8.4/8.0/5.1 다중 데이터베이스 엔진 (데이터 격리)**
- **5개 전체 서비스 (웹서버, PHP, DB, Redis, Mailpit) 실시간 모니터링 및 동적 제어**
- **실시간 활동 및 로그 스트림 (Live Activity & Error Logs)**: 서비스별 필터링(전체/웹서버/PHP/DB/시스템/오류)
- **듀얼 phpMyAdmin 아키텍처** (최신 v5.2.2 & 레거시 v3.1.3.1)
- **가상 호스트 (`*.test`) & 로컬 SSL 자동 발급 및 안전 영구 삭제 기능**
- **시스템 전체 다국어 지원 (한국어 기본, English, 日本語)**
- **중앙 집중식 버전 관리 및 버전 불일치 무결성 검증 (`VERSION.txt`)**

---

## ✨ 핵심 기능 (Key Features)

### 1. 듀얼 웹 서버 엔진 (Nginx 1.26.1 & Apache 2.4.68)
- 1-클릭 또는 CLI 명령어로 Nginx와 Apache를 자유롭게 전환할 수 있습니다.
- 통일된 FastCGI(`127.0.0.1:9000`) 아키텍처를 적용하여 웹 서버 전환 시에도 PHP 설정과 프로젝트 연결이 완벽하게 유지됩니다.

### 2. 멀티 PHP 런타임 스위칭 (PHP 5.2 ~ 8.4) & 실시간 설정 적용
- **지원 버전**: PHP 8.4.25, PHP 8.3.33, PHP 8.2.33, PHP 8.1.34, PHP 7.4.33, PHP 5.2.9 (Legacy).
- **데이터베이스 드라이버 완비**: `mysqli`, `pdo_mysql`, `sqlite3`, `pdo_sqlite` 내장 지원.
- **php.ini 실시간 핫리로드**: 웹 대시보드 환경설정에서 업로드 용량(`upload_max_filesize`, `post_max_size`), 메모리 제한(`memory_limit`) 등 수정 시 활성 PHP 엔진이 자동으로 갱신되어 즉시 적용됩니다.
- 레거시 스택 자동 페어링: PHP 5.2 선택 시 MySQL 5.1로 자동 동기화.

### 3. 멀티 데이터베이스 엔진 (MariaDB & MySQL)
- **MariaDB**: 11.4 LTS, 10.11 LTS
- **MySQL**: 8.4 LTS, 8.0, 5.1.33 (Legacy)
- 각 엔진 및 버전별로 데이터 저장 디렉터리(`data/db/`)가 완전히 격리되어 버전 변경 시에도 데이터 충돌이 발생하지 않습니다.
- 초기 구동 시 데이터 디렉터리가 자동 초기화(`mariadb-install-db.exe` / `mysqld --initialize-insecure`)되며 로컬 개발용 권한이 기본 설정됩니다.

### 4. 듀얼 phpMyAdmin (phpMyAdmin Dual Engine)
- **phpMyAdmin (최신 v5.2.2)**: `http://localhost/myadmin/` (PHP 7.x ~ 8.x MySQL/MariaDB 환경)
- **phpMyAdmin 3.1 (v3.1.3.1)**: `http://localhost/phpmyadmin/` (PHP 5.2 레거시 환경)
- 활성화된 PHP 버전에 맞춰 적합한 phpMyAdmin 도구가 자동으로 연동됩니다.

### 5. 실시간 활동 및 로그 모니터링 (Live Activity & Error Logs)
- 웹 대시보드와 데스크톱 제어 센터 창, CLI에서 실시간 로그를 즉시 확인할 수 있습니다.
- 최근 100줄의 활동 내역을 즉시 로드하며, 실시간 새 로그가 발생할 때마다 동적으로 화면에 추가됩니다.
- **카테고리 필터링**: `전체`, `웹서버`, `PHP`, `DB`, `시스템`, `오류` 전용 필터 탭 제공.

### 6. 가상 호스트 (`*.test`) & 로컬 SSL 자동화 및 안전 삭제
- `www/` 폴더 내 프로젝트 디렉터리를 실시간으로 자동 감지합니다.
- **프레임워크 자동 매핑**:
  - Laravel / Symfony 프로젝트: `public/` 디렉터리를 Document Root로 자동 라우팅
  - PHP 표준 프로젝트: `index.php` 및 일반 스크립트 실행
  - 정적 HTML 사이트: 불필요한 PHP 리라이트 없이 HTML 파일 직접 서빙
- **Hosts 동기화**: `[Hosts 관리자 권한 동기화]` 버튼 클릭 시 Windows `hosts` 파일에 `*.test` 도메인을 즉시 자동 등록.
- **안전 삭제 기능 (Delete with Confirmation)**:
  - 대시보드 가상 호스트 목록에서 `[ 🗑️ 삭제 ]` 버튼 클릭 시 확인 모달이 노출됩니다.
  - 사용자가 확인을 완료하면 `www/프로젝트폴더` 내 모든 파일, Nginx/Apache VHost 설정, SSL 인증서가 안전하게 영구 정리됩니다. (기본 루트인 `default`는 보호되어 삭제 불가)

### 7. Quick Tools & 패키지 매니저
- **미설치 패키지**: `[ 📥 설치 ]` 버튼으로 공식 바이너리를 원클릭 다운로드 및 압축 해제.
- **설치된 패키지**: `[ 적용 ]` 버튼으로 즉시 전환하거나, `[ 🗑️ 삭제 ]` 버튼으로 바이너리를 삭제하여 디스크 용량 절약.
- **안전 잠금(Safe Lock)**: 서버가 실행 중일 때는 오작동 방지를 위해 런타임 전환 및 패키지 삭제가 안전하게 차단됩니다.

### 8. 다국어 지원 (i18n)
- 데스크톱 제어 센터 및 웹 대시보드 상단 헤더의 드롭다운을 통해 실시간으로 언어를 변경할 수 있습니다.
- **지원 언어**: `한국어` (기본값), `English`, `日本語`
- `language/*.lang` 파일 기반으로 동작하며 시스템 고유명사는 보존됩니다.

### 9. 중앙 집중식 버전 관리 및 버전 무결성 검증 (`VERSION.txt`)
- 프로젝트 루트의 `VERSION.txt` 파일 하나로 시스템 전체의 버전을 통합 관리합니다.
- 변경 내역(Changelog & Release Notes)이 `VERSION.txt`에 누적 기록됩니다.
- **버전 불일치 무결성 검증 (Version Integrity Check)**: 실제 시스템 코드 버전과 `VERSION.txt` 버전이 불일치할 경우 CLI 배너와 대시보드 상단에 경고 알림(`Mismatch Detected`)이 자동으로 표시됩니다.

---

## 🚀 빠른 시작 및 실행/종료 방법 (Quick Start & Shutdown)

### 1. 프로그램 실행 (Launch)

선호하시는 방식에 따라 2가지 방법 중 하나로 실행할 수 있습니다:

* **방법 1: 데스크톱 C# 제어 센터 (`ToggleAMP.exe` 또는 `ToggleAMP.lnk`)**
  * 시스템 트레이 아이콘과 직관적인 윈도우 창을 통해 서비스를 제어합니다.
  * Windows 11 스마트 앱 컨트롤(SAC) 호환 디지털 서명이 적용되어 있습니다.
* **방법 2: 콘솔 런처 (`ToggleAMP.cmd`)**
  * 콘솔 창이 닫히지 않고 화면이 유지되며 실시간 활동 및 오류 로그를 콘솔과 브라우저에서 동시 확인할 수 있습니다.
  * 데몬 구동과 함께 **웹 대시보드(`http://localhost:4000`)가 기본 브라우저에 자동 오픈**됩니다.

```text
대시보드 주소: http://localhost:4000
```

### 2. 프로그램 완전 종료 (Shutdown)
ToggleAMP 및 실행 중인 모든 스택 서비스(Nginx/Apache, PHP, DB, Redis, Mailpit)를 종료하는 방법:

1. **윈도우 시스템 트레이에서 1-클릭 종료 (추천)**:
   - 화면 우측 하단 트레이 아이콘 우클릭 ➡️ **`❌ ToggleAMP 완전 종료 (Exit)`** 클릭
2. **데스크톱 제어 센터 창에서 종료**:
   - `ToggleAMP` 제어 센터 창 상단 툴바의 **`❌ 종료`** 버튼 클릭
3. **원클릭 종료 스크립트 실행**:
   - `ToggleAMP-stop.cmd`를 더블클릭
4. **터미널(CLI) 명령어 종료**:
   - `ToggleAMP stop` 또는 `ToggleAMP shutdown`

---

## 💻 CLI 명령어 레퍼런스 (Command Reference)

| 명령어 | 설명 | 예시 |
|---|---|---|
| `ToggleAMP` / `ToggleAMP.exe` | 데스크톱 제어 센터 창 열기 및 서버 시작 | `ToggleAMP.exe` |
| `ToggleAMP status` | 전체 서비스 가동 상태 및 활성 버전 출력 | `ToggleAMP status` |
| `ToggleAMP start` | 모든 활성 서비스 구동 | `ToggleAMP start` |
| `ToggleAMP stop` / `shutdown` | 모든 서비스 정지 및 ToggleAMP 데몬 완전 종료 | `ToggleAMP stop` |
| `ToggleAMP logs` | 실시간 콘솔 로그 스트림 출력 | `ToggleAMP logs` |
| `ToggleAMP terminal` | PHP/DB 환경변수(PATH)가 설정된 개발자 터미널 열기 | `ToggleAMP terminal` |
| `ToggleAMP webserver switch <nginx\|apache>` | 웹 서버 엔진 전환 | `ToggleAMP webserver switch apache` |
| `ToggleAMP php use <버전>` | PHP 버전 전환 | `ToggleAMP php use 8.4` |
| `ToggleAMP db switch <mariadb\|mysql> [버전]` | 데이터베이스 엔진/버전 전환 | `ToggleAMP db switch mariadb 11.4` |
| `ToggleAMP site list` | `www/` 폴더 내 프로젝트 및 도메인 목록 출력 | `ToggleAMP site list` |
| `ToggleAMP vhost sync` | Nginx/Apache VHost 및 Windows hosts 파일 동기화 | `ToggleAMP vhost sync` |
| `ToggleAMP -v` / `--version` | ToggleAMP 현재 버전 출력 (`VERSION.txt` 기준) | `ToggleAMP -v` |

---

## 📁 디렉터리 구조 (Directory Structure)

```text
ToggleAMP/
├── ToggleAMP.exe         # C# 네이티브 데스크톱 제어 센터 & 시스템 트레이 앱 (디지털 서명 완료)
├── ToggleAMP.lnk         # 바로가기 아이콘
├── ToggleAMP.cmd         # 화면 유지형 CMD 콘솔 런처 & CLI 명령어
├── ToggleAMP-stop.cmd    # 1-클릭 서비스 정지 배치 스크립트
├── ToggleAMP.js          # 멀티 스택 코어 엔진 & HTTP/SSE 데몬
├── ToggleAMP.ico         # 멀티 해상도 Windows 아이콘 (16px ~ 256px)
├── ToggleAMP.png         # 로고 이미지
├── VERSION.txt           # 마스터 버전 파일 (단일 기준)
├── compile.cmd           # ToggleAMP.exe 컴파일 & 자동 디지털 서명 스크립트
├── app.manifest          # Windows 10/11 호환성 및 실행 매니페스트
│
├── src/                  # C# 소스 코드
│   ├── ToggleAMPApp.cs   # 데스크톱 윈폼 & 트레이 제어 센터 소스
│   └── AssemblyInfo.cs   # 어셈블리 메타데이터
│
├── version/              # 다국어 버전 히스토리 & 패치 아카이브
│   ├── version_en.txt    # 영문 릴리즈 노트 & 패치 히스토리
│   ├── version_kr.txt    # 국문 릴리즈 노트 & 패치 히스토리
│   └── version_jp.txt    # 일문 릴리즈 노트 & 패치 히스토리
│
├── config/               # 엔진별 설정 파일
│   ├── ToggleAMP.json    # 시스템 메인 설정
│   ├── nginx/            # nginx.conf 및 vhosts/*.conf
│   ├── apache/           # httpd.conf 및 vhosts/*.conf
│   ├── php/              # 버전별 php.ini (php-8.4.ini, php-8.3.ini ...)
│   └── mysql/            # 엔진별 my.ini (my-mariadb-11.4.ini ...)
│
├── bin/                  # 포터블 런타임 바이너리 디렉터리
│   ├── node/             # Node.js 런타임 (공식 디지털 서명 완료)
│   ├── nginx/            # Nginx 바이너리
│   ├── apache/           # Apache HTTPD 바이너리
│   ├── php/              # PHP 버전별 폴더 (php-8.4, php-8.3, php-5.2 ...)
│   ├── db/               # DB 버전별 폴더 (mariadb-11.4, mysql-8.4, mysql-5.1 ...)
│   ├── phpmyadmin/       # phpmyadmin-latest (v5.2) & phpmyadmin-3.1
│   ├── redis/            # Redis 서버
│   └── mailpit/          # Mailpit 바이너리
│
├── data/                 # 데이터베이스 저장소 및 SSL 인증서
│   ├── db/               # DB 데이터 파일 (엔진/버전별 격리 디렉터리)
│   └── ssl/              # 가상 호스트용 *.test.crt 및 *.test.key
│
├── language/             # 다국어 번역 파일 (.lang)
│   ├── en.lang           # English
│   ├── ko.lang           # 한국어 (기본)
│   └── ja.lang           # 日本語
│
├── logs/                 # 실시간 활동 및 서비스 로그
│   ├── activity/         # 일자별 활동 로그 (activity-YYYY-MM-DD.log)
│   ├── nginx/            # Nginx access & error 로그
│   ├── apache/           # Apache access & error 로그
│   ├── php/              # PHP error 로그
│   └── mysql/            # MySQL / MariaDB error 로그
│
├── web/                  # 웹 대시보드 프론트엔드 (HTML5, Tailwind CSS, JavaScript)
└── www/                  # 사용자 웹 프로젝트 작업 공간
    ├── default/          # 기본 시작 페이지 (http://localhost)
    ├── my-laravel/       # Laravel 프레임워크 예제 (http://my-laravel.test)
    └── php-info/         # phpinfo() 테스트 페이지 (http://php-info.test)
```

---

## 🌐 기본 포트 및 접속 주소 (Default Ports & URLs)

| 서비스 / 도구 | 기본 접속 주소 | 포트 (Port) | 계정 / 비고 |
|---|---|---|---|
| **ToggleAMP 대시보드** | `http://localhost:4000` | `4000` | 모던 웹 대시보드 GUI |
| **웹 서버 (Nginx / Apache)** | `http://localhost` / `http://*.test` | `80` (HTTP) / `443` (HTTPS) | 가상 호스트 자동 연결 |
| **PHP FastCGI** | `127.0.0.1:9000` | `9000` | MySQL/MariaDB 드라이버 완비 |
| **phpMyAdmin (최신)** | `http://localhost/myadmin/` | `80` | MySQL / MariaDB (PHP 7~8) |
| **phpMyAdmin 3.1** | `http://localhost/phpmyadmin/` | `80` | MySQL 5.1 (PHP 5.2 Legacy) |
| **MariaDB / MySQL** | `127.0.0.1:3306` | `3306` | User: `root` (기본 암호 없음) |
| **Mailpit Webmail** | `http://localhost:8025` | `8025` (Web) / `1025` (SMTP) | 로컬 발송 이메일 실시간 캡처 |
| **Redis** | `127.0.0.1:6379` | `6379` | 인메모리 캐시 서버 |

---

## 📄 라이선스 (License)

This project is licensed under the MIT License.
자세한 내용은 [LICENSE](LICENSE) 파일을 참조하십시오.
