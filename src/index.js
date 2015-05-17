import { mapEvents } from 'sigh-core/lib/stream'
import _ from 'lodash'

function sassCompiler(opts) {
  var sass = require('node-sass')
  var path = require('path')
  var log = require('sigh-core').log
  var _ = require('lodash')

  var includePaths = opts.includePaths || []
  delete opts.includePaths

  return event => {
    // one of the very few times you actually want to use a synchronous call
    var result = sass.renderSync(_.assign({
      data: event.data,
      outFile: 'tmp.css', // needed for correct paths in map.sources
      file: event.path,
      sourceMap: true,
      sourceMapEmbed: false,
      includePaths: includePaths.concat([ path.dirname(event.path) ])
    }, opts))

    var map = JSON.parse(String(result.map))
    map.file = event.path
    map.sourcesContent = map.sources.map(source => {
      // if it is null the `write` plugin will try to resolve it later
      return source === event.path ?  event.data : null
    })

    return {
      data: String(result.css),
      map: JSON.stringify(map)
    }
  }
}

function adaptEvent(compiler) {
  return event => {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    var { fileType } = event
    if (fileType !== 'scss' && fileType !== 'sass')
      return event

    var result = compiler(_.pick(event, 'type', 'data', 'path', 'projectPath'))
    return result.then(result => {
      event.data = result.data

      event.applySourceMap(JSON.parse(result.map))
      event.changeFileSuffix('css')
      return event
    })
  }
}

var pooledProc

export default function(op, opts = {}) {
  if (! pooledProc)
    pooledProc = op.procPool.prepare(sassCompiler, opts, { module })

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
