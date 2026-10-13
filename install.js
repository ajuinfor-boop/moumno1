#!/usr/bin/env node
// Claude 데스크톱에 zettaCC 서버용 SSH MCP(ssh-mcp)를 등록한다.
// 사용법: node install.js  (값을 물어봄)
//    또는: node install.js --host=1.2.3.4 --port=22 --user=root --key=~/.ssh/id_ed25519
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const SERVER_NAME = "zettacc-ssh";

function configPath() {
  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
    default:
      return path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }
}

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function prompt(rl, question, def) {
  return new Promise((resolve) => {
    // 입력이 끝난 경우(파이프 등)에는 기본값을 쓴다.
    const onClose = () => resolve(def || "");
    rl.once("close", onClose);
    rl.question(def ? `${question} [${def}]: ` : `${question}: `, (ans) => {
      rl.off("close", onClose);
      resolve(ans.trim() || def || "");
    });
  });
}

function expandHome(p) {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

async function main() {
  const opts = parseArgs();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const defaultKey = path.join(os.homedir(), ".ssh", "id_ed25519");

  const host = opts.host || (await prompt(rl, "zettaCC 서버 주소(IP 또는 도메인)"));
  const port = opts.port || (opts.host ? "22" : await prompt(rl, "SSH 포트", "22"));
  const user = opts.user || (await prompt(rl, "SSH 사용자명", "root"));
  let key = opts.key;
  let password = opts.password;
  if (!key && !password) {
    key = await prompt(rl, "SSH 개인키 경로 (비밀번호 방식이면 비워두기)", fs.existsSync(defaultKey) ? defaultKey : "");
    if (!key) password = await prompt(rl, "SSH 비밀번호");
  }
  rl.close();

  if (!host || !user || (!key && !password)) {
    console.error("호스트, 사용자, 키 또는 비밀번호가 모두 필요합니다.");
    process.exit(1);
  }

  const sshArgs = [`--host=${host}`, `--port=${port}`, `--user=${user}`];
  if (key) {
    key = path.resolve(expandHome(key));
    if (!fs.existsSync(key)) console.warn(`경고: 키 파일이 없습니다: ${key}`);
    sshArgs.push(`--key=${key}`);
  } else {
    sshArgs.push(`--password=${password}`);
  }
  sshArgs.push("--timeout=60000");

  const npxArgs = ["-y", "ssh-mcp", "--", ...sshArgs];
  // Windows의 Claude 데스크톱은 npx.cmd를 직접 실행하지 못하는 경우가 있어 cmd /c로 감싼다.
  const entry =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "npx", ...npxArgs] }
      : { command: "npx", args: npxArgs };

  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let config = {};
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, "utf8");
    try {
      config = raw.trim() ? JSON.parse(raw) : {};
    } catch (e) {
      console.error(`기존 설정 파일의 JSON이 잘못되었습니다: ${file}\n${e.message}`);
      process.exit(1);
    }
    const backup = `${file}.bak-${Date.now()}`;
    fs.copyFileSync(file, backup);
    console.log(`기존 설정 백업: ${backup}`);
  }
  config.mcpServers = config.mcpServers || {};
  config.mcpServers[SERVER_NAME] = entry;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
  if (password && process.platform !== "win32") fs.chmodSync(file, 0o600);

  console.log(`\n'${SERVER_NAME}' MCP 서버를 등록했습니다: ${file}`);
  console.log("Claude 데스크톱을 완전히 종료(트레이/메뉴바 포함)한 뒤 다시 실행하세요.");
}

main();
