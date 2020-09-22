const assert = require('assert');
const { createCubic3D } = require('./cubic3d.js');
const fs = require('fs');
const { floor, max, min, sqrt } = Math;
const PerlinNoise3d = require('perlin-noise-3d');
const { createPerlin3DDirect } = require('./perlin3d_no_lookup.js');
const { PNG } = require('pngjs');
const { randFastCreate } = require('./rand_fast.js');
const SimplexNoise = require('simplex-noise');
const { makeNoise3D } = require('open-simplex-noise');

const NUM_POINTS = 1000000;

function warpedGen(gen, scale) {
  return function (x, y, z) {
    return gen(x * scale, y * scale, z * scale);
  };
}


function timeStart(msg) {
  process.stdout.write(`${msg}...`);
  return process.hrtime.bigint();
}
function timeEnd(start) {
  let t = process.hrtime.bigint() - start;
  let ms = Number(t / 1000n) / 1000;
  process.stdout.write(` ${ms.toFixed(1)}ms`);
}

let test_points;
function generatePoints() {
  let start = timeStart('Allocating points');
  let rand = randFastCreate(1234);
  let buf = new ArrayBuffer(NUM_POINTS*3*4);
  test_points = [];
  for (let ii = 0; ii < NUM_POINTS; ++ii) {
    let pt = new Float32Array(buf, ii*3*4, 3);
    test_points.push(pt);
  }
  timeEnd(start);
  start = timeStart('Generating points');
  for (let ii = 0; ii < NUM_POINTS; ++ii) {
    let pt = test_points[ii];
    pt[0] = rand.floatBetween(0, 1000);
    pt[1] = rand.floatBetween(0, 1000);
    pt[2] = rand.floatBetween(0, 1000);
    test_points.push(pt);
  }
  timeEnd(start);
}
generatePoints();

let planes = [
  {
    p0: new Float32Array([12, 34, 56]),
    tan: new Float32Array([1,0,0]),
    bitan: new Float32Array([0,2/sqrt(5),1/sqrt(5)]),
    size: 10,
  },
  {
    p0: new Float32Array([0,0,0]),
    tan: new Float32Array([1,0,0]),
    bitan: new Float32Array([0,1,0]),
    size: 64,
  },
  {
    p0: new Float32Array([0,0,0]),
    tan: new Float32Array([0,0,1]),
    bitan: new Float32Array([0,1,0]),
    size: 64,
  },
  {
    p0: new Float32Array([65, 41, 32]),
    tan: new Float32Array([1/sqrt(2),1/sqrt(2),0]),
    bitan: new Float32Array([-1/sqrt(3),1/sqrt(3),1/sqrt(3)]),
    size: 10,
  },
];

function map(v) {
  return max(0, min(255, floor(v * 255)));
}

