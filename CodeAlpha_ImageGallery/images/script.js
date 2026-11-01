/* ==========================================================
   Lumen Gallery - script.js
   1. Image data   2. Page elements & state   3. Filters
   4. Gallery      5. Lightbox               6. Start the app
   ========================================================== */
'use strict';

/* ---------- 1. Image data ----------
   Each photo is one object. To use YOUR photos:
   - put the files in the "images" folder
   - set src to "images/your-file.jpg"
   - set category to any word you like (filter buttons are created automatically)
   The sample photos below load from picsum.photos, so you need internet to see them. */
const remote = (seed) => ({
  src: `https://picsum.photos/seed/${seed}/1400/933`,
  thumb: `https://picsum.photos/seed/${seed}/600/450`,
});

const images = [
 { title: 'Mountain', category: 'Nature', src: 'nature/nature-1.jpg' },
{ title: 'Forest', category: 'Nature', src: 'nature/nature-2.jpg' },
{ title: 'River', category: 'Nature', src: 'nature/nature-3.jpg' },
{ title: 'Lake', category: 'Nature', src: 'nature/nature-4.jpg' },
  { title: 'Downtown Lights', category: 'City', src: 'city/city-1.jpg' },
{ title: 'Street Scene', category: 'City', src: 'city/city-2.jpg' },
{ title: 'Harbour Bridge', category: 'City', src: 'city/city-3.jpg' },
{ title: 'Rooftop View', category: 'City', src: 'city/city-4.jpg' },
  { title: 'Modern Building', category: 'Architecture', src: 'architecture/arch-1.jpg' },
{ title: 'Glass Atrium', category: 'Architecture', src: 'architecture/arch-2.jpg' },
{ title: 'Spiral Stairs', category: 'Architecture', src: 'architecture/arch-3.jpg' },
{ title: 'Concrete Lines', category: 'Architecture', src: 'architecture/arch-4.jpg' },
  { title: 'Friends Together', category: 'People', src: 'people/people-1.jpg' },
{ title: 'People Walking', category: 'People', src: 'people/people-2.jpg' },
{ title: 'Reading in Cafe', category: 'People', src: 'people/people-3.jpg' },
{ title: 'Festival Crowd', category: 'People', src: 'people/people-4.jpg' },
];
/* Example of a local photo (copy this style):
   { title: 'My Photo', category: 'Nature', src: 'images/my-photo.jpg' }
   If you leave out "thumb", the full image is used as the thumbnail. */

/* ---------- 2. Page elements & state ---------- */
const filtersEl = document.getElementById('filters');
const galleryEl = document.getElementById('gallery');
const countEl = document.getElementById('result-count');

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbCounter = document.getElementById('lb-counter');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');

let activeCategory = 'All';   // which filter is selected
let visibleImages = [];       // photos currently shown (after filtering)
let currentIndex = 0;         // which visible photo is open in the lightbox
let lastFocused = null;       // element to return focus to when the lightbox closes

/* ---------- 3. Filters ---------- */
function getCategories() {
  // "new Set" removes duplicates, so each category appears once
  return ['All', ...new Set(images.map((img) => img.category))];
}

function countFor(category) {
  return category === 'All'
    ? images.length
    : images.filter((img) => img.category === category).length;
}

function renderFilters() {
  filtersEl.innerHTML = '';

  getCategories().forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-btn';
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(category === activeCategory));

    const label = document.createElement('span');
    label.textContent = category;

    const count = document.createElement('span');
    count.className = 'filter-count';
    count.textContent = countFor(category);

    button.append(label, count);
    filtersEl.appendChild(button);
  });
}

filtersEl.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button || button.dataset.category === activeCategory) return;

  activeCategory = button.dataset.category;

  filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn === button));
  });

  renderGallery();
});

