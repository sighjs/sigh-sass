import { Bacon } from 'sigh-core'
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
      outFile: event.projectPath,
      sourceMap: true,
      sourceMapEmbed: false,
      includePaths: includePaths.concat([ path.dirname(event.path) ])
    }, opts))

    return {
      data: String(result.css),
      map: String(result.map)
    }
  }
}

function adaptEvent(compiler) {
  return event => {
    var result = compiler(_.pick(event, 'type', 'data', 'path', 'projectPath'))
    return result.then(result => {
      event.data = result.data

      var map = JSON.parse(result.map)
      map.sources = [ event.path ]
      map.sourcesContent = [ event.data ]
      event.applySourceMap(map)

      event.changeFileSuffix('css')
      return event
    })
  }
}

export default function(op, opts = {}) {
  return mapEvents(
    op.stream,
    adaptEvent(op.procPool.prepare(sassCompiler, opts, { module }))
  )
}
