# AutoLabDocs ⚡

![AutoLabDocs Banner](https://placehold.co/1200x400/050505/3b82f6?text=AUTOLABDOCS&font=montserrat)

> **Stop wasting your life on Microsoft Word.**
> Paste code. Get a perfect PDF. Pass the lab.

Look, nobody became an engineer to drag-and-drop screenshots into a Word doc at 3 AM. **AutoLabDocs** is the tool that ends that misery. I built this because I was tired of the busywork, and now it's here to save your weekends too.

It's not just a "formatter"—it's a full-blown execution engine that runs your code, captures the output (even the graphs), and hands you a submission-ready PDF before you can finish your coffee.

## 🚀 Why This Rules

-   **Native Execution, No BS**: We don't just "highlight" your code. We *run* it. Python, C, C++, Node.js—it all executes in a real, isolated environment.
-   **PDFs That Look Better Than Yours**: Syntax highlighting? Check. Vector graphs? Check. Formatting that makes TAs weep with joy? Double check.
-   **VSCode in the Browser**: The IDE experience you know and love, right there in the web app. No learning curve.
-   **Bulletproof Security**: Every single line of code runs in a locked-down Docker container. It’s safer than your grandma’s PC.
-   **Traffic? What Traffic?**: Our custom queue system handles load like a champ. 100 students trying to submit at 11:59 PM? No problem.

## 🛠️ The Stack (Heavy Hitters Only)

We didn't cut corners. We built this with the best tools available.

### Frontend
-   **Next.js 16 (React 19)**: Bleeding edge. Fast as hell.
-   **Tailwind CSS v4**: Because writing CSS files is so 2015.
-   **Monaco Editor**: The engine behind VSCode. If it's good enough for Microsoft, it's good enough for us.

### Backend & The "Secret Sauce"
-   **Custom Runner Service**: A Node.js beast using `node-pty` to stream real terminal outputs via WebSockets. It's real-time, it's raw, and it's beautiful.
-   **Docker Isolation**: Custom-built `python-runner` images that spin up in milliseconds and vanish just as fast.
-   **PostgreSQL + Prisma**: Rock-solid data storage.
-   **JWT Auth**: Secure, stateless, and scalable.

## 🧠 Engineering Flex (How We Handle Edge Cases)

This isn't a hackathon toy. It's built to survive the real world.

1.  **"Nice Try, Hackers"**: You can't break out. Containers run with `--network none` (no internet access), restricted CPUs, and capped memory. You run your logic, not a crypto miner.
2.  **The Queue**: We implemented a smart FIFO semaphore system. If the server is full, you don't crash it—you get a ticket. We process jobs orderly, ensuring 100% uptime.
3.  **Garbage Collection**: We clean up after ourselves. Ephemeral containers and temp files are nuked instantly after execution. The server stays lean and mean.

## 💻 Run It Yourself

Want to see how the sausage is made? Here is how you spin it up locally.

### Prerequisites
-   Node.js (v18+)
-   Docker (Running)
-   Postgres

### Setup

1.  **Clone it.**
    ```bash
    git clone https://github.com/yourusername/autolabdocs.git
    cd autolabdocs
    ```

2.  **Install the goods.**
    ```bash
    npm install
    cd backend-runner && npm install && cd ..
    ```

3.  **Config.**
    Create a `.env` file. You know the drill.
    ```env
    DATABASE_URL="postgresql://user:pass@localhost:5432/autolabdocs"
    SESSION_SECRET="mash-your-keyboard-here-to-make-it-secure"
    ```

4.  **Database.**
    ```bash
    npx prisma db push
    ```

5.  **Build the Runner.**
    *Crucial Step.* You need the engine image.
    ```bash
    cd backend-runner
    docker build -t python-runner:latest .
    cd ..
    ```

6.  **Launch.**
    Terminal 1 (Frontend):
    ```bash
    npm run dev
    ```
    Terminal 2 (The Muscle):
    ```bash
    cd backend-runner
    node server.js
    ```

---

**Built by Adithya Hegde Kota.**

I solve my problems. Then I generalize them so you can solve yours. I am leveling up, getting sharper, and building faster every single day.

**Open for opportunities.** If you want a builder who actually ships high-leverage work, let's talk.