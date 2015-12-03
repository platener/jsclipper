var ClipperLib = require ('./jsclipper')

// == CONVERSION HELPERS FROM Array TO ClipperLib

function arrayToObjectNotation(arrayOfPoints) {
  return arrayOfPoints.map(function(point) {
    return {X: point[0], Y: point[1]}
  })
}

function objectToArrayNotation(arrayOfPoints) {
  return arrayOfPoints.map(function(point) {
    return [point.X, point.Y]
  })
}

function arrayToClipperPaths(arrayOfPaths) {
  return arrayOfPaths.map(arrayToObjectNotation)
}

function clipperPathsToArray(arrayOfPaths) {
  return arrayOfPaths.map(objectToArrayNotation)
}

// == TYPES FOR CUSTOM APPLICATION OF clip ==

var FillType = {
  EVEN_ODD: ClipperLib.PolyFillType.pftEvenOdd,
  NON_ZERO: ClipperLib.PolyFillType.pftNonZero,
  NEGATIVE: ClipperLib.PolyFillType.pftNegative,
  POSITIVE: ClipperLib.PolyFillType.pftPositive
}

var ClipType = {
  INTERSECTION: ClipperLib.ClipType.ctIntersection,
  UNION: ClipperLib.ClipType.ctUnion,
  DIFFERENCE: ClipperLib.ClipType.ctDifference,
  XOR: ClipperLib.ClipType.ctXor
}

// == GENERAL PURPOSE CLIPPING ==

function clip(subj, clips, clipType, scale, fillType) {
  var scale = scale || Math.pow(10, 6)
  var fillType = fillType || FillType.NON_ZERO

  if (!Array.isArray(subj)) {
    throw new Error('Provide subject polygon as an array of paths.')
  }

  if (!Array.isArray(clips)) {
    throw new Error('Provide clip polygons as arrays of paths.')
  }

  if (clips.length == 0) {
    throw new Error('Provide at least one clip.')
  }

  if ('number' != typeof clipType || !(0 <= clipType && clipType < 4)) {
    throw new Error('Provide a valid clip type!')
  }

  var subjPaths = arrayToClipperPaths(subj)
  var clipsPaths = clips.map(arrayToClipperPaths)

  var clipper = new ClipperLib.Clipper()
  ClipperLib.JS.ScaleUpPaths(subjPaths, scale)
  clipper.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, true)
  clipsPaths.forEach(function(clipPaths) {
    ClipperLib.JS.ScaleUpPaths(clipPaths, scale)
    clipper.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true)
  })

  var solution = []
  var succeeded = clipper.Execute(clipType, solution, fillType, fillType)

  if (succeeded) {
    ClipperLib.JS.ScaleUpPaths(solution, 1/scale)
    return clipperPathsToArray(solution)
  }

  // return false when the clipping failed
  return false
}

// == CLIPPING METHODS ==

function intersect(subj, clips) {
  return clip(subj, clips, ClipType.INTERSECTION)
}

function union(subj, clips) {
  return clip(subj, clips, ClipType.UNION)
}

function diff(subj, clips) {
  return clip(subj, clips, ClipType.DIFFERENCE)
}

function xor(subj, clips) {
  return clip(subj, clips, ClipType.XOR)
}

// == POLYGON METHODS ==

function Polygon(shape, holes) {
  if (!Array.isArray(shape)) {
    throw new Error('Given shape should be an array of points [x,y].')
  }

  holes = holes || []
  if (!Array.isArray(holes)) {
    throw new Error('Given holes should be an array of paths.')
  }

  this._paths = [shape].concat(holes)
}

Polygon.prototype.getPaths = function() {
  return this._paths.slice()
}

Polygon.prototype.getShape = function() {
  return this._paths.slice(0,1)
}

Polygon.prototype.getHoles = function() {
  return this._paths.slice(1)
}

Polygon.clip = function(clipPolygon, clipType) {
  var solution = clip(this.getPaths(), clipPolygon.getPaths(), clipType)

  if (solution) {
    return solution.map(function(shape) {
      return new Polygon(shape)
    })
  }

  // return false when clipping failed
  return false
}

// == EXPORTS ==
module.exports = {
  arrayToObjectNotation: arrayToObjectNotation,
  objectToArrayNotation: objectToArrayNotation,
  arrayToClipperPaths: arrayToClipperPaths,
  clipperPathsToArray: clipperPathsToArray,

  FillType: FillType,
  ClipType: ClipType,

  clip: clip,
  intersect: intersect,
  union: union,
  diff: diff,
  xor: xor,

  Polygon: Polygon,

  ClipperLib: ClipperLib
}
