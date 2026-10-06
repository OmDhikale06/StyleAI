# StyleAI Demo Image Sources

The current demo uses browser-loadable remote fashion photography URLs so the catalog is no longer dependent on the SVG placeholder artwork that shipped with the project.

The frontend image resolver is in `frontend/src/utils/imageResolver.js`. Product data, database schema, authentication, cart, wishlist, orders and recommendation logic are unchanged.

Representative sources include:
- Unsplash photography for sneakers, T-shirts, jeans, backpacks, watches, jewelry and Indian fashion.
- Product-photography/CDN sources for additional shoes, shirts, jackets, bags and accessories.

These images require an internet connection in the browser. If this project is later deployed, the recommended production hardening step is to download/licence the chosen assets and serve them locally from `frontend/public/images/` or a dedicated CDN.
