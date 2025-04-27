import { songs } from "./assets/songs.js";

const audioController = document.querySelector(".play-pause-btn");
const forwardBtn = document.querySelector(".forward-btn");
const rewindBtn = document.querySelector(".rewind-btn");
const playBtn = document.querySelector(".play-pause");
const maxDuration = document.querySelector(".max-duration");
const minDuration = document.querySelector(".min-duration");
const songContainer = document.querySelector(".song-container");
const player = document.querySelector(".player");
const seekBall = document.querySelector(".seek-ball");
const seekingBar = document.querySelector(".seeking-bar");
const seekCon = document.querySelector(".seek");

const pause = `<path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/>`;
const play = `<path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/>`;

let isPlaying = false;
let songsLength = Object.keys(songs).length;
let previousSong = null;
let intervalId;
let audioContext;
let analyser;
let source;
let canvas;
let ctx;
let bufferLength;
let dataArray;
let mySongs = [];

document.addEventListener("DOMContentLoaded", () => {
	audioController.addEventListener("click", () => playSong());
	forwardBtn.addEventListener("click", forward);
	rewindBtn.addEventListener("click", rewind);
	addSongs();
});

function playSong(song = previousSong) {
	if (!song) {
		song = new Audio(mySongs[0]);
		previousSong = song;
	}
	if (isPlaying) {
		isPlaying = false;
		playBtn.innerHTML = play;
		previousSong.pause();
		clearInterval(intervalId);
	} else {
		isPlaying = true;
		playBtn.innerHTML = pause;
		previousSong.play();
		animate();
	}

	previousSong.onloadedmetadata = () => {
		maxDuration.innerHTML = formatTime(previousSong.duration);
	};
	waveform(previousSong);
}

function forward() {
	if (!previousSong) return;

	let currentIndex = mySongs.findIndex(
		(src) =>
			src ===
			previousSong.src.substring(
				previousSong.src.search(/as/),
				previousSong.src.length
			)
	);
	if (currentIndex === -1) currentIndex = 0;

	let nextIndex = currentIndex + 1;
	if (nextIndex >= mySongs.length) nextIndex = 0;

	previousSong.pause();
	previousSong = new Audio(mySongs[nextIndex]);
	isPlaying = false;
	playSong(previousSong);
}

function rewind() {
	if (!previousSong) return;

	let currentIndex = mySongs.findIndex(
		(src) =>
			src ===
			previousSong.src.substring(
				previousSong.src.search(/as/),
				previousSong.src.length
			)
	);
	if (currentIndex === -1) currentIndex = 0;

	let prevIndex = currentIndex - 1;
	if (prevIndex < 0) prevIndex = mySongs.length - 1;

	previousSong.pause();
	previousSong = new Audio(mySongs[prevIndex]);
	isPlaying = false;
	playSong(previousSong);
}

async function addSongs() {
	for (let i = 0; i < songsLength; i++) {
		let songItem = document.createElement("span");
		let songLength = document.createElement("span");

		songItem.classList.add("songitem");
		songLength.classList.add("song-length");

		let audio = new Audio(songs[i]);
		audio.onloadedmetadata = () => {
			songLength.innerText = formatTime(audio.duration);
		};

		songItem.setAttribute("data-songname", songs[i]);

		songItem.innerHTML = `<span class='song-name'>${songs[i].substring(
			songs[i].search(/songs/) + 6,
			songs[i].length - 4
		)}</span>`;

		songItem.onclick = () =>
			setUp(new Audio(songItem.getAttribute("data-songname")));
		songItem.appendChild(songLength);
		songContainer.appendChild(songItem);
		mySongs.push(songs[i]);
	}
}

function setUp(song) {
	if (previousSong !== null) {
		previousSong.pause();
		isPlaying = false;
	}
	previousSong = song;
	playSong(song);
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
		if (previousSong) {
			minDuration.innerHTML = formatTime(previousSong.currentTime);

			const progressPercent =
				(previousSong.currentTime / previousSong.duration) * 100;
			seekingBar.style.width = `${progressPercent}%`;
			seekBall.style.left = `${progressPercent - 2}%`;
		}
	}, 1000);
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
		canvas.width = player.clientWidth;
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
			ctx.fillRect(x, y, barWidth, barHeight + 12);

			ctx.fillStyle = "rgba(224, 68, 1, 0.85)";
			ctx.fillRect(x, y, barWidth, barHeight + 5);

			x += barWidth + 2;
		}
		requestAnimationFrame(draw);
	}

	song.removeEventListener("play", song._drawListener);
	song._drawListener = () => {
		audioContext.resume().then(draw);
	};
	song.addEventListener("play", song._drawListener);
}

seekCon.addEventListener("click", (e) => {
	if (!previousSong) return;

	const seekWidth = seekCon.clientWidth;
	const offsetX = e.offsetX; // user ne click kaha kiya
	const percentage = offsetX / seekWidth; // click ka percentage
	const newTime = previousSong.duration * percentage; // song ke duration ke hisaab se calculate
	previousSong.currentTime = newTime; // song ko nayi position pe le jaao

	// Immediately update UI
	seekingBar.style.width = `${percentage * 100}%`;
	seekBall.style.left = `${percentage * 100}%`;
});
