import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import ProcessPool from 'process-pool'
import Event from 'sigh/lib/Event'
import { positionOf } from 'sigh-core/lib/sourceMap'
import { SourceMapConsumer } from 'source-map'

import sass from '../'

require('source-map-support').install()
require('chai').should()

describe('sigh-sass', () => {
  var procPool
  beforeEach(() => { procPool = new ProcessPool })
  afterEach(() => { procPool.destroy() })

  it('should compile a single sass file', function() {
    var data = 'p { &.class { text-width: 1px } }'
    var event = new Event({
      basePath: 'root',
      path: 'root/subdir/file.scss',
      type: 'add',
      data
    })
    var stream = Bacon.constant([ event ])
    return sass({ stream, procPool }).toPromise(Promise).then(events => {
      event.data.should.equal('p.class {\n  text-width: 1px; }')

      var origPos = positionOf(data, '1px')
      origPos.should.eql({ line: 1, column: 26 })

      var transformedPos = positionOf(event.data, '1px')
      transformedPos.should.eql({ line: 2, column: 14 })

      var consumer = new SourceMapConsumer(event.sourceMap)
      var mappedPos = consumer.originalPositionFor(transformedPos)
      mappedPos.line.should.equal(origPos.line)
      mappedPos.column.should.equal(origPos.column)
    })
  })

  xit('should pass sass errors down stream as error events', () => {
  })
})
