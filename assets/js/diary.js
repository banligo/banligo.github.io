(() => {
  const content = document.querySelector('.diary-content');
  const toc = document.querySelector('.diary-toc');
  if (!content || !toc) return;
  const headings = content.querySelectorAll('h1, h2, h3, h4');
  if (headings.length < 2) return;
  const list = toc.querySelector('ol');
  headings.forEach((heading, index) => {
    if (!heading.id) {
      let id = `diary-heading-${index + 1}`;
      while (document.getElementById(id)) id += '-section';
      heading.id = id;
    }
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  });
  toc.hidden = false;
})();
