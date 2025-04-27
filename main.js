import { songs } from "./assets/songs.js";

const audioController = document.querySelector(".play-pause-btn");
const forwardBtn = document.querySelector(".forward-btn");
const rewindBtn = document.querySelector(".rewind-btn");
const playBtn = document.querySelector(".play-pause");
const maxDuration = document.querySelector(".max-duration");
const minDuration = document.querySelector(".min-duration");
const songContainer = document.querySelector(".song-container");

const pause = `<path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/>`;
const play = `<path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/>`;

let isPlaying = false;
let songsLength = Object.keys(songs).length;
let previousSong = null;
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
	} else {
		isPlaying = true;
		playBtn.innerHTML = pause;
		previousSong.play();
	}

	previousSong.onloadedmetadata = () => {
		maxDuration.innerHTML = formatTime(previousSong.duration);
	};
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
