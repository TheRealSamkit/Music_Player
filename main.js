import { songs } from "./assets/songs.js";

const audioController = document.querySelector(".play-pause-btn");
const playBtn = document.querySelector(".play-pause");
const maxDuration = document.querySelector(".max-duration");
const songContainer = document.querySelector(".song-container");

const pause = `<path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/>`;
const play = `<path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/>`;
let isPlaying = false;
let songsLength = Object.keys(songs).length;
let previousSong = null;
let mySongs = [];

document.addEventListener("DOMContentLoaded", () => {
	audioController.addEventListener("click", () => playSong(previousSong));
	addSongs();
});

function playSong(song) {
	if (isPlaying) {
		isPlaying = false;
		playBtn.innerHTML = play;
		song.pause();
	} else {
		isPlaying = true;
		playBtn.innerHTML = pause;
		song.play();
		previousSong = song;
	}
}

function addSongs() {
	for (let i = 0; i < songsLength; i++) {
		let songItem = document.createElement("div");
		songItem.classList.add("songitem");
		songItem.setAttribute("data-songname", songs[i]);

		songItem.innerHTML = songs[i].substring(
			songs[i].search(/songs/) + 6,
			songs[i].length - 4
		);
		songItem.onclick = () =>
			setUp(new Audio(songItem.getAttribute("data-songname")));
		songContainer.appendChild(songItem);
		mySongs.push(songs[i]);
	}
}

function setUp(song) {
	if (previousSong === null) {
		previousSong = song;
	} else {
		previousSong.pause();
	}

	playSong(song);
	// setDuration(song);
}
