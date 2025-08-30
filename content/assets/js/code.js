const chars = {a0: "G",a1: "V",a2: "C",a3: "D",a4: "E",a5: "F",a6: "K",a7: "X",a8: "S",a9: "L",aa: "W",ab: "T",ac: "M",ad: "Z",ae: "R",af: "P",};
const reverseChars = Object.fromEntries(
  Object.entries(chars).map(([k, v]) => [v, k])
);

const expiryPeriodInHours = 24;
const validLetters = ["g", "e", "d", "n", "x", "l"];
const regexPattern = new RegExp(`^[${validLetters.join("")}]{6}$`);

function generateRandomString() {
  return Array.from(
    { length: 6 },
    () => validLetters[Math.floor(Math.random() * validLetters.length)]
  ).join("");
}

function generateKey() {
  const pattern = generateRandomString();
  const currentTime = Date.now();
  const expiryTime = (currentTime + expiryPeriodInHours * 60 * 60 * 1000)
    .toString()
    .padStart(13, "0");
  const key =
    pattern.slice(0, 4) +
    expiryTime.slice(4, 13) +
    expiryTime.slice(0, 4) +
    pattern.slice(4);
  const tmp = stringToHex(key);

  let result = "";
  for (let i = 0; i < tmp.length; i++) {
    result += chars[`a${tmp[i]}`];
  }
  return result;
}

function isKeyValid(keyC) {
  let hexKey = "";
  for (let i = 0; i < keyC.length; i++) {
    const t = reverseChars[keyC[i]];
    if (!t) return false;
    hexKey += t[1];
  }

  const key = hexToString(hexKey);
  const pattern = key.slice(0, 4) + key.slice(17, 19);

  const expiryTime = parseInt(key.slice(13, 17) + key.slice(4, 13));
  const currentTime = Date.now();
  console.log(expiryTime - expiryPeriodInHours * 60 * 60 * 1000, currentTime);
  return (
    currentTime < expiryTime &&
    currentTime >= expiryTime - expiryPeriodInHours * 2 * 60 * 60 * 1000 &&
    regexPattern.test(pattern) &&
    keyC.length === 38
  );
}

function stringToHex(str) {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex;
}

function hexToString(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

function copyText() {
  const textField = document.getElementById("generated-code");
  textField.select();
  textField.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand("copy");
  showNotification();
}
function showNotification() {
  var notificationBar = document.getElementById("notification-bar");
  notificationBar.style.display = "block";
  setTimeout(function () {
    notificationBar.style.display = "none";
  }, 2000);
}
function coolDownFun(coolDown, cooldownMessage, toggleContainer) {
  if (coolDown === 0) {
    clearInterval(interval);
    cooldownMessage.style.display = "none";
    toggleContainer.style.display = "flex";
  } else {
    cooldownMessage.textContent = `Short links will be disabled in ${coolDown} seconds.`;
    coolDown--;
  }

  return coolDown;
}
function toggleChecked() {
  var toggleContainer = document.getElementById("disable-toggle");
  toggleContainer.checked = !toggleContainer.checked;
  console.log("toggled, checked:", toggleContainer.checked);
}

document.addEventListener("DOMContentLoaded", function () {
  const codeDiv = document.getElementById("generated-code");
  document.getElementById("toggle-container").checked = false;
  const key = generateKey();
  codeDiv.setAttribute("value", key);

  let coolDown = 60;
  const cooldownMessage = document.getElementById("cooldown-message");
  const toggleContainer = document.getElementById("toggle-container");
  coolDownFun(coolDown, cooldownMessage, toggleContainer);
  const interval = setInterval(() => {
    coolDown = coolDownFun(coolDown , cooldownMessage, toggleContainer);
  }, 1000);

  const linkButtons = document.querySelectorAll("button[id^='link-button']");
  linkButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const sound = document.getElementById("clickSound")
      playSound(sound)
      const baseHref = this.getAttribute("data-href");
      if (!baseHref) return;
      if (document.getElementById("disable-toggle").checked && coolDown === 0) {
        clearInterval(interval);
        window.open(baseHref, "_blank");
      } else {
        if (baseHref.match(new RegExp("^https?://")) === null) return;
        const baseUrl = `https://link-to.net/908484/${
          Math.random() * 1000
        }/dynamic/`;
        const href = `${baseUrl}?r=${btoa(encodeURI(baseHref))}`;
        window.open(href, "_blank");
      }
    });
  });
});


function playSound(sound) {
  sound.pause()
  sound.currentTime = 0
  sound.volume = 0.1
  sound.play();
}