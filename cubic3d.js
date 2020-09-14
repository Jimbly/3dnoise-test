// 3D Cubic Noise derived from  https://github.com/jobtalle/CubicNoise and https://www.shadertoy.com/view/wsXfDM

function randomize(seed, x, y, z) {
  const RND_A = 134775813;
  const RND_B = 1103515245;
  y += z * 10327;

  return (((((x ^ y) * RND_A) ^ (seed + x)) * (((RND_B * x) << 16) ^ (RND_B * y) - RND_A)) >>> 0) / 4294967295;
}


function interpolate(a, b, c, d, x) {
  const p = (d - c) - (a - b);

  return x * (x * (x * p + ((a - b) - p)) + (c - a)) + b;
}

exports.createCubic3D = function (seed) {
  const xSamples = new Array(4);
  const ySamples = new Array(4);
  return function cubicNoiseSample3(x, y, z) {
    const xi = Math.floor(x);
    const lerpX = x - xi;
    const yi = Math.floor(y);
    const lerpY = y - yi;
    const zi = Math.floor(z);
    const lerpZ = z - zi;
    const x0 = xi - 1;
    const x1 = xi;
    const x2 = xi + 1;
    const x3 = xi + 2;


    for (let ii = 0; ii < 4; ++ii) {
      const zsub = zi - 1 + ii;
      for (let jj = 0; jj < 4; ++jj) {
        const ysub = yi - 1 + jj;
        xSamples[jj] = interpolate(
          randomize(seed, x0, ysub, zsub),
          randomize(seed, x1, ysub, zsub),
          randomize(seed, x2, ysub, zsub),
          randomize(seed, x3, ysub, zsub),
          lerpX) * 0.5 + 0.25;
      }
      ySamples[ii] = interpolate(xSamples[0], xSamples[1], xSamples[2], xSamples[3], lerpY);
    }

    return interpolate(ySamples[0], ySamples[1], ySamples[2], ySamples[3], lerpZ);
  };
};
