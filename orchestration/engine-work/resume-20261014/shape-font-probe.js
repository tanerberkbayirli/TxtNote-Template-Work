(() => {
  const boxes = [...document.querySelectorAll('[data-native-object="drawing"][data-txt-node-id]')].filter(el => /Sosyal|Çevre/.test(el.textContent));
  return boxes.map(el => {
    const text = [...el.querySelectorAll('span')].find(n => /^Sosyal|^Çevre/.test(n.textContent.trim()) && !n.querySelector('span')) || el;
    const outer = el.parentElement.closest('p');
    const css = getComputedStyle(text), parent = outer && getComputedStyle(outer);
    return { id: el.dataset.txtNodeId, text: el.textContent.slice(0,80), weight:css.fontWeight, italic:css.fontStyle, font:css.fontFamily, size:css.fontSize, anchorWeight:parent?.fontWeight, heightPt:el.getBoundingClientRect().height*72/96 };
  });
})()
