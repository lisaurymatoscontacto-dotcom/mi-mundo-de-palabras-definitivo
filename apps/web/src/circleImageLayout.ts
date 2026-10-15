export function circleImageLayout(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width<=0 || height<=0) {
    width=1; height=1;
  }
  // An inscribed rectangle keeps all four photo corners inside the circle.
  // 92% leaves a small gap between the image and the circular frame.
  const diagonal=Math.hypot(width,height);
  return {width:92*width/diagonal, height:92*height/diagonal};
}
