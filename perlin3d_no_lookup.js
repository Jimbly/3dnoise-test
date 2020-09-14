// Based on https://github.com/alterebro/perlin-noise-3d/blob/master/src/index.js
// and https://www.shadertoy.com/view/wsXfDM
// Adapted from http://mrl.nyu.edu/~perlin/noise/
// Adapting from runemadsen/rune.noise.js
// Which was adapted from P5.js
// Which was adapted from PApplet.java
// which was adapted from toxi
// which was adapted from the german demo group farbrausch as used in their demo "art": http://www.farb-rausch.de/fr010src.zip

exports.createPerlin3DDirect = function createPerlin3DDirect(seed) {

  function randomize(x, y, z) {
    const RND_A = 134775813;
    const RND_B = 1103515245;
    y += z * 10327;

    return (((((x ^ y) * RND_A) ^ (seed + x)) * (((RND_B * x) << 16) ^ (RND_B * y) - RND_A)) >>> 0) / 4294967295;
  }

  let SINCOS_PRECISION = 0.5;
  let SINCOS_LENGTH = Math.floor(360 / SINCOS_PRECISION);
  let sinLUT = new Array(SINCOS_LENGTH);
  let cosLUT = new Array(SINCOS_LENGTH);
  let DEG_TO_RAD = Math.PI/180.0;
  for (let i = 0; i < SINCOS_LENGTH; i++) {
    sinLUT[i] = Math.sin(i * DEG_TO_RAD * SINCOS_PRECISION);
    cosLUT[i] = Math.cos(i * DEG_TO_RAD * SINCOS_PRECISION);
  }

  let perlin_PI = SINCOS_LENGTH;
  perlin_PI >>= 1;

  function noise_fsc(i) {
    // using cosine lookup table
    return 0.5*(1.0-cosLUT[Math.floor(i*perlin_PI)%SINCOS_LENGTH]);
  }

  return function get(x,y,z) {
    y = y || 0;
    z = z || 0;

    if (x<0) {
      x=-x;
    }
    if (y<0) {
      y=-y;
    }
    if (z<0) {
      z=-z;
    }

    let xi=Math.floor(x);
    let yi=Math.floor(y);
    let zi=Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf;
    let ryf;

    let n1;
    let n2;
    let n3;

    rxf= noise_fsc(xf);
    ryf= noise_fsc(yf);

    n1 = randomize(xi, yi, zi);
    n1 += rxf*(randomize(xi + 1, yi, zi)-n1);
    n2 = randomize(xi, yi + 1, zi);
    n2 += rxf*(randomize(xi+1, yi + 1, zi)-n2);
    n1 += ryf*(n2-n1);

    zi++;
    n2 = randomize(xi, yi, zi);
    n2 += rxf*(randomize(xi + 1, yi, zi)-n2);
    n3 = randomize(xi, yi + 1, zi);
    n3 += rxf*(randomize(xi + 1, yi + 1, zi)-n3);
    n2 += ryf*(n3-n2);

    n1 += noise_fsc(zf)*(n2-n1);

    return n1;
  };
};
