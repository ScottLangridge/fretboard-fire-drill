document.addEventListener('DOMContentLoaded', () => {
    const notes = [
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb",
        "G", "G#", "Ab", "A", "A#", "Bb", "B"
    ];
    const strings = ["E", "A", "D", "G", "B", "e"];
    let drillRunning = false;
    let metronomeRunning = false;
    let duration = 2.4; // Default to 25 BPM
    let currentStringIndex = 0;
    let beatCount = 0;
    let currentNoteHolder = "--";
    let currentStringHolder = "--";
    let nextNoteHolder = "--";
    let nextStringHolder = "--";
    let lastNoteHolder = "--"; // Track previous note for sequence checking
    let isMuted = false; // Track mute state

    const currentNoteElement = document.getElementById('currentNote');
    const currentStringElement = document.getElementById('currentString');
    const nextNoteElement = document.getElementById('nextNote');
    const nextStringElement = document.getElementById('nextString');
    const bpmElement = document.getElementById('bpm');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const showStringCheckbox = document.getElementById('showString');
    const consecutiveStringsCheckbox = document.getElementById('consecutiveStrings');
    const previewNextCheckbox = document.getElementById('previewNext');
    const tempoSlider = document.getElementById('tempoSlider');
    const muteSoundCheckbox = document.getElementById('muteSound');

    const tickSound = new Audio('punchy-rim-click-trap-type.mp3');
    const clickSound = new Audio('click-sound.wav');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = null;

    const guitarSamples = {
        'C': new Audio('sounds/guitar-c.wav'),
        'C#': new Audio('sounds/guitar-c-sharp.wav'),
        'Db': new Audio('sounds/guitar-c-sharp.wav'),
        'D': new Audio('sounds/guitar-d.wav'),
        'D#': new Audio('sounds/guitar-d-sharp.wav'),
        'Eb': new Audio('sounds/guitar-d-sharp.wav'),
        'E': new Audio('sounds/guitar-e.wav'),
        'F': new Audio('sounds/guitar-f.wav'),
        'F#': new Audio('sounds/guitar-f-sharp.wav'),
        'Gb': new Audio('sounds/guitar-f-sharp.wav'),
        'G': new Audio('sounds/guitar-g.wav'),
        'G#': new Audio('sounds/guitar-g-sharp.wav'),
        'Ab': new Audio('sounds/guitar-g-sharp.wav'),
        'A': new Audio('sounds/guitar-a.wav'),
        'A#': new Audio('sounds/guitar-a-sharp.wav'),
        'Bb': new Audio('sounds/guitar-a-sharp.wav'),
        'B': new Audio('sounds/guitar-b.wav')
    };

    const backgroundImages = [
        'guitar1.jpg', 'guitar2.jpg', 'guitar3.jpg', 'guitar4.jpg', 'guitar5.jpg',
        'guitar6.jpg', 'guitar7.jpg', 'guitar8.jpg', 'guitar9.jpg', 'guitar10.jpg',
        'guitar11.jpg', 'guitar12.jpg', 'guitar13.jpg', 'guitar14.jpg', 'guitar15.jpg'
    ];

    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        document.body.style.backgroundImage = `url('${backgroundImages[randomIndex]}')`;
    }

    setRandomBackground();

    function playClickSound() {
        if (!isMuted) {
            clickSound.play().catch(error => console.error("Error playing click sound:", error));
        }
    }

    function playNote(note, durationMs = 250) {
        if (!isMuted) {
            if (guitarSamples[note]) {
                const sample = guitarSamples[note];
                sample.currentTime = 0;
                sample.play().catch(error => {
                    console.error("Error playing guitar sample for", note, ":", error);
                    playSynthesizedNote(getFrequencyForNote(note));
                });
                setTimeout(() => {
                    sample.pause();
                    sample.currentTime = 0;
                }, durationMs);
            } else {
                console.warn(`No sample for note ${note}, using synthesized tone`);
                playSynthesizedNote(getFrequencyForNote(note));
            }
        }
    }

    function playSynthesizedNote(frequency, durationMs = 250) {
        if (!isMuted) {
            if (oscillator) oscillator.stop();
            oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + durationMs / 1000);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + durationMs / 1000);
        }
    }

    function playTickSound() {
        if (!isMuted) {
            tickSound.play().catch(error => console.error("Error playing tick sound:", error));
        }
    }

    function getFrequencyForNote(note) {
        const noteFrequencies = {
            'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
            'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
        };
        return noteFrequencies[note] || 440.00;
    }

    function getChromaticIndex(note) {
        const chromaticMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return chromaticMap[note] || 0;
    }

    function getRandomMusicalNote(string, sameString) {
        const chromaticNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const currentIndex = getChromaticIndex(currentNoteHolder);
        const lastIndex = getChromaticIndex(lastNoteHolder);
        let selectedNote;

        if (showStringCheckbox.checked && sameString && currentNoteHolder !== "--") {
            const validIntervals = [3, 4, 5, 7, 8, 9];
            do {
                const direction = Math.random() < 0.5 ? 1 : -1;
                const interval = validIntervals[Math.floor(Math.random() * validIntervals.length)] * direction;
                const newIndex = (currentIndex + interval + 12) % 12;
                const distanceFromLast = Math.min(
                    Math.abs(newIndex - lastIndex),
                    12 - Math.abs(newIndex - lastIndex)
                );
                if (Math.abs(newIndex - currentIndex) >= 3 && distanceFromLast >= 3) {
                    const baseNote = chromaticNotes[newIndex];
                    const options = notes.filter(n => getChromaticIndex(n) === newIndex);
                    selectedNote = options[Math.floor(Math.random() * options.length)];
                }
            } while (!selectedNote);
        } else {
            const validIntervals = [3, 4, 5, 7, 8, 9];
            do {
                const direction = Math.random() < 0.5 ? 1 : -1;
                const interval = validIntervals[Math.floor(Math.random() * validIntervals.length)] * direction;
                const newIndex = (currentIndex + interval + 12) % 12;
                if (Math.abs(newIndex - currentIndex) >= 3) {
                    const baseNote = chromaticNotes[newIndex];
                    const options = notes.filter(n => getChromaticIndex(n) === newIndex);
                    selectedNote = options[Math.floor(Math.random() * options.length)];
                }
            } while (!selectedNote);
        }
        return selectedNote;
    }

    function generateNote() {
        beatCount = (beatCount + 1) % 4;

        if (beatCount === 0) {
            lastNoteHolder = currentNoteHolder;
            currentNoteHolder = nextNoteHolder;
            currentStringHolder = nextStringHolder;

            if (consecutiveStringsCheckbox.checked) {
                const totalCycles = strings.length * 3;
                currentStringIndex = (currentStringIndex + 1) % totalCycles;
                const stringCycleIndex = Math.floor(currentStringIndex / 3);
                nextStringHolder = strings[stringCycleIndex];
                nextNoteHolder = getRandomMusicalNote(nextStringHolder, nextStringHolder === currentStringHolder);
            } else {
                nextStringHolder = strings[Math.floor(Math.random() * strings.length)];
                nextNoteHolder = getRandomMusicalNote(nextStringHolder, nextStringHolder === currentStringHolder);
            }

            if (drillRunning && beatCount === 0 && currentStringIndex % 4 === 0 && duration > 0.3) {
                duration = Math.max(0.3, duration - 0.1);
                bpmElement.textContent = Math.round(60 / duration) + " BPM";
            }
        }

        currentNoteElement.textContent = currentNoteHolder;
        if (showStringCheckbox.checked) {
            currentStringElement.textContent = currentStringHolder;
        } else {
            currentStringElement.textContent = "--";
        }

        if (previewNextCheckbox.checked) {
            nextNoteElement.textContent = nextNoteHolder;
            nextStringElement.textContent = nextStringHolder;
        } else {
            nextNoteElement.textContent = "--";
            nextStringElement.textContent = "--";
        }

        console.log("Last Note:", lastNoteHolder, "Current Note:", currentNoteHolder, "on String:", currentStringHolder, "at Beat:", beatCount);
        console.log("Next Note:", nextNoteHolder, "on String:", nextStringHolder);
        if (beatCount === 3) {
            console.log("Playing guitar note for", currentNoteHolder);
            playNote(currentNoteHolder);
        }
    }

    function startMetronome() {
        if (!metronomeRunning) {
            metronomeRunning = true;
            beatCount = 0;
            currentNoteHolder = "--";
            currentStringHolder = "--";
            nextNoteHolder = "--";
            nextStringHolder = "--";
            lastNoteHolder = "--";

            if (consecutiveStringsCheckbox.checked) {
                currentStringIndex = Math.floor(Math.random() * (strings.length * 3));
                const stringCycleIndex = Math.floor(currentStringIndex / 3);
                currentStringHolder = strings[stringCycleIndex];
                currentNoteHolder = getRandomMusicalNote(currentStringHolder, false);
                const nextStringIndex = (stringCycleIndex + 1) % strings.length;
                nextStringHolder = strings[nextStringIndex];
                nextNoteHolder = getRandomMusicalNote(nextStringHolder, false);
            } else {
                currentStringHolder = strings[Math.floor(Math.random() * strings.length)];
                currentNoteHolder = getRandomMusicalNote(currentStringHolder, false);
                nextStringHolder = strings[Math.floor(Math.random() * strings.length)];
                nextNoteHolder = getRandomMusicalNote(nextStringHolder, nextStringHolder === currentStringHolder);
            }

            currentNoteElement.textContent = currentNoteHolder;
            if (showStringCheckbox.checked) {
                currentStringElement.textContent = currentStringHolder;
            } else {
                currentStringElement.textContent = "--";
            }
            if (previewNextCheckbox.checked) {
                nextNoteElement.textContent = nextNoteHolder;
                nextStringElement.textContent = nextStringHolder;
            } else {
                nextNoteElement.textContent = "--";
                nextStringElement.textContent = "--";
            }

            function playTick() {
                if (metronomeRunning) {
                    console.log("Playing tick sound at beat", beatCount);
                    playTickSound();
                    generateNote();
                    setTimeout(playTick, duration * 1000);
                }
            }
            playTick();
        }
    }

    function stopMetronome() {
        metronomeRunning = false;
        if (oscillator) oscillator.stop();
        tickSound.pause();
        tickSound.currentTime = 0;
        for (let note in guitarSamples) {
            guitarSamples[note].pause();
            guitarSamples[note].currentTime = 0;
        }
    }

    startButton.addEventListener('click', () => {
        if (!drillRunning) {
            playClickSound();
            drillRunning = true;
            duration = (60 / 25 - 60 / 200) * (9.9 - parseFloat(tempoSlider.value)) / (9.9 - 8) + 60 / 200;
            bpmElement.textContent = Math.round(60 / duration) + " BPM";
            startMetronome();
        }
    });

    stopButton.addEventListener('click', () => {
        if (drillRunning) {
            playClickSound();
            drillRunning = false;
            stopMetronome();
            currentNoteElement.textContent = "--";
            currentStringElement.textContent = "--";
            nextNoteElement.textContent = "--";
            nextStringElement.textContent = "--";
        }
    });

    tempoSlider.addEventListener('input', () => {
        duration = (60 / 25 - 60 / 200) * (9.9 - parseFloat(tempoSlider.value)) / (9.9 - 8) + 60 / 200;
        bpmElement.textContent = Math.round(60 / duration) + " BPM";
    });

    muteSoundCheckbox.addEventListener('change', () => {
        isMuted = muteSoundCheckbox.checked;
        if (isMuted) {
            // Pause and mute all playing sounds
            tickSound.pause();
            tickSound.currentTime = 0;
            clickSound.pause();
            clickSound.currentTime = 0;
            for (let note in guitarSamples) {
                guitarSamples[note].pause();
                guitarSamples[note].currentTime = 0;
            }
            if (oscillator) oscillator.stop();
        }
    });
});