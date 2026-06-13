export class Chronometer {
    constructor(storageKey = 'chronometer') {
        this.storageKey = storageKey;
        this.totalTime = 60000;
        this.remainingTime = 60000;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.startTime = null;

        // Load saved state
        this.loadState();
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();

        this.intervalId = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.remainingTime = Math.max(0, this.totalTime - elapsed);

            this.saveState();

            if (this.remainingTime === 0) {
                this.stop();
            }
        }, 10);

        this.saveState();
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.intervalId);
        this.totalTime = this.remainingTime;

        this.saveState();
    }

    resume() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.start();
    }

    stop() {
        if (!this.isRunning && !this.isPaused) return;

        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.intervalId);
        this.totalTime = this.remainingTime;

        this.saveState();
    }

    reset() {
        this.stop();
        this.totalTime = 60000;
        this.remainingTime = 60000;
        this.startTime = null;
        this.isPaused = false;

        this.saveState();
    }

    saveState() {
        const state = {
            totalTime: this.totalTime,
            remainingTime: this.remainingTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            startTime: this.startTime,
            savedAt: Date.now()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);

        if (!saved) return;

        try {
            const state = JSON.parse(saved);

            if (state.isRunning) {
                // Calculate how much time has passed since last save
                const timeElapsedSinceStart = Date.now() - state.startTime;

                this.remainingTime = Math.max(0, state.totalTime - timeElapsedSinceStart);
                this.totalTime = state.totalTime;

                // If timer finished while page was closed
                if (this.remainingTime === 0) {
                    this.isRunning = false;
                    this.isPaused = false;
                    this.totalTime = 0;
                } else {
                    // Resume the timer
                    this.startTime = state.startTime;
                    this.isRunning = true;
                    this.isPaused = false;
                    this.start();
                }
            } else if (state.isPaused) {
                // Timer was paused
                this.totalTime = state.totalTime;
                this.remainingTime = state.remainingTime;
                this.startTime = state.startTime;
                this.isPaused = true;
                this.isRunning = false;
            } else {
                // Timer was stopped
                this.totalTime = state.totalTime;
                this.remainingTime = state.remainingTime;
                this.startTime = state.startTime;
                this.isPaused = false;
                this.isRunning = false;
            }
        } catch (error) {
            console.error('Failed to load chronometer state:', error);
        }
    }

    getTime() {
        const totalMilliseconds = this.remainingTime;
        const seconds = Math.floor(totalMilliseconds / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);

        if (this.isFinished()) {
            if (window.triggerShake) {
                window.triggerShake({
                    tint: 'rgba(170,170,170,0.2)', // Soft Green
                    intensity: '4px'
                });
            }

            setTimeout(() => {
                window.location.href = "end/end_chrono.html"
            }, 1200);
        }

        return {
            seconds: String(seconds).padStart(2, '0'),
            milliseconds: String(milliseconds).padStart(2, '0')
        };
    }

    getFormattedTime() {
        const time = this.getTime();
        return `${time.seconds}.${time.milliseconds}`;
    }

    isFinished() {
        return this.remainingTime === 0;
    }
}