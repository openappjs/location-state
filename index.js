var emitter = require('emitter-component')
var Delegator = require('dom-delegator')
var window = require('global/window')

var history = window.history || {}
var location = window.location || {}
var pushState = history.pushState
var hasPushState = !!pushState

var HistoryState = function(options) {
  if (!(this instanceof HistoryState)) {
    return new HistoryState(options)
  }

  var wantsPushState = options && options.pushState
  var wantsHash = options && options.hash

  this.usePushState = (
    wantsPushState ||
    (hasPushState && !wantsHash)
  )

  if (this.usePushState && !hasPushState && !wantsHash) {
    throw new Error(
      'This browser does not support history.pushState.'
    )
  }

  this.delegator = Delegator()
  this.delegator.target = window;

  this.started = false
  this.start = this.start.bind(this)
  this.announce = this.emit.bind(this, 'change')

  this.start()
}

emitter(HistoryState.prototype)

HistoryState.prototype.start = function() {
  if (this.started) {
    return
  }

  this.started = true
  this.announce()

  if (this.usePushState) {
    this.delegator.listenTo('popstate')
    this.delegator.addGlobalEventListener('popstate', this.announce)
  } else {
    this.delegator.listenTo('hashchange')
    this.delegator.addGlobalEventListener('hashchange', this.announce)
  }
}

HistoryState.prototype.stop = function() {
  if (this.usePushState) {
    this.delegator.unlistenTo('popstate')
    this.delegator.removeGlobalEventListener('popstate', this.announce)
  } else {
    this.delegator.unlistenTo('hashchange')
    this.delegator.removeGlobalEventListener('hashchange', this.announce)
  }
}

HistoryState.prototype.change = function(path) {
  var pathname = location.pathname
  var hash = location.hash
  var isHash = /^#/.test(path)
  var reload = (
    isHash ? path === hash :
    this.usePushState ? path === pathname + hash :
    path === hash.substr(1)
  )

  if (!reload) {
    this.set(path)
    return true
  }

  return false
}

HistoryState.prototype.set = function(path) {
  if (this.usePushState) {
    history.pushState(null, null, path)
    this.announce()
    return true
  }

  location.hash = path
  return true
}

module.exports = HistoryState
