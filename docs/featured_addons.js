const FEATURED_ADDONS = [
  {
    name: "Advanced Storage Network",
    author: "Fluffyalien",
    img: "https://media.forgecdn.net/avatars/thumbnails/1029/217/64/64/638551137696436806.png",
    url: "https://www.curseforge.com/minecraft-bedrock/addons/advanced-storage-network-2",
  },
  {
    name: "Bedrock Energistics",
    author: "Fluffyalien",
    img: "https://media.forgecdn.net/avatars/thumbnails/1029/245/64/64/638551161203413381.png",
    url: "https://www.curseforge.com/minecraft-bedrock/addons/bedrock-energistics",
  },
  {
    name: "Not Enough Teleporters",
    author: "Diamond Ruler",
    img: "https://media.forgecdn.net/avatars/thumbnails/907/720/64/64/638359197856483557.png",
    url: "https://www.curseforge.com/minecraft-bedrock/addons/not-enough-teleporters",
  },
];

const container = document.getElementById("featured-addons-container");
const shuffledFeaturedAddons = FEATURED_ADDONS.sort(() => Math.random() - 0.5);

for (const addon of shuffledFeaturedAddons) {
  const a = document.createElement("a");
  a.className = "featured-addon";
  a.href = addon.url;
  a.target = "_blank";

  const img = document.createElement("img");
  img.className = "featured-addon-img";
  img.src = addon.img;

  const textContainer = document.createElement("div");

  const name = document.createElement("span");
  name.className = "featured-addon-name";
  name.innerText = addon.name;

  const author = document.createElement("span");
  author.className = "featured-addon-author";
  author.innerText = `by ${addon.author}`;

  textContainer.appendChild(name);
  textContainer.appendChild(author);

  a.appendChild(img);
  a.appendChild(textContainer);

  container.appendChild(a);
}
