import { songs } from "./assets/songs.js";

const audioController = document.querySelector(".play-pause-btn");
const forwardBtn = document.querySelector(".forward-btn");
const rewindBtn = document.querySelector(".rewind-btn");
const playBtn = document.querySelector(".play-pause");
const maxDuration = document.querySelector(".max-duration");
const minDuration = document.querySelector(".min-duration");
const songContainer = document.querySelector(".song-container");
const player = document.querySelector(".player");

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
		clearInterval(intervalId); // Stop updating min duration
	} else {
		isPlaying = true;
		playBtn.innerHTML = pause;
		previousSong.play();
		animate(); // Start updating min duration
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

		songItem.innerHTML = `<span>${songs[i].substring(
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
		}
	}, 1000);
}

function waveform(song) {
	// Check if AudioContext already exists
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

	// IMPORTANT: Create source only if not already created for the SAME song
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

	function draw() {
		analyser.getByteFrequencyData(dataArray);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const barWidth = (canvas.width / bufferLength) * 1.5;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			const barHeight = dataArray[i];
			const y = canvas.height / 2 - barHeight / 2;

			ctx.fillStyle = "rgb(255, 0, 0)";
			ctx.fillRect(x, y, barWidth, barHeight + 2);

			x += barWidth + 2;
		}
		requestAnimationFrame(draw);
	}

	song.removeEventListener("play", song._drawListener); // Remove old listener if any
	song._drawListener = () => {
		audioContext.resume().then(draw);
	};
	song.addEventListener("play", song._drawListener);
}
