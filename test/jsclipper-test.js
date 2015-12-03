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

    expect(solution).to.be.not.false
    expect(solution).to.deep.equal([[[-2, -1], [2, -1], [2, 1], [-2, 1]]])
  })
})
