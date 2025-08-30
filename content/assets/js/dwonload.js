let coolDown = 120;
document.addEventListener("DOMContentLoaded", function () {
  const cooldownMessage = document.getElementById("cooldown-message");
  const toggleContainer = document.getElementById("toggle-container");
  coolDownFun(coolDown, cooldownMessage, toggleContainer);
  const interval = setInterval(() => {
    coolDown = coolDownFun(coolDown , cooldownMessage, toggleContainer, interval);
  }, 1000);
});

document.addEventListener("DOMContentLoaded", function () {
  const contentId = getContentIdFromUrl();
  fetch(`../assets/json/downloads/${contentId}.json`)
      .then(response => response.json())
      .then(data => populatePage(data))
      .catch(error => {
        const container = document.getElementById('content-container');
        container.innerHTML = `
          <div id="container-header"><h1>Error 404 - Data not found</h1>
          </div><div style="text-align: left; padding: 10px; line-height: 1.8;">
            Content ID: <span style="font-weight: bold; color: #ad7878">${contentId}</span>.<br>Content not found in downloads.json.<br>This Error usually happens when the link is modified.<br>Please check the link and try again.
          </div>`;
        console.error('No data found for content ID:', contentId);
        console.error('Error loading JSON:', error)
  });

  function getContentIdFromUrl() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('content');
  }

  function populatePage(pageData) {
    const downloadButtonsContainer = document.getElementById('download-buttons');
    if(pageData["generated-code"]){
        const codeDiv = document.getElementById("generated-code");
        document.getElementById("toggle-container").checked = false;
        const key = generateKey();
        codeDiv.setAttribute("value", key);
        document.getElementById("generated-code-container").removeAttribute("hidden");
    }

    const title = document.getElementById('container-header');
    title.innerHTML = `<h1>${pageData.title}</h1>`

    // Generate buttons
    pageData.buttons.forEach((button, index) => {
        const btn = document.createElement('button');
        btn.innerText = button.text;
        btn.className = button.color + ' general-button';
        btn.dataset.href = button.link;
        btn.addEventListener('click', () => {
            const sound = document.getElementById("clickSound")
            playSound(sound)
            setTimeout(() => {
                const baseHref = btn.getAttribute("data-href");
                if (!baseHref) return;
                if (document.getElementById("disable-toggle").checked && coolDown === 0) {
                    document.location.href = baseHref;
                } else {
                    if (baseHref.match(new RegExp("^https?://")) === null) return;
                    const baseUrl = `https://link-to.net/908484/${Math.random() * 1000}/dynamic/`;
                    const href = `${baseUrl}?r=${btoa(encodeURI(baseHref))}`;
                    document.location.href = href;
                }
            },sound.duration * 1000); 
        });
        downloadButtonsContainer.appendChild(btn);

        // Hide buttons beyond the 4th
        if (index >= 4 && pageData.buttons[4]) {
            btn.style.display = 'none';
        }
    });

    // Add "Others" button if there are more than 5 buttons
    if (pageData.buttons.length > 5) {
        const othersBtn = document.createElement('button');
        othersBtn.innerText = '▼ Others';
        othersBtn.className = 'general-button gray-button';
        othersBtn.addEventListener('click', () => {
            const sound = document.getElementById("clickSound")
            playSound(sound)
            const hiddenButtons = Array.from(downloadButtonsContainer.children).slice(4);
            hiddenButtons.forEach(button => {
                button.style.display = button.style.display === 'none' ? 'flex' : 'none';
            });
            othersBtn.innerText = othersBtn.innerText === 'Others' ? 'Hide Others' : 'Others';
        });
        downloadButtonsContainer.appendChild(othersBtn);
    }
}



});

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
  const sound = document.getElementById("clickSound")
  playSound(sound)
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
function coolDownFun(coolDown, cooldownMessage, toggleContainer, interval) {
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
  const sound = document.getElementById("clickSound")
  playSound(sound)
  var toggleContainer = document.getElementById("disable-toggle");
  toggleContainer.checked = !toggleContainer.checked;
}

function playSound(sound) {
  sound.pause()
  sound.currentTime = 0
  sound.volume = 0.1
  sound.play();
}