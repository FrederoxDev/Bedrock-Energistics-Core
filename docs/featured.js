const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

const shuffledCreators = shuffle(FEATURED_CREATORS);
const featuredCreatorsContainer = document.getElementById(
  "featured-creators-container",
);

for (const creator of shuffledCreators) {
  const a = document.createElement("a");
  a.className = "featured-content";
  a.href = creator.url;
  a.target = "_blank";

  const img = document.createElement("img");
  img.className = "featured-content-img";
  img.src = creator.img;

  const name = document.createElement("span");
  name.className = "featured-content-name";
  name.innerText = creator.name;

  a.appendChild(img);
  a.appendChild(name);

  featuredCreatorsContainer.appendChild(a);
}

const featuredContentContainer = document.getElementById(
  "featured-addons-container",
);
const shuffledFeaturedAddons = shuffle(FEATURED_CONTENT);

for (const addon of shuffledFeaturedAddons) {
  const a = document.createElement("a");
  a.className = "featured-content";
  a.href = addon.url;
  a.target = "_blank";

  const img = document.createElement("img");
  img.className = "featured-content-img";
  img.src = addon.img;

  const subcontainer = document.createElement("div");

  const name = document.createElement("span");
  name.className = "featured-content-name";
  name.innerText = addon.name;

  const infoContainer = document.createElement("div");
  infoContainer.className = "featured-content-info-container";

  const author = document.createElement("span");
  author.className = "featured-content-author";
  author.innerText = `by ${addon.author}`;

  const tag = document.createElement("span");
  tag.className = "featured-content-tag";
  if (addon.free) {
    tag.innerText = "Free";
    tag.style.backgroundColor = "green";
  } else {
    tag.innerText = "Paid";
    tag.style.backgroundColor = "goldenrod";
  }

  infoContainer.appendChild(author);
  infoContainer.appendChild(tag);

  subcontainer.appendChild(name);
  subcontainer.appendChild(infoContainer);

  a.appendChild(img);
  a.appendChild(subcontainer);

  featuredContentContainer.appendChild(a);
}
