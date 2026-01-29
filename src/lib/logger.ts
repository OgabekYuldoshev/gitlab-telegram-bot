function formatMsg(msg: string, ...args: unknown[]): string {
  if (args.length === 0) return msg;
  return msg + " " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
}

export function createLogger(level: string) {
  const levels = ["debug", "info", "warn", "error"];
  const minIndex = levels.indexOf(level) >= 0 ? levels.indexOf(level) : 1;

  const log = (name: string, min: number) => (msg: string, ...args: unknown[]) => {
    if (levels.indexOf(name) >= min) {
      const out = formatMsg(msg, ...args);
      const fn = name === "error" ? console.error : name === "warn" ? console.warn : console.log;
      fn(`[${name}]`, out);
    }
  };

  return {
    debug: log("debug", minIndex),
    info: log("info", minIndex),
    warn: log("warn", minIndex),
    error: (msg: string | Error, ...args: unknown[]) => {
      if (minIndex <= levels.indexOf("error")) {
        const out =
          msg instanceof Error ? msg.message + " " + (msg.stack ?? "") : formatMsg(msg, ...args);
        console.error("[error]", out);
      }
    },
  };
}
