const deck = document.getElementById("deck");
const slides = [...document.querySelectorAll(".slide")];
const dotNav = document.getElementById("dotNav");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let activeIndex = 0;

function buildNav() {
  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", slide.dataset.title || `Slide ${index + 1}`);
    button.addEventListener("click", () => goToSlide(index));
    dotNav.appendChild(button);
  });
}

function updateNav(index) {
  activeIndex = index;
  [...dotNav.children].forEach((dot, idx) => {
    dot.classList.toggle("active", idx === index);
  });
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === slides.length - 1;
}

function goToSlide(index) {
  slides[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function detectActiveSlide() {
  const viewportCenter = window.innerHeight / 2;
  let closestIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  updateNav(closestIndex);
}

function handleKeydown(event) {
  if (["ArrowDown", "PageDown", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
    goToSlide(Math.min(activeIndex + 1, slides.length - 1));
  }

  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    goToSlide(Math.max(activeIndex - 1, 0));
  }

  if (event.key === "Home") {
    event.preventDefault();
    goToSlide(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goToSlide(slides.length - 1);
  }
}

buildNav();
updateNav(0);
detectActiveSlide();

deck.addEventListener("scroll", detectActiveSlide, { passive: true });
window.addEventListener("resize", detectActiveSlide);
window.addEventListener("keydown", handleKeydown);
prevBtn.addEventListener("click", () => goToSlide(Math.max(activeIndex - 1, 0)));
nextBtn.addEventListener("click", () => goToSlide(Math.min(activeIndex + 1, slides.length - 1)));
