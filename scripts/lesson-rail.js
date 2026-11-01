// lesson-rail.js — scroll-tracking "on this page" nav (2026-11-01 article
// revamp). Desktop-only (hidden <1240px via CSS); degrades to plain anchor
// links with no script at all, since every href targets a real section id.
const links = Array.from(document.querySelectorAll("[data-rail]"));

if (links.length > 0 && typeof IntersectionObserver === "function") {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const link = links.find((a) => a.getAttribute("href") === `#${entry.target.id}`);
        if (!link) continue;
        for (const a of links) a.removeAttribute("aria-current");
        link.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  for (const link of links) {
    const target = document.getElementById(link.getAttribute("href")?.slice(1) ?? "");
    if (target) observer.observe(target);
  }

  for (const link of links) {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.getAttribute("href")?.slice(1) ?? "");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
  }
}
