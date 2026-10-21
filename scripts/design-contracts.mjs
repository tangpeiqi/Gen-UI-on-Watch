// Project only generation-relevant text bounds from the renderer's visual tokens.
export function circularGenerationTokens(visualSpecs) {
  const close = visualSpecs.components.close_gauge.exactVisualTokens.sizes;
  const open = visualSpecs.components.open_gauge.exactVisualTokens.sizes;
  const textToken = (text) => ({ fontSize: text.fontSize, width: text.box.width });
  return Object.fromEntries(Object.keys(close).map((size) => [size, {
    frame: { width: close[size].diameter, height: close[size].diameter },
    openCenter: textToken(open[size].text.current),
    openBottom: textToken(open[size].text.reference),
    closeCenter: textToken(close[size].text.value),
    closeFootnote: textToken(close[size].text.footnote)
  }]));
}
