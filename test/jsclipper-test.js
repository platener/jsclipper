var chai = require('chai')
var expect = chai.expect
var ClipperLib = require('../jsclipper')
var Clipper = require('../jsclipper-adapter')

// == Here we simply test some edge cases that failed in our GreinerHormann implementation ==
describe('Clipping Tests', function() {
  it('should union correctly', function() {
    // polies and scale 'em
    var scale = Math.pow(10, 6)
    var subj = Clipper.arrayToClipperPaths([[[-2, -1], [1, -1], [1, 1], [-2, 1]]])
    var clip = Clipper.arrayToClipperPaths([[[-1, -1], [2, -1], [2, 1], [-1, 1]]])

    ClipperLib.JS.ScaleUpPaths(subj, scale)
    ClipperLib.JS.ScaleUpPaths(clip, scale)

    var clipper = new ClipperLib.Clipper()
    var clipType = ClipperLib.ClipType.ctUnion
    var fillType = ClipperLib.PolyFillType.pftNonZero

    clipper.AddPaths(subj, ClipperLib.PolyType.ptSubject, true)
    clipper.AddPaths(clip, ClipperLib.PolyType.ptClip, true)

    var solution = []
    var succeeded = clipper.Execute(clipType, solution, fillType, fillType)

    expect(succeeded).to.be.true
    expect(solution).to.be.not.empty

    // scale down again
    ClipperLib.JS.ScaleUpPaths(solution, 1/scale)

    // convert back to original notation
    var s = Clipper.clipperPathsToArray(solution)
    expect(s).to.deep.equal([[[-2, -1], [2, -1], [2, 1], [-2, 1]]])
  })

  it('should union aligned squares', function() {
    // polies and scale 'em
    var scale = Math.pow(10, 3)
    var subj = Clipper.arrayToClipperPaths([[[0, 0], [5, 0], [5,5], [0,5]]])
    var clip = Clipper.arrayToClipperPaths([[[5,0], [10,0], [10,5], [5, 5]]])

    ClipperLib.JS.ScaleUpPaths(subj, scale)
    ClipperLib.JS.ScaleUpPaths(clip, scale)

    var clipper = new ClipperLib.Clipper()
    var clipType = ClipperLib.ClipType.ctUnion
    var fillType = ClipperLib.PolyFillType.pftNonZero

    clipper.AddPaths(subj, ClipperLib.PolyType.ptSubject, true)
    clipper.AddPaths(clip, ClipperLib.PolyType.ptClip, true)

    var solution = []
    var succeeded = clipper.Execute(clipType, solution, fillType, fillType)

    expect(succeeded).to.be.true
    expect(solution.length).to.equal(1)
  })

  it('should union aligned squares with adapter notation', function() {
    var subj = new Clipper.Polygon([[0, 0], [5, 0], [5,5], [0,5]])
    var clip = new Clipper.Polygon([[5,0], [10,0], [10,5], [5, 5]])

    var solution = subj.union(clip)
    expect(solution.length).to.equal(1)
  })

  it('should diff correctly', function() {
    // polies and scale 'em
    var scale = Math.pow(10, 6)
    var subj = Clipper.arrayToClipperPaths([[[-2, -1], [1, -1], [1, 1], [-2, 1]]])

    ClipperLib.JS.ScaleUpPaths(subj, scale)

    var clipper = new ClipperLib.Clipper()
    var clipType = ClipperLib.ClipType.ctDifference
    var fillType = ClipperLib.PolyFillType.pftNonZero

    clipper.AddPaths(subj, ClipperLib.PolyType.ptSubject, true)
    clipper.AddPaths(subj, ClipperLib.PolyType.ptClip, true)

    var solution = []
    var succeeded = clipper.Execute(clipType, solution, fillType, fillType)

    expect(succeeded).to.be.true
    expect(solution).to.be.empty

    // scale down again
    ClipperLib.JS.ScaleUpPaths(solution, 1/scale)

    // convert back to original notation
    var s = Clipper.clipperPathsToArray(solution)
    expect(s).to.be.empty
  })

  it('should union correctly using new interface', function() {
    var subj = [[[-2, -1], [1, -1], [1, 1], [-2, 1]]]
    var clip = [[[-1, -1], [2, -1], [2, 1], [-1, 1]]]
    var clips = [clip]
    var solution = Clipper.union(subj, clips)

    expect(solution).to.deep.equal([[[-2, -1], [2, -1], [2, 1], [-2, 1]]])
  })

  it('should diff a hole into subject', function() {
    var subj = [[[0,0], [2,0], [2,2], [0,2]]]
    var clip = [[[0.5,0.5], [1.5,0.5], [1.5,1.5], [0.5, 1.5]]]
    var clips = [clip]
    var solution = Clipper.diff(subj, clips)

    expect(solution).to.deep.equal([
      [[2, 2], [0, 2], [0, 0], [2, 0]],
      [[0.5, 0.5], [0.5, 1.5], [1.5, 1.5], [1.5, 0.5]]
    ])
  })

  it('should diff subject into two shapes', function() {
    var subj = [[ [0,0], [4,0], [4,2], [0,2] ]]
    var clip = [[ [2,-1], [3,-1], [3,3], [2,3] ]]
    var clips = [clip]
    var solution = Clipper.diff(subj, clips)

    expect(solution).to.deep.equal([
      [[2, 2], [0, 2], [0, 0], [2, 0]],
      [[4, 2], [3, 2], [3, 0], [4, 0]]
    ])
  })

  it('should diff a hole and two shapes into subject', function() {
    var subj = [
      [ [0,0], [4,0], [4,2], [0,2] ],
      [ [0.5,0.5], [1.5,0.5], [1.5,1.5], [0.5, 1.5] ].reverse()
    ]

    var clip = [[[2,-1], [3,-1], [3,3], [2,3]]]
    var clips = [clip]
    var solution = Clipper.diff(subj, clips)

    expect(solution).to.deep.equal([ [ [ 2, 2 ], [ 0, 2 ], [ 0, 0 ], [ 2, 0 ] ],
  [ [ 4, 2 ], [ 3, 2 ], [ 3, 0 ], [ 4, 0 ] ],
  [ [ 0.5, 0.5 ], [ 0.5, 1.5 ], [ 1.5, 1.5 ], [ 1.5, 0.5 ] ] ])
  })

  it('should diff a hole and two shapes into subject using Polygon objects', function() {
    var subj = new Clipper.Polygon(
      [[0,0], [4,0], [4,2], [0,2]],
      [[[0.5,0.5], [1.5,0.5], [1.5,1.5], [0.5, 1.5]]]
    )
    var clip = new Clipper.Polygon([[2,-1], [3,-1], [3,3], [2,3]])
    var solution = subj.diff(clip)

    expect(solution.length).to.equal(2)
    expect(solution[0]._paths).to.deep.equal([ [ [ 2, 2 ], [ 0, 2 ], [ 0, 0 ], [ 2, 0 ] ],
  [ [ 0.5, 0.5 ], [ 0.5, 1.5 ], [ 1.5, 1.5 ], [ 1.5, 0.5 ] ] ])
    expect(solution[1]._paths).to.deep.equal([ [ [ 4, 2 ], [ 3, 2 ], [ 3, 0 ], [ 4, 0 ] ] ])
  })

  // see here: https://sourceforge.net/p/polyclipping/discussion/1148419/thread/925b8c2e/
  // it('should diff multiple holes into subject', function() {
  //   var subj = new Clipper.Polygon([[0,0], [4,0], [4,2], [0,2]])
  //   var clip1 = new Clipper.Polygon([[2,0], [3,0], [3,2], [2,2]])
  //   var clip2 = new Clipper.Polygon([[1,0], [1.5,0], [1.5,2], [1,2]])
  //   var clips = [clip1, clip2]
  //   var solution = subj.diffMultiple(clips)
  //   expect(solution.length).to.equal(3)
  // })

  // it('should diff a single matching hole into subject', function() {
  //   var subj = new Clipper.Polygon([[0,0], [4,0], [4,2], [0,2]])
  //   var clip1 = new Clipper.Polygon([[2,0], [3,0], [3,2], [2,2]])
  //   var solution = subj.diff(clip1)
  //   expect(solution.length).to.equal(2)
  // })

  it('should union finger joint forms - 1', function() {
    var subj = new Clipper.Polygon([[-5,2], [-10,2], [-10,-3], [-5, -3]])
    var clip = new Clipper.Polygon([[22,-3], [-22,-3], [-22,-47], [22,-47]])
    var solution = subj.union(clip)
    expect(solution.length).to.equal(1)
  })

  it('should union finger joint forms - 2', function() {
    // WHAT THE HECK?! Why do we have to move the clip???
    // see here: https://sourceforge.net/p/polyclipping/discussion/1148419/thread/925b8c2e/
    var clip = new Clipper.Polygon([[-5,2], [-10,2], [-10,-3.001], [-5, -3.001]])
    var subj = new Clipper.Polygon([[22,-3], [-15,-3], [-15,2], [-22,2], [-22,-47], [22,-47]])
    var solution = subj.union(clip)
    expect(solution.length).to.equal(1)
  })

    // https://github.com/platener/GreinerHormann/issues/11#issuecomment-166022296
    // test case for "romka-chev"
  it('should find inner hole', function() {
    var subj = new Clipper.Polygon([[0,0], [0,3], [3,3], [3,0]])
    var clip = new Clipper.Polygon([[1,1], [1,2], [2,2], [2,1]])
    var solution = subj.diff(clip)

    expect(solution.length).to.equal(1)
    expect(solution[0].getShape()).to.deep.equal([[3,3], [0,3], [0,0], [3,0]])
    expect(solution[0].getHoles().length).to.equal(1)
    expect(solution[0].getHoles()[0]).to.deep.equal([[1,1], [1,2], [2,2], [2,1]])
  })

  it('should intersect a open path correctly', function() {
    var subj = new Clipper.Polygon([[1,0], [1,3]], [], Clipper.Closed.FALSE)
    var clip = new Clipper.Polygon([[2,1], [2,2], [0,2], [0,1]])
    var solution = subj.diff(clip)

    expect(solution.length).to.equal(1)
    expect(solution[0].getShape()).to.deep.equal([[1,1], [1,2]])
  })

})
