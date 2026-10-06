// Remote fashion photography used as a demo-friendly fallback for the catalog.
// These are browser-loadable image URLs; the database can keep its existing
// deterministic SVG references without affecting product data.

export const HERO_IMAGE =
  "https://images.squarespace-cdn.com/content/v1/6436e68b3e41f224b8b0a966/7b7b69a2-1bf6-48db-8962-61fb2f97214a/ecomm_2500x1600_2.jpg?format=2500w";

const IMG = {
  whiteSneaker: "https://images.unsplash.com/photo-1680204101400-aeac783c9d87?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  blackSneaker: "https://verarus.com/cdn/shop/files/250728_2032.jpg?v=1775402107&width=1600",
  running: "https://images.unsplash.com/photo-1637437757614-6491c8e915b5?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  loafers: "https://images.unsplash.com/photo-1616406432452-07bc5938759d?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  sandal: "https://us.frankie4.com/cdn/shop/files/Thompson_Camel_Still-life.jpg?v=1740373569&width=1000",
  whiteTee: "https://images.unsplash.com/photo-1551773140-17b51547e825?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  blueTee: "https://originalfavorites.com/cdn/shop/products/FrenchBlueT-ShirtFrontShopify.jpg?v=1664907557",
  whiteShirt: "https://hoopstudios.com/cdn/shop/files/8C6A8370.jpg?v=1750831598&width=1200",
  stripedShirt: "https://i.vimeocdn.com/video/1653324161-2d02a4d159f25c07e78db5783a6b8e329cbe423006f880bc7168f79d3fc452c3-d?f=webp",
  jeans: "https://images.unsplash.com/photo-1714143164072-7646ef5cb24d?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  pants: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/26586f141980207.625e9829deaff.jpg",
  jacketDirect: "https://cdn.prod.website-files.com/5e73b00410e4b42fae046074/6569c02571761a4e95455a67_LRP-About-Hero-5.webp",
  hoodie: "https://premiumproductphotos.com/wp-content/uploads/2023/07/turquoise-hoodie-toronto-product-photography-1.webp",
  dress: "https://images.unsplash.com/photo-1638297372163-5632d2a3402b?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  dressModel: "https://cloudfront-eu-central-1.images.arcpublishing.com/lexpress/U2USSEWJQJC73BW6F6BGV4BVZ4.jpg",
  kurta: "https://images.unsplash.com/photo-1739773375277-a801e4711008?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  saree: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  watch: "https://images.unsplash.com/photo-1734776582425-763a7bfc3be9?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  sunglasses: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/3f0cb3185583641.6566561df3827.jpg",
  earrings: "https://images.unsplash.com/photo-1708222171064-15cbb2bb1744?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&fm=jpg&q=80&w=1200",
  handbag: "https://www.omarobaid.me/uploads/images/L0eNrbGPgi8mtfdiAECeHG9JgEJadaGC3xvVFVL5.jpg",
};

const POOLS = {
  shoes: [IMG.whiteSneaker, IMG.blackSneaker, IMG.running, IMG.loafers],
  tshirts: [IMG.whiteTee, IMG.blueTee, IMG.whiteTee, IMG.blueTee],
  shirts: [IMG.whiteShirt, IMG.stripedShirt, IMG.whiteShirt, IMG.stripedShirt],
  jeans: [IMG.jeans, IMG.jeans, IMG.jeans, IMG.jeans],
  trousers: [IMG.pants, IMG.pants, IMG.pants, IMG.pants],
  jackets: [IMG.jacketDirect, IMG.jacketDirect, IMG.jacketDirect, IMG.jacketDirect],
  hoodies: [IMG.hoodie, IMG.hoodie, IMG.hoodie, IMG.hoodie],
  dresses: [IMG.dress, IMG.dressModel, IMG.dress, IMG.dressModel],
  ethnic: [IMG.kurta, IMG.saree, IMG.kurta, IMG.saree],
  accessories: [IMG.watch, IMG.sunglasses, IMG.earrings, IMG.watch],
  bags: [IMG.backpack, IMG.handbag, IMG.backpack, IMG.handbag],
  default: [IMG.whiteTee, IMG.whiteShirt, IMG.jeans, IMG.backpack],
};

const normalize = (value) => String(value || "").toLowerCase();

function poolFor(product = {}) {
  const text = normalize(`${product.name} ${product.category_slug || product.category || ""} ${product.outfit_role || ""}`);
  if (/sneaker|shoe|loafer|oxford|jutt|mojari|heel|flat|sandal|running/.test(text)) return POOLS.shoes;
  if (/watch|belt|sunglass|earring|jhumka|necklace|stole|accessor/.test(text)) return POOLS.accessories;
  if (/backpack|duffle|tote|crossbody|bag/.test(text)) return POOLS.bags;
  if (/saree/.test(text)) return [IMG.saree, IMG.saree, IMG.saree, IMG.saree];
  if (/kurta|churidar|anarkali|ethnic/.test(text)) return POOLS.ethnic;
  if (/dress/.test(text)) return POOLS.dresses;
  if (/hoodie/.test(text)) return POOLS.hoodies;
  if (/jacket|trench/.test(text)) return POOLS.jackets;
  if (/jeans/.test(text)) return POOLS.jeans;
  if (/trouser|chino|jogger|pants|legging|track/.test(text)) return POOLS.trousers;
  if (/shirt/.test(text)) return POOLS.shirts;
  if (/tee|t-shirt|top|blouse|tank/.test(text)) return POOLS.tshirts;
  return POOLS.default;
}

function exact(product) {
  const name = normalize(product?.name);
  if (name === "white court sneakers") return IMG.whiteSneaker;
  if (name === "white essential crew tee") return IMG.whiteTee;
  if (name === "everyday cotton tee") return IMG.blueTee;
  if (name === "everyday laptop backpack") return IMG.backpack;
  return null;
}

export function resolveProductImage(product = {}, index = 0) {
  const exactImage = exact(product);
  if (exactImage) return exactImage;
  const pool = poolFor(product);
  const color = normalize(product.primary_color || product.selected_color || "");

  // Prefer a colour-appropriate image for common catalogue colours.
  if (pool === POOLS.shoes) {
    if (color.includes("white")) return IMG.whiteSneaker;
    if (color.includes("black")) return IMG.blackSneaker;
    if (color.includes("brown") || color.includes("beige")) return IMG.loafers;
    if (color.includes("blue") || color.includes("navy")) return IMG.running;
  }
  if (pool === POOLS.tshirts) {
    if (color.includes("white")) return IMG.whiteTee;
    if (color.includes("blue") || color.includes("navy")) return IMG.blueTee;
  }
  return pool[index % pool.length];
}

export function resolveProductGallery(product = {}) {
  const pool = poolFor(product);
  return [0, 1, 2, 3].map((i) => resolveProductImage({ ...product, primary_color: "" }, i));
}

export function resolveVariantImage(product = {}, color = "") {
  return resolveProductImage({ ...product, selected_color: color }, 0);
}
