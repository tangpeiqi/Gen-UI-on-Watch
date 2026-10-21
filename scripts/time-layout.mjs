// Time proposals allocate space; final containers describe visible text bounds.
// Node has no font engine. The browser supplies actual glyph metrics at render time.
export function measureTimeText(value, style) {
  const size = style.fontSize;
  const stroke = style.treatment === "outline_stroke" ? 1.5 : 0;
  return {
    width: String(value).length * size * 0.58 + Math.max(0, String(value).length - 1) * (style.letterSpacing || 0) + stroke,
    height: size * 0.74 + stroke
  };
}

export function timeMaskInset(distance) {
  return distance >= 54 ? 0 : 54 - Math.sqrt(Math.max(0, 54 ** 2 - (54 - distance) ** 2));
}

export function timeFrameInsideMask(frame, tolerance = 0.1) {
  const inset = timeMaskInset(Math.min(frame.y, 251 - frame.y - frame.height));
  return frame.y >= -tolerance && frame.y + frame.height <= 251 + tolerance && frame.x >= inset - tolerance && frame.x + frame.width <= 205 - inset + tolerance;
}

export function fitTimeLayout(layout, measure = measureTimeText) {
  // Resolve dependencies between adjacent time parts until their shared boundary
  // settles. This also makes a second render use the same allocation.
  for (let pass = 0; pass < 16; pass++) {
    const before = JSON.stringify(layout.time);
    fitTimeLayoutPass(layout, measure);
    if (JSON.stringify(layout.time) === before) break;
  }
  return layout;
}