/* ---------- 4. Gallery ---------- */
function renderGallery() {
  visibleImages =
    activeCategory === 'All'
      ? images.slice()
      : images.filter((img) => img.category === activeCategory);

  galleryEl.innerHTML = '';

  visibleImages.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'gallery-item';
    li.style.setProperty('--i', index); // used by CSS for the staggered fade-in

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.index = index;
    card.setAttribute('aria-label', `Open ${item.title}`);

    const img = document.createElement('img');
    img.src = item.thumb || item.src;
    img.alt = item.alt || item.title;
    img.loading = 'lazy';
    img.addEventListener('error', () => li.classList.add('is-broken'));

    const caption = document.createElement('span');
    caption.className = 'card-caption';

    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = item.title;

    const category = document.createElement('span');
    category.className = 'card-category';
    category.textContent = item.category;

    caption.append(title, category);
    card.append(img, caption);
    li.appendChild(card);
    galleryEl.appendChild(li);
  });

  const n = visibleImages.length;
  const noun = n === 1 ? 'photo' : 'photos';
  countEl.textContent =
    activeCategory === 'All' ? `${n} ${noun}` : `${n} ${noun} in ${activeCategory}`;
}

// One click listener on the whole grid ("event delegation")
galleryEl.addEventListener('click', (event) => {
  const card = event.target.closest('.card');
  if (!card) return;
  openLightbox(Number(card.dataset.index), card);
});

/* ---------- 5. Lightbox ---------- */
function showImage(index) {
  const total = visibleImages.length;
  if (total === 0) return;

  // The modulo trick makes navigation loop: last -> first, first -> last
  currentIndex = (index + total) % total;
  const item = visibleImages[currentIndex];

  if (lbImg.getAttribute('src') === item.src) {
    lbImg.classList.remove('is-loading');
  } else {
    lbImg.classList.add('is-loading');
    lbImg.onload = () => lbImg.classList.remove('is-loading');
    lbImg.onerror = () => lbImg.classList.remove('is-loading');
    lbImg.src = item.src;
  }

  lbImg.alt = item.alt || item.title;
  lbTitle.textContent = item.title;
  lbCounter.textContent = `${currentIndex + 1} / ${total}`;

  // Hide arrows if there is nothing to navigate to
  lbPrev.hidden = lbNext.hidden = total < 2;

  // Preload the neighbours so next/prev feels instant
  [currentIndex - 1, currentIndex + 1].forEach((i) => {
    const neighbour = visibleImages[(i + total) % total];
    new Image().src = neighbour.src;
  });
}

function openLightbox(index, trigger) {
  lastFocused = trigger || document.activeElement;
  showImage(index);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  if (lastFocused) lastFocused.focus();
}

function isLightboxOpen() {
  return lightbox.classList.contains('is-open');
}

const showNext = () => showImage(currentIndex + 1);
const showPrev = () => showImage(currentIndex - 1);

lbNext.addEventListener('click', showNext);
lbPrev.addEventListener('click', showPrev);
lbClose.addEventListener('click', closeLightbox);

// Click on the dark background (not the photo or buttons) closes the viewer
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

// Keyboard: Esc closes, arrow keys navigate, Tab stays inside the viewer
document.addEventListener('keydown', (event) => {
  if (!isLightboxOpen()) return;

  if (event.key === 'Escape') {
    closeLightbox();
  } else if (event.key === 'ArrowRight') {
    showNext();
  } else if (event.key === 'ArrowLeft') {
    showPrev();
  } else if (event.key === 'Tab') {
    const focusable = [lbClose, lbPrev, lbNext].filter((el) => !el.hidden);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Touch swipe: swipe left = next, swipe right = previous
let touchStartX = 0;

lightbox.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 50) return; // ignore small movements (taps)
  if (distance < 0) showNext();
  else showPrev();
}, { passive: true });

/* ---------- 6. Start the app ---------- */
renderFilters();
renderGallery();


/* ---------- 7. Spotlight effect ----------
   Moves the amber glow (see .card::before in style.css) to follow the mouse. */
galleryEl.addEventListener('pointermove', (event) => {
  const card = event.target.closest('.card');
  if (!card) return;

  const box = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - box.left}px`);
  card.style.setProperty('--my', `${event.clientY - box.top}px`);
});