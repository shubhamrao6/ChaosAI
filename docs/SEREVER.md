Perfect ✅ — let’s evolve the WebSocket server into a **multi-session command executor** with **job tracking**.
We’ll keep it minimal but structured enough for scaling later.

---

# ⚡ Design: WebSocket Job Tracking

* Each client connection gets a **sessionId** (UUID).
* Each command is a **job** with a unique `jobId`.
* Jobs tracked in memory:

  ```python
  jobs = {
    jobId: {
      "sessionId": "...",
      "command": "...",
      "status": "running|done|error|killed",
      "output": [],
      "pid": 1234
    }
  }
  ```
* Actions supported:

  1. `run` → run a new command
  2. `status` → get job status
  3. `kill` → stop job

---

# ⚡ Live Server (Azure Kali Machine)

🌐 **Server URL**: `ws://40.76.252.88:8765/ws`

The WebSocket server is deployed and running on an Azure Kali Linux machine with all required packages installed.

---

# ⚡ Full Server Code (`server.py`)

```python
import asyncio
import json
import shlex
import subprocess
import uuid
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
jobs = {}  # jobId -> job details
sessions = {}  # connectionId -> sessionId


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    session_id = str(uuid.uuid4())
    sessions[id(ws)] = session_id
    await ws.send_text(json.dumps({"sessionId": session_id, "status": "connected"}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            action = msg.get("action")

            if action == "run":
                command = msg.get("command")
                if not command:
                    await ws.send_text(json.dumps({"error": "No command provided"}))
                    continue

                job_id = str(uuid.uuid4())
                argv = shlex.split(command)

                process = await asyncio.create_subprocess_exec(
                    *argv,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                jobs[job_id] = {
                    "sessionId": session_id,
                    "command": command,
                    "status": "running",
                    "output": [],
                    "pid": process.pid,
                    "returncode": None,
                }

                await ws.send_text(json.dumps({
                    "jobId": job_id,
                    "status": "started",
                    "command": command
                }))

                # Stream stdout
                async for line in process.stdout:
                    line_text = line.decode().strip()
                    jobs[job_id]["output"].append(line_text)
                    await ws.send_text(json.dumps({
                        "jobId": job_id,
                        "status": "running",
                        "line": line_text
                    }))

                # Stream stderr
                async for line in process.stderr:
                    line_text = line.decode().strip()
                    jobs[job_id]["output"].append(line_text)
                    await ws.send_text(json.dumps({
                        "jobId": job_id,
                        "status": "error",
                        "line": line_text
                    }))

                returncode = await process.wait()
                jobs[job_id]["status"] = "done"
                jobs[job_id]["returncode"] = returncode

                await ws.send_text(json.dumps({
                    "jobId": job_id,
                    "status": "done",
                    "exitCode": returncode
                }))

            elif action == "status":
                job_id = msg.get("jobId")
                job = jobs.get(job_id)
                if not job:
                    await ws.send_text(json.dumps({"error": "Job not found"}))
                else:
                    await ws.send_text(json.dumps({
                        "jobId": job_id,
                        "status": job["status"],
                        "command": job["command"],
                        "exitCode": job["returncode"],
                        "lines": job["output"][-5:],  # last 5 lines for preview
                    }))

            elif action == "kill":
                job_id = msg.get("jobId")
                job = jobs.get(job_id)
                if not job:
                    await ws.send_text(json.dumps({"error": "Job not found"}))
                else:
                    try:
                        os.kill(job["pid"], 9)
                        job["status"] = "killed"
                        await ws.send_text(json.dumps({
                            "jobId": job_id,
                            "status": "killed"
                        }))
                    except Exception as e:
                        await ws.send_text(json.dumps({
                            "error": f"Failed to kill job {job_id}: {str(e)}"
                        }))
            else:
                await ws.send_text(json.dumps({"error": f"Unknown action: {action}"}))

    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected")
        sessions.pop(id(ws), None)
    except Exception as e:
        await ws.send_text(json.dumps({"error": str(e)}))
```

---

# ⚡ How to Test

## Option 1: wscat (Command Line)

```bash
wscat -c ws://40.76.252.88:8765/ws
```

## Option 2: Postman (GUI)

1. **Create WebSocket Request**:
   - New → WebSocket Request
   - URL: `ws://40.76.252.88:8765/ws`
   - Click "Connect"

2. **Test Commands**:

   **Run a command:**
   ```json
   {"action":"run","command":"ping -c 3 google.com"}
   ```

   **Get job status:**
   ```json
   {"action":"status","jobId":"<uuid-from-response>"}
   ```

   **Kill job:**
   ```json
   {"action":"kill","jobId":"<uuid-from-response>"}
   ```

## Option 3: Web Client (HTML)

Open `index.html` in your browser - it's already configured to connect to the Azure server.

---

# ⚡ Expected Responses

- Connection: `{"sessionId":"...","status":"connected"}`
- Job started: `{"jobId":"...","status":"started","command":"..."}`
- Real-time output: `{"jobId":"...","status":"running","line":"..."}`
- Job completed: `{"jobId":"...","status":"done","exitCode":0}`

---

# ✅ What You Now Have

* **Live Azure deployment**: Server running at `ws://40.76.252.88:8765/ws`
* **Session tracking**: Each connection has its own sessionId
* **Job tracking**: Jobs have jobIds with state (`running`, `done`, `killed`)
* **Actions**: `run`, `status`, `kill`
* **Streaming**: stdout/stderr sent line by line
* **Web client**: HTML interface for easy testing

---

👉 Next step could be persisting this job table in **SQLite or DynamoDB** so jobs survive restarts.

Do you want me to **extend this server with persistence (SQLite)** so you can test long jobs and still query their status later, even after restarting the WebSocket server?
