import { songs } from "./assets/songs.js";

const audioController = document.querySelector(".play-pause-btn");
const forwardBtn = document.querySelector(".forward-btn");
const rewindBtn = document.querySelector(".rewind-btn");
const playBtn = document.querySelector(".play-pause");
const maxDuration = document.querySelector(".max-duration");
const minDuration = document.querySelector(".min-duration");
const songContainer = document.querySelector(".song-scrollable-content");
const player = document.querySelector(".player");
const seekBall = document.querySelector(".seek-ball");
const seekingBar = document.querySelector(".seeking-bar");
const seekCon = document.querySelector(".seek");

const pause = `<path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/>`;
const play = `<path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/>`;

let isPlaying = false;
let songsLength = Object.keys(songs).length;
let previousSongIndex = 0;
let intervalId;
let audioContext;
let analyser;
let source;
let canvas;
let ctx;
let bufferLength;
let dataArray;
let mySongs = [];

const audio = new Audio(); // one single reusable audio element

document.addEventListener("DOMContentLoaded", () => {
	audioController.addEventListener("click", () => togglePlayPause());
	forwardBtn.addEventListener("click", forward);
	rewindBtn.addEventListener("click", rewind);
	addSongs();
	setupAudio();
});

function setupAudio() {
	audio.addEventListener("ended", forward);
	audio.addEventListener("loadedmetadata", () => {
		maxDuration.innerHTML = formatTime(audio.duration);
	});
	audio.addEventListener("timeupdate", updateProgressBar);
	audio.addEventListener("play", () => {
		audioContext?.resume();
	});
}
async function togglePlayPause() {
	if (audio.src === "" && mySongs.length > 0) {
		await loadSong(0);
		return;
	}
	if (isPlaying) {
		audio.pause();
		playBtn.innerHTML = play;
		clearInterval(intervalId);
		isPlaying = false;
	} else {
		try {
			await audio.play();
			playBtn.innerHTML = pause;
			animate();
			isPlaying = true;
		} catch (error) {
			console.error("Playback failed:", error);
		}
	}
}
async function loadSong(index) {
	if (index < 0 || index >= mySongs.length) return;
	audio.src = mySongs[index];
	await audio.load();
	try {
		await audio.play();
		playBtn.innerHTML = pause;
		isPlaying = true;
		previousSongIndex = index;
		waveform(audio);
		animate();
	} catch (error) {
		console.error("Playback failed:", error);
	}
}

function forward() {
	let nextIndex = previousSongIndex + 1;
	if (nextIndex >= mySongs.length) nextIndex = 0;
	loadSong(nextIndex);
}

function rewind() {
	let prevIndex = previousSongIndex - 1;
	if (prevIndex < 0) prevIndex = mySongs.length - 1;
	loadSong(prevIndex);
}

async function addSongs() {
	for (let i = 0; i < songsLength; i++) {
		let songItem = document.createElement("span");
		let songLength = document.createElement("span");

		songItem.classList.add("songitem");
		songLength.classList.add("song-length");

		let tempAudio = new Audio(songs[i]);
		tempAudio.onloadedmetadata = () => {
			songLength.innerText = formatTime(tempAudio.duration);
		};

		songItem.setAttribute("data-index", i);

		songItem.innerHTML = `<span class='song-name'>${songs[i].substring(
			songs[i].search(/songs/) + 6,
			songs[i].length - 4
		)}</span>`;

		songItem.onclick = () => {
			loadSong(parseInt(songItem.getAttribute("data-index")));
		};

		songItem.appendChild(songLength);
		mySongs.push(songs[i]);
		songContainer.appendChild(songItem);
		songItem.classList.add("appear-animation");
	}
}

function formatTime(duration) {
	const minutes = Math.floor(duration / 60);
	let seconds = Math.floor(duration % 60);
	if (seconds < 10) seconds = "0" + seconds;
	return `${minutes}:${seconds}`;
}

function animate() {
	clearInterval(intervalId);
	intervalId = setInterval(() => {
		minDuration.innerHTML = formatTime(audio.currentTime);
	}, 1000);
}

function updateProgressBar() {
	if (audio.duration) {
		const progressPercent = (audio.currentTime / audio.duration) * 100;
		seekingBar.style.width = `${progressPercent}%`;
		seekBall.style.left = `${progressPercent - 2}%`;
	}
}

function waveform(song) {
	if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
	}

	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.classList.add("img-container");
		player.innerHTML = "";
		player.appendChild(canvas);
		ctx = canvas.getContext("2d");
		canvas.width = player.clientWidth - 120;
		canvas.height = 200;
	} else {
		player.innerHTML = "";
		player.appendChild(canvas);
	}

	if (!source || source.mediaElement !== song) {
		if (source) {
			source.disconnect();
		}
		source = audioContext.createMediaElementSource(song);
		analyser = audioContext.createAnalyser();
		source.connect(analyser);
		analyser.connect(audioContext.destination);

		analyser.fftSize = 256;
		bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);
	}

	let smoothData = new Uint8Array(bufferLength);

	function draw() {
		analyser.getByteFrequencyData(dataArray);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const barWidth = (canvas.width / bufferLength) * 2;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			smoothData[i] += (dataArray[i] - smoothData[i]) * 0.2;

			let barHeight = Math.pow(smoothData[i], 0.8);
			const y = canvas.height / 2 - barHeight / 2;

			ctx.fillStyle = "rgb(110, 1, 17)";
			ctx.fillRect(x, y, barWidth, barHeight + 19);

			ctx.fillStyle = "rgba(224, 68, 1, 0.85)";
			ctx.fillRect(x, y, barWidth, barHeight + 12);

			x += barWidth + 2;
		}
		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}

seekCon.addEventListener("click", (e) => {
	if (!audio.src) return;

	const seekWidth = seekCon.clientWidth;
	const offsetX = e.offsetX;
	const percentage = offsetX / seekWidth;
	const newTime = audio.duration * percentage;
	audio.currentTime = newTime;

	// Immediately update UI
	seekingBar.style.width = `${percentage * 100}%`;
	seekBall.style.left = `${percentage * 100}%`;
});
