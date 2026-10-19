# zettaCC 서버용 SSH MCP: Claude 데스크톱 설정

Claude 데스크톱이 [`ssh-mcp`](https://www.npmjs.com/package/ssh-mcp)를 거쳐 zettaCC 서버에 SSH로 접속하고 명령을 실행할 수 있게 설정합니다.

## 준비물

- **Node.js 18 이상**: `node -v`로 확인합니다. 없으면 https://nodejs.org 에서 LTS 버전을 설치하세요.
- zettaCC 서버 주소, SSH 포트, 사용자명
- SSH 키 파일(권장) 또는 비밀번호
- 터미널에서 `ssh -p <포트> <사용자>@<서버>`로 먼저 접속되는지 확인해 두세요.

## 자동 설치 (권장)

이 저장소를 받은 뒤 해당 폴더에서 다음을 실행합니다.

```bash
node install.js
```

질문에 답하면 Claude 데스크톱 설정 파일에 `zettacc-ssh` 서버가 추가됩니다. 이미 등록된 다른 MCP 서버는 그대로 유지되고, 기존 파일은 `.bak-<타임스탬프>`로 백업됩니다.

값을 미리 넘겨서 질문 없이 실행할 수도 있습니다.

```bash
node install.js --host=1.2.3.4 --port=22 --user=root --key=~/.ssh/id_ed25519
```

### 서버 여러 대 등록하기

`--name`으로 서버마다 다른 이름을 주면 함께 등록됩니다. 이름을 생략하면 `zettacc-ssh`가 쓰이고, 이미 있는 이름을 주면 그 항목만 새 값으로 바뀝니다.

```bash
node install.js --name=zettacc-ssh --host=218.55.91.37 --user=root --key=~/.ssh/id_ed25519
node install.js --name=zetta-b     --host=119.196.16.251 --port=6292 --user=root --key=~/.ssh/id_ed25519
node install.js --name=zetta-c     --host=220.73.134.166 --user=root --key=~/.ssh/id_ed25519
```

Claude 데스크톱에서는 "zetta-b로 접속해서 …"처럼 이름을 붙여 요청하면 됩니다.

설치가 끝나면 **Claude 데스크톱을 완전히 종료**(macOS는 `Cmd+Q`, Windows는 트레이 아이콘에서 종료)한 뒤 다시 실행하세요.

## 수동 설치

Claude 데스크톱에서 **설정 → 개발자 → 설정 편집**을 누르거나 아래 파일을 직접 엽니다.

| OS | 경로 |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

`claude_desktop_config.example.json`의 `mcpServers.zettacc-ssh` 항목을 복사해 넣고, `ZETTACC_SERVER_IP`, 사용자명, 키 경로를 실제 값으로 바꿉니다.

- **Windows**에서는 `"command": "cmd"`로 바꾸고 `args` 맨 앞에 `"/c", "npx"`를 추가하세요. 키 경로는 `C:\\Users\\이름\\.ssh\\id_ed25519`처럼 백슬래시를 두 번씩 씁니다.
- 비밀번호 방식을 쓰려면 `--key=...` 대신 `--password=비밀번호`를 넣습니다. 이 경우 비밀번호가 설정 파일에 평문으로 저장되므로 키 방식을 권장합니다.

## 확인

Claude 데스크톱을 다시 실행한 뒤 입력창의 도구(🔨/슬라이더) 메뉴에 `zettacc-ssh`가 보이면 연결된 것입니다. 이렇게 시험해 보세요.

> zettaCC 서버에서 `uptime`과 `df -h` 실행해줘

## 문제 해결

- **서버가 보이지 않음**: Claude 데스크톱을 완전히 종료했다가 다시 실행했는지 확인하세요. 설정 파일의 JSON 문법도 확인하세요.
- **로그 위치**: macOS는 `~/Library/Logs/Claude/mcp-server-zettacc-ssh.log`, Windows는 `%APPDATA%\Claude\logs\`입니다.
- **`npx`를 찾을 수 없음**: Node.js를 설치한 뒤 PC를 재부팅하거나, `command`에 `npx`의 전체 경로(`which npx` 결과)를 넣으세요.
- **인증 실패**: 터미널의 `ssh` 명령으로 같은 키와 사용자로 접속되는지 먼저 확인하세요. 키에 암호(passphrase)가 걸려 있으면 `ssh-mcp`가 사용할 수 없으니 암호가 없는 전용 키를 만드세요.
