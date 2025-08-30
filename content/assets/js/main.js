
document.addEventListener("DOMContentLoaded", function () {
    const navItem = document.querySelectorAll(".navbar-item");
    fetchPosts('projects');
    for (const item of navItem) {
        item.addEventListener("click", () => {
            const sound = document.getElementById("clickSound")
            playSound(sound)
            if (item.classList.contains("navbar-selected")) return;
            navItem.forEach((item) => item.classList.remove("navbar-selected"));
            item.classList.add("navbar-selected");
            const fn = {
                Projects: 'projects',
                Others: 'others',
                Social: 'social',
                Friends: 'friends',
            }[item.textContent];
            if (fn) fetchPosts(fn);
        });
    }
});

function fetchPosts(category) {
    fetch('assets/json/posts.json')
        .then(response => response.json())
        .then(data => {
            switch (category) {
                case 'projects':
                    updateImage('assets/images//pro.png', 'Projects');
                    addPosts(data.mods);
                    break;
                case 'others':
                    updateImage('assets/images/oth.png', 'Others');
                    addPosts(data.others);
                    break;
                case 'friends':
                    updateImage('assets/images/fre.png', 'Friends');
                    addPosts(data.friends);
                    break;
                case 'social':
                    updateImage('assets/images/soc.png', 'Social');
                    addPosts(data.social);
                    break;
            }
        })
        .catch(error => console.error('Error fetching posts:', error));
}

function updateImage(src, alt) {
    const img = document.querySelector(".img-title");
    img.src = src;
    img.alt = alt;
}

function addPosts(posts) {
    const container = document.querySelector(".container");
    container.innerHTML = "";
    posts.forEach(post => {
        const postDiv = document.createElement("div");
        postDiv.onclick = () => {
            const sound = document.getElementById("clickSound")
            playSound(sound)
            setTimeout(() => {
                if(post.coverImage.includes("modbay.org")){
                    const htmlName = post.link.split("org/").pop()
                    document.location.href = "content/" + htmlName;
                    return
                }
                if(post.link == "#") return
                window.open(post.link, "_blank"); 
            },sound.duration * 1000);
        };
        postDiv.className = "post";

        const coverDiv = document.createElement("div");
        coverDiv.className = "cover";

        const coverBg = document.createElement("div");
        coverBg.className = "cover-bg";
        coverBg.style.backgroundImage = `url(${post.coverImage})`;
        const coverGradient = document.createElement("div");
        coverGradient.className = "cover-gradient";
        coverDiv.appendChild(coverBg);
        coverDiv.appendChild(coverGradient);

        const titleElement = document.createElement("h2");
        titleElement.className = "title";
        titleElement.textContent = post.title;

        const descriptionElement = document.createElement("p");
        descriptionElement.className = "description";
        descriptionElement.textContent = post.description;

        const linkElement = document.createElement("a");
        linkElement.appendChild(titleElement);

        postDiv.appendChild(coverDiv);
        postDiv.appendChild(linkElement);
        postDiv.appendChild(descriptionElement);
        container.appendChild(postDiv);
    });
}

function playSound(sound) {
    sound.pause()
    sound.currentTime = 0
    sound.volume = 0.1
    sound.play();
  }