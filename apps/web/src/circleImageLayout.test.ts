import {describe,expect,it} from 'vitest';
import {circleImageLayout} from './circleImageLayout';
describe('complete images inside circular frames',()=>{
  it.each([[960,640],[640,960],[800,800],[1600,300],[300,1600]])('keeps every corner inside the circle for %ix%i',(w,h)=>{
    const box=circleImageLayout(w,h);
    expect(Math.hypot(box.width/2,box.height/2)).toBeLessThan(50);
    expect(box.width/box.height).toBeCloseTo(w/h,8);
    expect(Math.max(box.width,box.height)).toBeLessThan(100);
  });
  it('uses a safe square before dimensions are known',()=>{
    for(const [w,h] of [[0,0],[NaN,2],[Infinity,2],[-1,2]]) {
      const box=circleImageLayout(w,h);
      expect(Number.isFinite(box.width)).toBe(true);
      expect(Math.hypot(box.width/2,box.height/2)).toBeLessThan(50);
    }
  });
});