function fitTimeLayoutPass(layout, measure) {
  if (layout.widgets?.some(widget => widget.template === "checklist_full_face")) return layout;
  const containers = layout.time?.containers;
  if (!containers?.length || !layout.date?.frame) return layout;
  const originals = containers.map(container => ({ ...container.frame }));
  const targetIndex = containers.findIndex(container => container.id === layout.date.stackedWithTimeContainerId);
  const targetFrame = originals[targetIndex];
  const dateAbove = targetFrame && layout.date.frame.y < targetFrame.y;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  containers.forEach((container, index) => {
    const region = originals[index];
    if (!region || !container.style || !Number.isFinite(region.width + region.height)) return;
    // Widget geometry determines the free band around the proposed time part.
    // The proposal chooses the band/anchor, not a fixed text size.
    const anchor = String(container.anchor || "center");
    let left = 0, right = 205, top = 0, bottom = 251;
    const overlap = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const dateHeight = index === targetIndex ? layout.date.frame.height : 0;
    if (dateAbove) top += dateHeight;
    else bottom -= dateHeight;
    for (const widget of layout.widgets || []) {
      const frame = widget.frame;
      if (!frame) continue;
      const verticalOverlap = Math.min(region.y + region.height, frame.y + frame.height) - Math.max(region.y, frame.y);
      if (verticalOverlap > 10) {
        if (frame.x + frame.width <= region.x + 10) left = Math.max(left, frame.x + frame.width - 10);
        else if (frame.x >= region.x + region.width - 10) right = Math.min(right, frame.x + 10);
      }
      if (overlap(region, frame) > 10) {
        if (frame.y + frame.height / 2 < region.y + region.height / 2) top = Math.max(top, frame.y + frame.height - 10);
        else bottom = Math.min(bottom, frame.y + 10);
      }
      if (dateHeight && overlap(layout.date.frame, frame) > 0) {
        if (dateAbove && frame.y + frame.height <= region.y + 10) top = Math.max(top, frame.y + frame.height + dateHeight);
        if (!dateAbove && frame.y >= region.y + region.height - 10) bottom = Math.min(bottom, frame.y - dateHeight);
      }
    }
    // Adjacent split/segmented parts reserve their own region.
    originals.forEach((frame, other) => {
      if (other === index) return;
      if (Math.min(region.y + region.height, frame.y + frame.height) > Math.max(region.y, frame.y)) {
        if (frame.x + frame.width <= region.x) left = Math.max(left, frame.x + frame.width);
        if (frame.x >= region.x + region.width) right = Math.min(right, frame.x);
      } else if (overlap(region, frame) > 0) {
        if (other < index) top = Math.max(top, containers[other].frame.y + containers[other].frame.height);
        else bottom = Math.min(bottom, frame.y);
      }
    });
    if (right <= left || bottom <= top) return;
    // A rounded mask reduces usable width near its top and bottom. Fit the
    // visible bounding box wholly inside it rather than allowing clipped digits.
    const inset = timeMaskInset;
    const place = bounds => {
      const padding = bounds.width < 105 ? 16 : 0;
      let x = clamp(region.x + (region.width - bounds.width) / 2, left, right - bounds.width);
      if (anchor.includes("left")) x = Math.max(left, padding);
      if (anchor.includes("right")) x = Math.min(right, 205 - padding) - bounds.width;
      if (["top", "bottom", "center"].includes(anchor) || (layout.time.mode === "single_line" && anchor.includes("_"))) x = (205 - bounds.width) / 2;
      // Move edge-anchored text inward only as far as the rounded mask needs.
      const horizontalDistance = Math.min(x, 205 - x - bounds.width);
      const verticalInset = inset(horizontalDistance);
      const minY = Math.max(top, anchor.includes("top") ? padding : 0, verticalInset);
      const maxY = Math.min(bottom, anchor.includes("bottom") ? 251 - padding : 251, 251 - verticalInset) - bounds.height;
      let y = clamp(region.y, minY, maxY);
      if (anchor.includes("top")) y = minY;
      else if (anchor.includes("bottom")) y = maxY;
      else if (anchor === "center") y = (251 - bounds.height) / 2;
      else if (index < containers.length - 1) y = maxY;
      const horizontalInset = inset(Math.min(y, 251 - y - bounds.height));
      if (anchor.includes("left") && layout.time.mode !== "single_line") x = Math.max(x, horizontalInset);
      if (anchor.includes("right") && layout.time.mode !== "single_line") x = Math.min(x, 205 - horizontalInset - bounds.width);
      return { x, y, width: bounds.width, height: bounds.height, minY, maxY };
    };
    const fits = bounds => {
      const frame = place(bounds);
      if (frame.minY > frame.maxY || frame.x < left || frame.x + frame.width > right || frame.y < top || frame.y + frame.height > bottom) return false;
      const insetX = inset(Math.min(frame.y, 251 - frame.y - frame.height));
      if (frame.x < insetX - 0.001 || frame.x + frame.width > 205 - insetX + 0.001) return false;
      const dateFrame = dateHeight ? { ...layout.date.frame, y: dateAbove ? frame.y - dateHeight : frame.y + frame.height } : null;
      return (layout.widgets || []).every(widget => {
        const obstacle = widget.frame;
        if (!obstacle) return true;
        const width = overlap(frame, obstacle);
        const height = Math.min(frame.y + frame.height, obstacle.y + obstacle.height) - Math.max(frame.y, obstacle.y);
        if (width > 10 && height > 10) return false;
        return !dateFrame || overlap(dateFrame, obstacle) <= 0 || Math.min(dateFrame.y + dateFrame.height, obstacle.y + obstacle.height) <= Math.max(dateFrame.y, obstacle.y);
      });
    };
    let low = 0.1, high = 512;
    for (let iteration = 0; iteration < 24; iteration++) {
      const fontSize = (low + high) / 2;
      const bounds = measure(container.value, { ...container.style, fontSize });
      if (fits(bounds)) low = fontSize;
      else high = fontSize;
    }
    container.style.fontSize = Math.floor(low * 100) / 100;
    const bounds = measure(container.value, container.style);
    const { x, y } = place(bounds);
    // Tight glyph bounds can be narrower than the old corner-box threshold.
    // Retain the horizontal edge and turn that proposal into a side anchor.
    if (layout.time.mode !== "single_line" && anchor.includes("_") && bounds.width <= 105) {
      container.anchor = anchor.includes("right") ? "right" : "left";
    }
    container.frame = { x, y, width: bounds.width, height: bounds.height };
  });
  if (targetIndex >= 0) {
    const target = containers[targetIndex].frame;
    layout.date.frame.y = dateAbove ? target.y - layout.date.frame.height : target.y + target.height;
    layout.date.frame.x = clamp(layout.date.frame.x, Math.max(0, target.x - layout.date.frame.width + 1), Math.min(205 - layout.date.frame.width, target.x + target.width - 1));
  }
  const x = Math.min(...containers.map(container => container.frame.x));
  const y = Math.min(...containers.map(container => container.frame.y));
  layout.time.frame = {
    x, y,
    width: Math.max(...containers.map(container => container.frame.x + container.frame.width)) - x,
    height: Math.max(...containers.map(container => container.frame.y + container.frame.height)) - y
  };
  layout.time.style = { ...containers[0].style };
  return layout;
}
