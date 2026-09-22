import { spawn } from "node:child_process";

export interface CommandResult { code: number | null; output: string; timedOut: boolean }
export function runCommand(command: string, args: string[], options: {
  cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; signal?: AbortSignal;
  onOutput?: (text: string) => void;
}): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) { reject(new Error("Installation interrupted")); return; }
    const child = spawn(command, args, { cwd: options.cwd, env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32", shell: false });
    let output = "", timedOut = false;
    let stopping: Promise<void> | undefined;
    const kill = (signal: NodeJS.Signals) => {
      try {
        if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") child.kill(signal); }
    };
    const stop = () => {
      if (stopping) return;
      kill("SIGTERM");
      // The installer may exit before its children. Finish stopping the group
      // before reporting completion or allowing another installation to start.
      stopping = new Promise(done => setTimeout(() => { kill("SIGKILL"); done(); }, 500));
    };
    const timer = setTimeout(() => { timedOut = true; stop(); }, options.timeoutMs ?? 5000);
    options.signal?.addEventListener("abort", stop, { once: true });
    const append = (chunk: string) => {
      const clean = chunk.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
      output = (output + clean).slice(-20000); options.onOutput?.(clean);
    };
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", append); child.stderr.on("data", append);
    const clear = () => { clearTimeout(timer); options.signal?.removeEventListener("abort", stop); };
    child.on("error", async error => { clear(); await stopping; reject(error); });
    child.on("close", async code => { clear(); await stopping; resolve({ code, output, timedOut }); });
  });
}
