document.addEventListener("DOMContentLoaded", function () {
  const spoilers = document.querySelectorAll(".spoiler");
  spoilers.forEach((spoiler) => {
    const spoilerHead = spoiler.querySelector(".spoiler_head");
    const spoilerBody = spoiler.querySelector(".spoiler_body");
    spoilerBody.style.display = "none"; // Hide spoiler body by default
    spoilerHead.style.cursor = "pointer"; // Change cursor to indicate clickable
    spoilerHead.style["user-select"] = "none";
    spoilerHead.textContent = "▲ " + spoilerHead.textContent;
    spoilerHead.addEventListener("click", () => {
      const sound = document.getElementById("clickSound")
      playSound(sound)
      if (spoilerHead.textContent.includes("▲")) {
        spoilerHead.textContent = spoilerHead.textContent.replace("▲ ", "▼ ");
        spoilerHead.style["background-color"] = "#727272";
      } else {
        spoilerHead.textContent = spoilerHead.textContent.replace("▼ ", "▲ ");
        spoilerHead.style["background-color"] = "#4c4c4c";
      }
      spoilerBody.style.display =
        spoilerBody.style.display === "none" ? "block" : "none";
    });
  });
});

function download(filename) {
  const sound = document.getElementById("clickSound")
  playSound(sound)
  setTimeout(function () {
    document.location.href = "../downloads.html?content=" + filename
  }, sound.duration*1000);
}

function playSound(sound) {
  sound.pause()
  sound.currentTime = 0
  sound.volume = 0.1
  sound.play();
}