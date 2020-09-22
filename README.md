3D Noise Tests
==============

Results
* Timing and bottom histogram is for sampling 1 million completely random points
* 4 images and top histogram are looking at 4 fixed planar slices (2 axis-aligned, 2 not)

* simplex-noise-2d: 99.4ms
  * output: not valid, just for comparison
![simplex-noise-2d](output/simplex-noise-2d.png)
* perlin-noise-3d: 105.1ms
  * 4096 noise values, repeats at 16x16x16
  * output: strong artifacts
![perlin-noise-3d](output/perlin-noise-3d.png)
* perlin3d-no-lookup: 139.3ms
  * no repetition or precalculation
  * output: strong artifacts
![perlin3d-no-lookup](output/perlin3d-no-lookup.png)
* simplex-noise-3d: 125.2ms
  * patented
  * 512 noise values, repeats at 256x256x256
  * output: good
![simplex-noise-3d](output/simplex-noise-3d.png)
* open-simplex-noise-3d: 148.4ms
  * 256 noise values, repeats at 256x256x256
  * output: pretty good, slightly weird distirubtion
![open-simplex-noise-3d](output/open-simplex-noise-3d.png)
* open-simplex-noise-3d scaled by 16%, zoomed by 2x
  * similar distribution and contour rate as `simplex-noise-3d`
![open-simplex-noise-3d-sacled-warped](output/open-simplex-noise-3d-scaled-warped.png)
* cubic-3d: 676.7ms
  * super slow
  * no repetition
  * output: good
![cubic-3d](output/cubic-3d.png)
