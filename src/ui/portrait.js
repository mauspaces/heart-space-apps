/* Crew portrait: square-edged monochrome photo (Figure-style). Falls back to initials when the file is missing.
   AI-generated portraits carry a visible "AI-generated" mark (Space Apps rule). */
export function portrait(m, size = '') {
  const img = m.photo
    ? `<img src="${m.photo}" alt="" decoding="async" onerror="this.parentNode.classList.add('noimg');this.remove()">`
    : '';
  return `<figure class="portrait ${size}${m.photo ? '' : ' noimg'}" aria-hidden="true">
    ${img}<span class="portrait-init">${m.initials}</span>${m.photoAI ? '<span class="ai-mark">AI-generated</span>' : ''}
  </figure>`;
}
