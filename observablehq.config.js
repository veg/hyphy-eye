// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "hyphy-eye",

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  pages: [
    {
      name: "Components",
      open: true,
      pages: [
        {name: "Bipartite Network", path: "/pages/busted-network"},
        {name: "Color Maps", path: "/pages/color-maps-demo"},
        {name: "Tile Table", path: "pages/tile-table-demo"}
      ]
    },
    {
      name: "Usage",
      open: true,
      pages: [
        {name: "Datamonkey Usage", path: "pages/datamonkey-usage"}
      ]
    }
  ]

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