function testNoiseGenerator(name, gen, mul, add) {
  let start = timeStart(name);
  // Time it
  let r = 0;
  for (let ii = 0; ii < NUM_POINTS; ++ii) {
    let pt = test_points[ii];
    let v = gen(pt[0], pt[1], pt[2]) * mul + add;
    r += v;
  }
  // console.log(`${name} range=${minv} - ${maxv}`);
  timeEnd(start);

  // Gather statistics
  let minv = Infinity;
  let maxv = -Infinity;
  let histo1 = new Uint32Array(256);
  for (let ii = 0; ii < NUM_POINTS; ++ii) {
    let pt = test_points[ii];
    let v = gen(pt[0], pt[1], pt[2]) * mul + add;
    minv = min(minv, v);
    maxv = max(maxv, v);
    v = map(v);
    histo1[v]++;
  }
  console.log(`  ${minv.toFixed(3)}-${maxv.toFixed(3)}, avg=${(r/NUM_POINTS).toFixed(3)}`);

  // Generate a test image for verification
  let w = 512;
  let h = 512;
  let stride = w * 3;
  let pt = new Float32Array(3);
  let png = new PNG({ width: stride, height: h*2, colorType: 6 });
  for (let idx=0; idx < png.data.length;) {
    png.data[idx++] = 0;
    png.data[idx++] = 0;
    png.data[idx++] = 0;
    png.data[idx++] = 255;
  }
  let histo2 = new Uint32Array(256);
  for (let ii = 0; ii < planes.length; ++ii) {
    let plane = planes[ii];
    let buf_idx0 = ((ii & 1) * w + (ii & 2)/2 * h * stride) * 4;
    let { p0, tan, bitan, size } = plane;
    for (let yy = 0; yy < h; ++yy) {
      let idx = buf_idx0 + yy*stride*4;
      for (let xx = 0; xx < w; ++xx) {
        pt[0] = p0[0] + tan[0] * xx/w*size + bitan[0] * yy/w*size;
        pt[1] = p0[1] + tan[1] * xx/w*size + bitan[1] * yy/w*size;
        pt[2] = p0[2] + tan[2] * xx/w*size + bitan[2] * yy/w*size;
        let v = map(gen(pt[0], pt[1], pt[2]) * mul + add);
        histo2[v]++;
        png.data[idx++] = v;
        png.data[idx++] = v;
        png.data[idx++] = v;
        png.data[idx++] = 255;
      }
    }
  }
  function graphHisto(histo, x, y) {
    let mx = 0;
    for (let ii = 0; ii < histo.length; ++ii) {
      mx = max(mx, histo[ii]);
    }
    assert(mx);
    for (let ii = 0; ii < histo.length; ++ii) {
      let v = histo[ii] / mx * h;
      for (let jj = 0; jj < v; ++jj) {
        let idx = (x + ii + (y + h - jj - 1) * stride) * 4;
        png.data[idx++] = 255;
        png.data[idx++] = 255;
        png.data[idx++] = 255;
        png.data[idx++] = 255;
      }
    }
    let mididx = (x + histo.length / 2 + y * stride) * 4;
    for (let ii = 0; ii < h; ii += 4) {
      png.data[mididx + ii * stride * 4] = 255;
      png.data[mididx + ii * stride * 4 + 1] = 0;
    }
  }
  graphHisto(histo2, w * 2, 0);
  graphHisto(histo1, w * 2, h);
  let buffer = PNG.sync.write(png);
  fs.writeFileSync(`output/${name}.png`, buffer);
  return r;
}

function doTests() {
  // 3D covered under patent
  // 256x256x256 of randomness
  let sn = new SimplexNoise('test');
  testNoiseGenerator('simplex-noise-3d', sn.noise3D.bind(sn), 0.5, 0.5);
  testNoiseGenerator('simplex-noise-2d', sn.noise2D.bind(sn), 0.5, 0.5);
  // Not reasonable, only 16x16x16 randomness!
  let pn = new PerlinNoise3d();
  pn.perlin_octaves = 1;
  pn.noiseSeed(12345);
  testNoiseGenerator('perlin-noise-3d', pn.get.bind(pn), 2, 0);
  // Pretty reasonable, but heavy directional artifacts
  // Never repeats
  let pnnl = createPerlin3DDirect(12345);
  testNoiseGenerator('perlin3d-no-lookup', pnnl, 1, 0);
  // Looks good
  // 256x256x256 of randomness
  let os = makeNoise3D(12345);
  testNoiseGenerator('open-simplex-noise-3d', os, 0.5, 0.5);
  //testNoiseGenerator('open-simplex-noise-3d-scaled', os, 0.58, 0.5);
  testNoiseGenerator('open-simplex-noise-3d-scaled-warped', warpedGen(os, 2), 0.58, 0.5);
  // Way too slow, looks similar to open-simplex-noise-3d
  let c3d = createCubic3D(12345);
  testNoiseGenerator('cubic-3d', c3d, 1, 0);
}
doTests();
