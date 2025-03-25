class WheelPicker {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.names = this.getStoredNames();
        this.colors = [
            '#3369e8', '#009925', '#d50f25', '#EEB211', '#9C27B0'
            
        ];
        // '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        this.isSpinning = false;
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.spinningSound = document.getElementById('spinningSound');
        this.celebrationSound = document.getElementById('celebrationSound');
        this.winningSound = document.getElementById('winningSound');
        this.confettiPieces = [];
        this.confettiInterval = null;
        this.wheelColor = this.getStoredColor('wheelColor', '#FF5733');
        this.textColor = this.getStoredColor('textColor', '#FFFFFF');
        this.spinDuration = this.getStoredNumber('spinDuration', 7);
        this.lastWinner = null;

        // Populate the textarea with stored names
        document.getElementById('nameInput').value = this.names.join('\n');

        this.setupCanvas();
        this.setupEventListeners();
        this.setupInitialColor();
        this.drawWheel();
    }

    setupCanvas() {
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }

    setupEventListeners() {
        document.getElementById('spinButton').addEventListener('click', () => this.spin());
        document.getElementById('addButton').addEventListener('click', () => this.addNames());
        document.getElementById('clearButton').addEventListener('click', () => this.clearNames());
        document.getElementById('removeWinner').addEventListener('click', () => this.removeWinner());
        document.getElementById('keepWinner').addEventListener('click', () => this.keepWinner());
        document.getElementById('wheelColor').addEventListener('input', (e) => this.updateWheelColor(e.target.value));
        document.getElementById('textColor').addEventListener('input', (e) => this.updateTextColor(e.target.value));
        document.getElementById('spinDuration').addEventListener('input', (e) => this.updateSpinDuration(e.target.value));

        // Add real-time monitoring of textarea changes with immediate updates
        const nameInput = document.getElementById('nameInput');
        let timeoutId;
        nameInput.addEventListener('input', () => {
            // Clear previous timeout
            clearTimeout(timeoutId);
            
            // Update immediately
            const newNames = nameInput.value.split('\n').filter(name => name.trim());
            this.names = newNames;
            this.storeNames();
            this.drawWheel();

            // Set a short timeout for any additional updates
            timeoutId = setTimeout(() => {
                const finalNames = nameInput.value.split('\n').filter(name => name.trim());
                if (JSON.stringify(finalNames) !== JSON.stringify(this.names)) {
                    this.names = finalNames;
                    this.storeNames();
                    this.drawWheel();
                }
            }, 100); // Reduced to 100ms for faster updates
        });

        // Add color box selection
        const colorBoxes = document.querySelectorAll('.color-box');
        colorBoxes.forEach(box => {
            box.addEventListener('click', () => {
                // Remove active class from all boxes
                colorBoxes.forEach(b => b.classList.remove('active'));
                // Add active class to clicked box
                box.classList.add('active');
                // Update wheel color
                this.updateWheelColor(box.dataset.color);
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawWheel();
        });
    }

    setupInitialColor() {
        // Set initial color in color picker
        const colorBoxes = document.querySelectorAll('.color-box');
        colorBoxes.forEach(box => {
            if (box.dataset.color === this.wheelColor) {
                box.classList.add('active');
            } else {
                box.classList.remove('active');
            }
        });

        // Set initial color in color input
        document.getElementById('wheelColor').value = this.wheelColor;
        document.getElementById('textColor').value = this.textColor;
        document.getElementById('spinDuration').value = this.spinDuration;
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.names.length === 0) {
            this.drawEmptyWheel(centerX, centerY, radius);
            return;
        }

        const sliceAngle = (2 * Math.PI) / this.names.length;

        for (let i = 0; i < this.names.length; i++) {
            // Adjust the angle to align with the pointer at the top
            const startAngle = i * sliceAngle + this.currentRotation - Math.PI / 2;
            const endAngle = (i + 1) * sliceAngle + this.currentRotation - Math.PI / 2;

            // Draw slice with different color for each segment
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[i % this.colors.length]; // Use different color for each segment
            this.ctx.fill();
            
            // Add gray border
            this.ctx.strokeStyle = '#FFFFFF'; // Gray color // #808080
            this.ctx.lineWidth = 1; // 1px border
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = 'bold 24px Roboto';
            this.ctx.fillText(this.names[i], radius - 30, 5);
            this.ctx.restore();
        }
    }

    drawEmptyWheel(centerX, centerY, radius) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.wheelColor;
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.textColor;
        this.ctx.font = 'bold 20px Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Add names to begin', centerX, centerY);
    }

    createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position
        const left = Math.random() * 100;
        confetti.style.left = left + 'vw';
        
        // Random delay
        const delay = Math.random() * 2;
        confetti.style.animationDelay = delay + 's';
        
        // Random size
        const size = 5 + Math.random() * 10;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        // Random color
        //const colors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFA500'];
        const colors = ['#3369e8', '#009925', '#d50f25', '#EEB211', '#9C27B0'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random shape
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        } else {
            confetti.style.borderRadius = '0';
        }
        
        document.body.appendChild(confetti);
        this.confettiPieces.push(confetti);

        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
            this.confettiPieces = this.confettiPieces.filter(c => c !== confetti);
        }, 5000 + delay * 1000);
    }

    startConfetti() {
        // Create initial confetti
        for (let i = 0; i < 150; i++) { // Increased initial confetti
            this.createConfetti();
        }

        // Continue creating confetti
        this.confettiInterval = setInterval(() => {
            if (this.confettiPieces.length < 300) { // Increased max confetti
                this.createConfetti();
            }
        }, 50);
    }

    stopConfetti() {
        clearInterval(this.confettiInterval);
        this.confettiPieces.forEach(confetti => confetti.remove());
        this.confettiPieces = [];
    }

    showCelebration(winner) {
        const celebrationOverlay = document.querySelector('.celebration-overlay');
        const celebrationWinner = document.getElementById('celebrationWinner');
        
        celebrationWinner.textContent = winner;
        celebrationOverlay.style.display = 'flex';
        this.startConfetti();
        this.celebrationSound.play();

        // Prevent scrolling
        document.body.style.overflow = 'hidden';

        // Hide celebration after 5 seconds
        setTimeout(() => {
            celebrationOverlay.style.display = 'none';
            this.stopConfetti();
            this.showWinnerAnnouncement(winner);
        }, 5000);
    }

    spin() {
        this.isSpinning = true;
        const spinButton = document.getElementById('spinButton');
        spinButton.disabled = true;

        // Play spinning sound
        this.spinningSound.currentTime = 0;
        this.spinningSound.play();

        const startTime = Date.now();
        const totalRotation = 5 + Math.random() * 5;
        const duration = this.spinDuration * 1000;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easing = 1 - Math.pow(1 - progress, 3);
            this.currentRotation = totalRotation * 2 * Math.PI * easing;

            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                spinButton.disabled = false;
                this.spinningSound.pause();
                this.announceWinner();
            }
        };

        animate();
    }

    showWinnerAnnouncement(winner) {
        const overlay = document.querySelector('.overlay');
        const announcement = document.querySelector('.winner-announcement');
        const winnerName = document.getElementById('winnerName');
        
        winnerName.textContent = winner;
        overlay.style.display = 'block';
        announcement.style.display = 'block';
        
        // Play winning sound
        this.winningSound.play();
        
        // Keep scrolling disabled
        document.body.style.overflow = 'hidden';
    }

    hideWinnerAnnouncement() {
        const overlay = document.querySelector('.overlay');
        const announcement = document.querySelector('.winner-announcement');
        
        overlay.style.display = 'none';
        announcement.style.display = 'none';
        
        // Re-enable scrolling
        document.body.style.overflow = 'auto';
    }

    announceWinner() {
        const sliceAngle = (2 * Math.PI) / this.names.length;
        const normalizedRotation = (this.currentRotation - Math.PI / 2) % (2 * Math.PI);
        const winnerIndex = Math.floor(
            (2 * Math.PI - normalizedRotation) / sliceAngle
        ) % this.names.length;
        
        this.lastWinner = this.names[winnerIndex];
        this.showCelebration(this.lastWinner);
    }

    updateWheelColor(color) {
        this.wheelColor = color;
        this.setCookie('wheelColor', color);
        this.drawWheel();
    }

    updateTextColor(color) {
        this.textColor = color;
        this.setCookie('textColor', color);
        this.drawWheel();
    }

    updateSpinDuration(duration) {
        this.spinDuration = parseInt(duration);
        this.setCookie('spinDuration', duration);
    }

    addNames() {
        // This method is kept for backward compatibility but is no longer needed
        this.drawWheel();
    }

    clearNames() {
        this.names = [];
        this.storeNames();
        // Clear the textarea
        document.getElementById('nameInput').value = '';
        this.drawWheel();
    }

    removeWinner() {
        if (this.lastWinner) {
            this.names = this.names.filter(name => name !== this.lastWinner);
            this.storeNames();
            this.drawWheel();
            this.hideWinnerAnnouncement();
        }
    }

    keepWinner() {
        this.hideWinnerAnnouncement();
    }

    // Cookie management methods
    setCookie(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        // Add SameSite and Secure attributes for better cookie handling
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
    }

    getCookie(name) {
        const cookieName = `${name}=`;
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(cookieName) === 0) {
                return decodeURIComponent(cookie.substring(cookieName.length, cookie.length));
            }
        }
        return null;
    }

    getStoredColor(name, defaultValue) {
        return this.getCookie(name) || defaultValue;
    }

    getStoredNumber(name, defaultValue) {
        const value = this.getCookie(name);
        return value ? parseInt(value) : defaultValue;
    }

    getStoredNames() {
        const storedNames = this.getCookie('names');
        try {
            if (!storedNames) return [];
            const parsedNames = JSON.parse(storedNames);
            return Array.isArray(parsedNames) ? parsedNames : [];
        } catch (e) {
            console.error('Error parsing stored names:', e);
            return [];
        }
    }

    storeNames() {
        try {
            if (!Array.isArray(this.names)) {
                console.error('Names is not an array:', this.names);
                return;
            }
            const namesString = JSON.stringify(this.names);
            this.setCookie('names', namesString);
            console.log('Stored names:', this.names); // Debug log
        } catch (e) {
            console.error('Error storing names:', e);
        }
    }
}

// Initialize the wheel picker when the page loads
window.addEventListener('load', () => {
    new WheelPicker();
}); 