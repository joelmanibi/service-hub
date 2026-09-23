// Boosted ne fournit pas de types pour son bundle JS précompilé (offcanvas,
// menus déroulants...) : déclaration minimale pour permettre son import
// dynamique côté client (voir components/layout/AppLayout.tsx).
declare module "boosted/dist/js/boosted.bundle.min.js";
