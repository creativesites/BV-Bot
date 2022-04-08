var $jscomp = $jscomp || {};

$jscomp.scope = {};

$jscomp.ASSUME_ES5 = !1;

$jscomp.ASSUME_NO_NATIVE_MAP = !1;

$jscomp.ASSUME_NO_NATIVE_SET = !1;

$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(d, c, a) {
    d != Array.prototype && d != Object.prototype && (d[c] = a.value);
};

$jscomp.getGlobal = function(d) {
    return "undefined" != typeof window && window === d ? d : "undefined" != typeof global && null != global ? global : d;
};

$jscomp.global = $jscomp.getGlobal(this);

$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";

$jscomp.initSymbol = function() {
    $jscomp.initSymbol = function() {};
    $jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol);
};

$jscomp.symbolCounter_ = 0;

$jscomp.Symbol = function(d) {
    return $jscomp.SYMBOL_PREFIX + (d || "") + $jscomp.symbolCounter_++;
};

$jscomp.initSymbolIterator = function() {
    $jscomp.initSymbol();
    var d = $jscomp.global.Symbol.iterator;
    d || (d = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator"));
    "function" != typeof Array.prototype[d] && $jscomp.defineProperty(Array.prototype, d, {
        configurable: !0,
        writable: !0,
        value: function() {
            return $jscomp.arrayIterator(this);
        }
    });
    $jscomp.initSymbolIterator = function() {};
};

$jscomp.arrayIterator = function(d) {
    var c = 0;
    return $jscomp.iteratorPrototype(function() {
        return c < d.length ? {
            done: !1,
            value: d[c++]
        } : {
            done: !0
        };
    });
};

$jscomp.iteratorPrototype = function(d) {
    $jscomp.initSymbolIterator();
    d = {
        next: d
    };
    d[$jscomp.global.Symbol.iterator] = function() {
        return this;
    };
    return d;
};

$jscomp.makeIterator = function(d) {
    $jscomp.initSymbolIterator();
    $jscomp.initSymbol();
    $jscomp.initSymbolIterator();
    var c = d[Symbol.iterator];
    return c ? c.call(d) : $jscomp.arrayIterator(d);
};

$jscomp.polyfill = function(d, c, a, b) {
    if (c) {
        a = $jscomp.global;
        d = d.split(".");
        for (b = 0; b < d.length - 1; b++) {
            var e = d[b];
            e in a || (a[e] = {});
            a = a[e];
        }
        d = d[d.length - 1];
        b = a[d];
        c = c(b);
        c != b && null != c && $jscomp.defineProperty(a, d, {
            configurable: !0,
            writable: !0,
            value: c
        });
    }
};

$jscomp.FORCE_POLYFILL_PROMISE = !1;

$jscomp.polyfill("Promise", function(d) {
    function c() {
        this.batch_ = null;
    }
    function a(a) {
        return a instanceof e ? a : new e(function(b, h) {
            b(a);
        });
    }
    if (d && !$jscomp.FORCE_POLYFILL_PROMISE) return d;
    c.prototype.asyncExecute = function(a) {
        null == this.batch_ && (this.batch_ = [], this.asyncExecuteBatch_());
        this.batch_.push(a);
        return this;
    };
    c.prototype.asyncExecuteBatch_ = function() {
        var a = this;
        this.asyncExecuteFunction(function() {
            a.executeBatch_();
        });
    };
    var b = $jscomp.global.setTimeout;
    c.prototype.asyncExecuteFunction = function(a) {
        b(a, 0);
    };
    c.prototype.executeBatch_ = function() {
        for (;this.batch_ && this.batch_.length; ) {
            var a = this.batch_;
            this.batch_ = [];
            for (var b = 0; b < a.length; ++b) {
                var c = a[b];
                delete a[b];
                try {
                    c();
                } catch (m) {
                    this.asyncThrow_(m);
                }
            }
        }
        this.batch_ = null;
    };
    c.prototype.asyncThrow_ = function(a) {
        this.asyncExecuteFunction(function() {
            throw a;
        });
    };
    var e = function(a) {
        this.state_ = 0;
        this.result_ = void 0;
        this.onSettledCallbacks_ = [];
        var b = this.createResolveAndReject_();
        try {
            a(b.resolve, b.reject);
        } catch (l) {
            b.reject(l);
        }
    };
    e.prototype.createResolveAndReject_ = function() {
        function a(a) {
            return function(h) {
                c || (c = !0, a.call(b, h));
            };
        }
        var b = this, c = !1;
        return {
            resolve: a(this.resolveTo_),
            reject: a(this.reject_)
        };
    };
    e.prototype.resolveTo_ = function(a) {
        if (a === this) this.reject_(new TypeError("A Promise cannot resolve to itself")); else if (a instanceof e) this.settleSameAsPromise_(a); else {
            a: switch (typeof a) {
              case "object":
                var b = null != a;
                break a;

              case "function":
                b = !0;
                break a;

              default:
                b = !1;
            }
            b ? this.resolveToNonPromiseObj_(a) : this.fulfill_(a);
        }
    };
    e.prototype.resolveToNonPromiseObj_ = function(a) {
        var b = void 0;
        try {
            b = a.then;
        } catch (l) {
            this.reject_(l);
            return;
        }
        "function" == typeof b ? this.settleSameAsThenable_(b, a) : this.fulfill_(a);
    };
    e.prototype.reject_ = function(a) {
        this.settle_(2, a);
    };
    e.prototype.fulfill_ = function(a) {
        this.settle_(1, a);
    };
    e.prototype.settle_ = function(a, b) {
        if (0 != this.state_) throw Error("Cannot settle(" + a + ", " + b | "): Promise already settled in state" + this.state_);
        this.state_ = a;
        this.result_ = b;
        this.executeOnSettledCallbacks_();
    };
    e.prototype.executeOnSettledCallbacks_ = function() {
        if (null != this.onSettledCallbacks_) {
            for (var a = this.onSettledCallbacks_, b = 0; b < a.length; ++b) a[b].call(), a[b] = null;
            this.onSettledCallbacks_ = null;
        }
    };
    var f = new c();
    e.prototype.settleSameAsPromise_ = function(a) {
        var b = this.createResolveAndReject_();
        a.callWhenSettled_(b.resolve, b.reject);
    };
    e.prototype.settleSameAsThenable_ = function(a, b) {
        var c = this.createResolveAndReject_();
        try {
            a.call(b, c.resolve, c.reject);
        } catch (m) {
            c.reject(m);
        }
    };
    e.prototype.then = function(a, b) {
        function c(a, b) {
            return "function" == typeof a ? function(b) {
                try {
                    d(a(b));
                } catch (q) {
                    k(q);
                }
            } : b;
        }
        var d, k, h = new e(function(a, b) {
            d = a;
            k = b;
        });
        this.callWhenSettled_(c(a, d), c(b, k));
        return h;
    };
    e.prototype.catch = function(a) {
        return this.then(void 0, a);
    };
    e.prototype.callWhenSettled_ = function(a, b) {
        function c() {
            switch (d.state_) {
              case 1:
                a(d.result_);
                break;

              case 2:
                b(d.result_);
                break;

              default:
                throw Error("Unexpected state: " + d.state_);
            }
        }
        var d = this;
        null == this.onSettledCallbacks_ ? f.asyncExecute(c) : this.onSettledCallbacks_.push(function() {
            f.asyncExecute(c);
        });
    };
    e.resolve = a;
    e.reject = function(a) {
        return new e(function(b, c) {
            c(a);
        });
    };
    e.race = function(b) {
        return new e(function(c, d) {
            for (var e = $jscomp.makeIterator(b), k = e.next(); !k.done; k = e.next()) a(k.value).callWhenSettled_(c, d);
        });
    };
    e.all = function(b) {
        var c = $jscomp.makeIterator(b), d = c.next();
        return d.done ? a([]) : new e(function(b, e) {
            function k(a) {
                return function(c) {
                    h[a] = c;
                    f--;
                    0 == f && b(h);
                };
            }
            var h = [], f = 0;
            do h.push(void 0), f++, a(d.value).callWhenSettled_(k(h.length - 1), e), d = c.next(); while (!d.done);
        });
    };
    return e;
}, "es6", "es3");

$jscomp.executeAsyncGenerator = function(d) {
    function c(a) {
        return d.next(a);
    }
    function a(a) {
        return d.throw(a);
    }
    return new Promise(function(b, e) {
        function f(d) {
            d.done ? b(d.value) : Promise.resolve(d.value).then(c, a).then(f, e);
        }
        f(d.next());
    });
};

$jscomp.inherits = function(d, c) {
    function a() {}
    a.prototype = c.prototype;
    d.superClass_ = c.prototype;
    d.prototype = new a();
    d.prototype.constructor = d;
    for (var b in c) if ("prototype" != b) if (Object.defineProperties) {
        var e = Object.getOwnPropertyDescriptor(c, b);
        e && Object.defineProperty(d, b, e);
    } else d[b] = c[b];
};

$jscomp.iteratorFromArray = function(d, c) {
    $jscomp.initSymbolIterator();
    d instanceof String && (d += "");
    var a = 0, b = {
        next: function() {
            if (a < d.length) {
                var e = a++;
                return {
                    value: c(e, d[e]),
                    done: !1
                };
            }
            b.next = function() {
                return {
                    done: !0,
                    value: void 0
                };
            };
            return b.next();
        }
    };
    b[Symbol.iterator] = function() {
        return b;
    };
    return b;
};

$jscomp.polyfill("Array.prototype.keys", function(d) {
    return d ? d : function() {
        return $jscomp.iteratorFromArray(this, function(c) {
            return c;
        });
    };
}, "es6", "es3");

$jscomp.owns = function(d, c) {
    return Object.prototype.hasOwnProperty.call(d, c);
};

$jscomp.polyfill("WeakMap", function(d) {
    function c(a) {
        $jscomp.owns(a, b) || $jscomp.defineProperty(a, b, {
            value: {}
        });
    }
    function a(a) {
        var b = Object[a];
        b && (Object[a] = function(a) {
            c(a);
            return b(a);
        });
    }
    if (function() {
        if (!d || !Object.seal) return !1;
        try {
            var a = Object.seal({}), b = Object.seal({}), c = new d([ [ a, 2 ], [ b, 3 ] ]);
            if (2 != c.get(a) || 3 != c.get(b)) return !1;
            c.delete(a);
            c.set(b, 4);
            return !c.has(a) && 4 == c.get(b);
        } catch (m) {
            return !1;
        }
    }()) return d;
    var b = "$jscomp_hidden_" + Math.random().toString().substring(2);
    a("freeze");
    a("preventExtensions");
    a("seal");
    var e = 0, f = function(a) {
        this.id_ = (e += Math.random() + 1).toString();
        if (a) {
            $jscomp.initSymbol();
            $jscomp.initSymbolIterator();
            a = $jscomp.makeIterator(a);
            for (var b; !(b = a.next()).done; ) b = b.value, this.set(b[0], b[1]);
        }
    };
    f.prototype.set = function(a, d) {
        c(a);
        if (!$jscomp.owns(a, b)) throw Error("WeakMap key fail: " + a);
        a[b][this.id_] = d;
        return this;
    };
    f.prototype.get = function(a) {
        return $jscomp.owns(a, b) ? a[b][this.id_] : void 0;
    };
    f.prototype.has = function(a) {
        return $jscomp.owns(a, b) && $jscomp.owns(a[b], this.id_);
    };
    f.prototype.delete = function(a) {
        return $jscomp.owns(a, b) && $jscomp.owns(a[b], this.id_) ? delete a[b][this.id_] : !1;
    };
    return f;
}, "es6", "es3");

$jscomp.MapEntry = function() {};

$jscomp.polyfill("Map", function(d) {
    if (!$jscomp.ASSUME_NO_NATIVE_MAP && function() {
        if (!d || !d.prototype.entries || "function" != typeof Object.seal) return !1;
        try {
            var a = Object.seal({
                x: 4
            }), b = new d($jscomp.makeIterator([ [ a, "s" ] ]));
            if ("s" != b.get(a) || 1 != b.size || b.get({
                x: 4
            }) || b.set({
                x: 4
            }, "t") != b || 2 != b.size) return !1;
            var c = b.entries(), e = c.next();
            if (e.done || e.value[0] != a || "s" != e.value[1]) return !1;
            e = c.next();
            return e.done || 4 != e.value[0].x || "t" != e.value[1] || !c.next().done ? !1 : !0;
        } catch (v) {
            return !1;
        }
    }()) return d;
    $jscomp.initSymbol();
    $jscomp.initSymbolIterator();
    var c = new WeakMap(), a = function(a) {
        this.data_ = {};
        this.head_ = f();
        this.size = 0;
        if (a) {
            a = $jscomp.makeIterator(a);
            for (var b; !(b = a.next()).done; ) b = b.value, this.set(b[0], b[1]);
        }
    };
    a.prototype.set = function(a, c) {
        var d = b(this, a);
        d.list || (d.list = this.data_[d.id] = []);
        d.entry ? d.entry.value = c : (d.entry = {
            next: this.head_,
            previous: this.head_.previous,
            head: this.head_,
            key: a,
            value: c
        }, d.list.push(d.entry), this.head_.previous.next = d.entry, this.head_.previous = d.entry, 
        this.size++);
        return this;
    };
    a.prototype.delete = function(a) {
        a = b(this, a);
        return a.entry && a.list ? (a.list.splice(a.index, 1), a.list.length || delete this.data_[a.id], 
        a.entry.previous.next = a.entry.next, a.entry.next.previous = a.entry.previous, 
        a.entry.head = null, this.size--, !0) : !1;
    };
    a.prototype.clear = function() {
        this.data_ = {};
        this.head_ = this.head_.previous = f();
        this.size = 0;
    };
    a.prototype.has = function(a) {
        return !!b(this, a).entry;
    };
    a.prototype.get = function(a) {
        return (a = b(this, a).entry) && a.value;
    };
    a.prototype.entries = function() {
        return e(this, function(a) {
            return [ a.key, a.value ];
        });
    };
    a.prototype.keys = function() {
        return e(this, function(a) {
            return a.key;
        });
    };
    a.prototype.values = function() {
        return e(this, function(a) {
            return a.value;
        });
    };
    a.prototype.forEach = function(a, b) {
        for (var c = this.entries(), d; !(d = c.next()).done; ) d = d.value, a.call(b, d[1], d[0], this);
    };
    a.prototype[Symbol.iterator] = a.prototype.entries;
    var b = function(a, b) {
        var d = b && typeof b;
        "object" == d || "function" == d ? c.has(b) ? d = c.get(b) : (d = "" + ++h, c.set(b, d)) : d = "p_" + b;
        var e = a.data_[d];
        if (e && $jscomp.owns(a.data_, d)) for (a = 0; a < e.length; a++) {
            var f = e[a];
            if (b !== b && f.key !== f.key || b === f.key) return {
                id: d,
                list: e,
                index: a,
                entry: f
            };
        }
        return {
            id: d,
            list: e,
            index: -1,
            entry: void 0
        };
    }, e = function(a, b) {
        var c = a.head_;
        return $jscomp.iteratorPrototype(function() {
            if (c) {
                for (;c.head != a.head_; ) c = c.previous;
                for (;c.next != c.head; ) return c = c.next, {
                    done: !1,
                    value: b(c)
                };
                c = null;
            }
            return {
                done: !0,
                value: void 0
            };
        });
    }, f = function() {
        var a = {};
        return a.previous = a.next = a.head = a;
    }, h = 0;
    return a;
}, "es6", "es3");

$jscomp.polyfill("Set", function(d) {
    if (!$jscomp.ASSUME_NO_NATIVE_SET && function() {
        if (!d || !d.prototype.entries || "function" != typeof Object.seal) return !1;
        try {
            var a = Object.seal({
                x: 4
            }), b = new d($jscomp.makeIterator([ a ]));
            if (!b.has(a) || 1 != b.size || b.add(a) != b || 1 != b.size || b.add({
                x: 4
            }) != b || 2 != b.size) return !1;
            var c = b.entries(), f = c.next();
            if (f.done || f.value[0] != a || f.value[1] != a) return !1;
            f = c.next();
            return f.done || f.value[0] == a || 4 != f.value[0].x || f.value[1] != f.value[0] ? !1 : c.next().done;
        } catch (h) {
            return !1;
        }
    }()) return d;
    $jscomp.initSymbol();
    $jscomp.initSymbolIterator();
    var c = function(a) {
        this.map_ = new Map();
        if (a) {
            a = $jscomp.makeIterator(a);
            for (var b; !(b = a.next()).done; ) this.add(b.value);
        }
        this.size = this.map_.size;
    };
    c.prototype.add = function(a) {
        this.map_.set(a, a);
        this.size = this.map_.size;
        return this;
    };
    c.prototype.delete = function(a) {
        a = this.map_.delete(a);
        this.size = this.map_.size;
        return a;
    };
    c.prototype.clear = function() {
        this.map_.clear();
        this.size = 0;
    };
    c.prototype.has = function(a) {
        return this.map_.has(a);
    };
    c.prototype.entries = function() {
        return this.map_.entries();
    };
    c.prototype.values = function() {
        return this.map_.values();
    };
    c.prototype.keys = c.prototype.values;
    c.prototype[Symbol.iterator] = c.prototype.values;
    c.prototype.forEach = function(a, b) {
        var c = this;
        this.map_.forEach(function(d) {
            return a.call(b, d, d, c);
        });
    };
    return c;
}, "es6", "es3");

$jscomp.polyfill("Object.assign", function(d) {
    return d ? d : function(c, a) {
        for (var b = 1; b < arguments.length; b++) {
            var d = arguments[b];
            if (d) for (var f in d) $jscomp.owns(d, f) && (c[f] = d[f]);
        }
        return c;
    };
}, "es6", "es3");

$jscomp.polyfill("Array.from", function(d) {
    return d ? d : function(c, a, b) {
        $jscomp.initSymbolIterator();
        a = null != a ? a : function(a) {
            return a;
        };
        var d = [], f = c[Symbol.iterator];
        if ("function" == typeof f) for (c = f.call(c); !(f = c.next()).done; ) d.push(a.call(b, f.value)); else {
            f = c.length;
            for (var h = 0; h < f; h++) d.push(a.call(b, c[h]));
        }
        return d;
    };
}, "es6", "es3");

$jscomp.polyfill("Object.setPrototypeOf", function(d) {
    return d ? d : "object" != typeof "".__proto__ ? null : function(c, a) {
        c.__proto__ = a;
        if (c.__proto__ !== a) throw new TypeError(c + " is not extensible");
        return c;
    };
}, "es6", "es5");

(function(d) {
    function c(b) {
        if (a[b]) return a[b].exports;
        var e = a[b] = {
            i: b,
            l: !1,
            exports: {}
        };
        d[b].call(e.exports, e, e.exports, c);
        e.l = !0;
        return e.exports;
    }
    var a = {};
    c.m = d;
    c.c = a;
    c.d = function(a, d, f) {
        c.o(a, d) || Object.defineProperty(a, d, {
            configurable: !1,
            enumerable: !0,
            get: f
        });
    };
    c.n = function(a) {
        var b = a && a.__esModule ? function() {
            return a["default"];
        } : function() {
            return a;
        };
        c.d(b, "a", b);
        return b;
    };
    c.o = function(a, c) {
        return Object.prototype.hasOwnProperty.call(a, c);
    };
    c.p = "dist";
    return c(c.s = 10);
})([ function(d, c, a) {
    a.d(c, "B", function() {
        return "df-messenger";
    });
    a.d(c, "C", function() {
        return "df-messenger-chat";
    });
    a.d(c, "A", function() {
        return "df-message-list";
    });
    a.d(c, "G", function() {
        return "df-messenger-user-input";
    });
    a.d(c, "H", function() {
        return "df-title";
    });
    a.d(c, "s", function() {
        return "df-button";
    });
    a.d(c, "r", function() {
        return "df-accordion";
    });
    a.d(c, "v", function() {
        return "df-chips";
    });
    a.d(c, "_0", function() {
        return "df-chip-clicked";
    });
    a.d(c, "o", function() {
        return "df-chips-wrapper";
    });
    a.d(c, "L", function() {
        return "expand";
    });
    a.d(c, "j", function() {
        return "chat-min";
    });
    a.d(c, "n", function() {
        return "chat-wrapper";
    });
    a.d(c, "a", function() {
        return "access-token";
    });
    a.d(c, "Y", function() {
        return "session-id";
    });
    a.d(c, "P", function() {
        return "language-code";
    });
    a.d(c, "e", function() {
        return "api-uri";
    });
    a.d(c, "d", function() {
        return "agent-id";
    });
    a.d(c, "V", function() {
        return "project-id";
    });
    a.d(c, "T", function() {
        return "message-list-wrapper";
    });
    a.d(c, "S", function() {
        return "minimized";
    });
    a.d(c, "O", function() {
        return "intent";
    });
    a.d(c, "p", function() {
        return "closeIcon";
    });
    a.d(c, "J", function() {
        return "dismissIcon";
    });
    a.d(c, "_1", function() {
        return "title-card-elements";
    });
    a.d(c, "Q", function() {
        return "link-wrapper";
    });
    a.d(c, "w", function() {
        return "df-description";
    });
    a.d(c, "q", function() {
        return "descriptionWrapper";
    });
    a.d(c, "c", function() {
        return "dfAccordionWrapper";
    });
    a.d(c, "F", function() {
        return "df-messenger-titlebar";
    });
    a.d(c, "D", function() {
        return "df-messenger-error";
    });
    a.d(c, "W", function() {
        return "df-request-sent";
    });
    a.d(c, "X", function() {
        return "df-response-received";
    });
    a.d(c, "_3", function() {
        return "df-user-input-entered";
    });
    a.d(c, "M", function() {
        return "df-info-card-clicked";
    });
    a.d(c, "Z", function() {
        return "show";
    });
    a.d(c, "f", function() {
        return "typing";
    });
    a.d(c, "K", function() {
        return "error";
    });
    a.d(c, "U", function() {
        return "minimizeIcon";
    });
    a.d(c, "y", function() {
        return "df-image";
    });
    a.d(c, "g", function() {
        return "df-button-clicked";
    });
    a.d(c, "N", function() {
        return b;
    });
    a.d(c, "z", function() {
        return "df-list-element";
    });
    a.d(c, "R", function() {
        return "df-list-element-clicked";
    });
    a.d(c, "t", function() {
        return "df-card";
    });
    a.d(c, "x", function() {
        return "df-divider";
    });
    a.d(c, "i", function() {
        return "chat-icon";
    });
    a.d(c, "m", function() {
        return "chat-title";
    });
    a.d(c, "u", function() {
        return "df-chat-icon";
    });
    a.d(c, "I", function() {
        return "dfTitlebar";
    });
    a.d(c, "b", function() {
        return "df-accordion-clicked";
    });
    a.d(c, "l", function() {
        return "df-messenger-opened";
    });
    a.d(c, "h", function() {
        return "df-messenger-closed";
    });
    a.d(c, "k", function() {
        return "df-messenger-welcome-shown";
    });
    a.d(c, "E", function() {
        return "df-messenger-loaded";
    });
    a.d(c, "_2", function() {
        return "user-id";
    });
    a.d(c, "_4", function() {
        return "wait-open";
    });
    a.d(c, "_5", function() {
        return ")]}'\n";
    });
    var b = Object.freeze({
        text: "text",
        event: "event"
    });
}, function(d, c, a) {
    var b = a(7);
    c.a = function(a, b) {
        b = void 0 === b ? document : b;
        return b.querySelector(a);
    };
    c.b = function(a, b) {
        b = void 0 === b ? document : b;
        return b.querySelectorAll(a);
    };
    var e = function(a, b) {
        return Object.keys(b).forEach(function(c) {
            a.setAttribute(c, b[c]);
        });
    };
    c.c = function(a, b, c, d) {
        b = void 0 === b ? [] : b;
        c = void 0 === c ? null : c;
        d = void 0 === d ? {} : d;
        var f = document.createElement(a);
        b.forEach(function(a) {
            f.classList.add(a);
        });
        null !== c && (f.innerText = c);
        d && e(f, d);
        return f;
    };
    c.d = function(a, b, c) {
        c = void 0 === c ? {} : c;
        b = new CustomEvent(b, {
            detail: c,
            bubbles: !0,
            composed: !0
        });
        a.dispatchEvent(b);
    };
    c.g = function(a) {
        a.parentNode && a.parentNode.removeChild(a);
    };
    c.f = function(a, b, c, d, e) {
        var f = new Image();
        f.onload = function() {
            d(a, c, b);
        };
        f.onerror = function() {
            e(a, c, b);
        };
        f.src = b;
    };
    c.e = function(a, c) {
        return a && b.a.has(a) ? (a = b.a.get(a)[c]) ? a : b.a.get("en")[c] : b.a.get("en")[c];
    };
}, function(d, c, a) {
    var b = a(1), e = a(0), f = function() {
        return Object(b.a)(e.B);
    };
    c.d = f;
    var h = function() {
        return Object(b.a)(e.C, f().shadowRoot);
    };
    c.a = h;
    c.b = function() {
        return Object(b.a)("." + e.n, h().shadowRoot);
    };
    c.c = function() {
        return Object(b.a)(e.A, h().shadowRoot);
    };
}, function(d, c, a) {
    (function(a) {
        (function() {
            function b() {
                this.end = this.start = 0;
                this.rules = this.parent = this.previous = null;
                this.cssText = this.parsedCssText = "";
                this.atRule = !1;
                this.type = 0;
                this.parsedSelector = this.selector = this.keyframesName = "";
            }
            function c(a) {
                a = a.replace(sb, "").replace(tb, "");
                var g = d, c = a, e = new b();
                e.start = 0;
                e.end = c.length;
                for (var C = e, T = 0, f = c.length; T < f; T++) if ("{" === c[T]) {
                    C.rules || (C.rules = []);
                    var h = C, n = h.rules[h.rules.length - 1] || null;
                    C = new b();
                    C.start = T + 1;
                    C.parent = h;
                    C.previous = n;
                    h.rules.push(C);
                } else "}" === c[T] && (C.end = T + 1, C = C.parent || e);
                return g(e, a);
            }
            function d(a, b) {
                var g = b.substring(a.start, a.end - 1);
                a.parsedCssText = a.cssText = g.trim();
                a.parent && (g = b.substring(a.previous ? a.previous.end : a.parent.start, a.start - 1), 
                g = k(g), g = g.replace(oa, " "), g = g.substring(g.lastIndexOf(";") + 1), g = a.parsedSelector = a.selector = g.trim(), 
                a.atRule = 0 === g.indexOf("@"), a.atRule ? 0 === g.indexOf("@media") ? a.type = mb : g.match(Oa) && (a.type = Pa, 
                a.keyframesName = a.selector.split(oa).pop()) : a.type = 0 === g.indexOf("--") ? nb : ob);
                if (g = a.rules) for (var c = 0, p = g.length, e; c < p && (e = g[c]); c++) d(e, b);
                return a;
            }
            function k(a) {
                return a.replace(/\\([0-9a-f]{1,6})\s/gi, function(a, g) {
                    a = g;
                    for (g = 6 - a.length; g--; ) a = "0" + a;
                    return "\\" + a;
                });
            }
            function l(a, b, c) {
                c = void 0 === c ? "" : c;
                var g = "";
                if (a.cssText || a.rules) {
                    var d = a.rules, p;
                    if (p = d) p = d[0], p = !(p && p.selector && 0 === p.selector.indexOf("--"));
                    if (p) {
                        p = 0;
                        for (var e = d.length, wa; p < e && (wa = d[p]); p++) g = l(wa, b, g);
                    } else b ? b = a.cssText : (b = a.cssText, b = b.replace(pb, "").replace(Qa, ""), 
                    b = b.replace(xa, "").replace(K, "")), (g = b.trim()) && (g = "  " + g + "\n");
                }
                g && (a.selector && (c += a.selector + " {\n"), c += g, a.selector && (c += "}\n\n"));
                return c;
            }
            function m(a) {
                ya = a && a.shimcssproperties ? !1 : x || !(navigator.userAgent.match(/AppleWebKit\/601|Edge\/15/) || !window.CSS || !CSS.supports || !CSS.supports("box-shadow", "0 0 0 var(--foo)"));
            }
            function t(a, b) {
                if (!a) return "";
                "string" === typeof a && (a = c(a));
                b && w(a, b);
                return l(a, F);
            }
            function v(a) {
                !a.__cssRules && a.textContent && (a.__cssRules = c(a.textContent));
                return a.__cssRules || null;
            }
            function w(a, b, c, d) {
                if (a) {
                    var g = !1, p = a.type;
                    if (d && p === mb) {
                        var e = a.selector.match(bb);
                        e && (window.matchMedia(e[1]).matches || (g = !0));
                    }
                    p === ob ? b(a) : c && p === Pa ? c(a) : p === nb && (g = !0);
                    if ((a = a.rules) && !g) {
                        g = 0;
                        p = a.length;
                        for (var B; g < p && (B = a[g]); g++) w(B, b, c, d);
                    }
                }
            }
            function P(a, b, c, d) {
                var g = document.createElement("style");
                b && g.setAttribute("scope", b);
                g.textContent = a;
                u(g, c, d);
                return g;
            }
            function u(a, b, c) {
                b = b || document.head;
                b.insertBefore(a, c && c.nextSibling || b.firstChild);
                R ? a.compareDocumentPosition(R) === Node.DOCUMENT_POSITION_PRECEDING && (R = a) : R = a;
            }
            function q(a, b) {
                var g = a.indexOf("var(");
                if (-1 === g) return b(a, "", "", "");
                a: {
                    var c = 0;
                    var d = g + 3;
                    for (var p = a.length; d < p; d++) if ("(" === a[d]) c++; else if (")" === a[d] && 0 === --c) break a;
                    d = -1;
                }
                c = a.substring(g + 4, d);
                g = a.substring(0, g);
                a = q(a.substring(d + 1), b);
                d = c.indexOf(",");
                return -1 === d ? b(g, c.trim(), "", a) : b(g, c.substring(0, d).trim(), c.substring(d + 1).trim(), a);
            }
            function L(a, b) {
                x ? a.setAttribute("class", b) : window.ShadyDOM.nativeMethods.setAttribute.call(a, "class", b);
            }
            function D(a) {
                var b = a.localName, g = "";
                b ? -1 < b.indexOf("-") || (g = b, b = a.getAttribute && a.getAttribute("is") || "") : (b = a.is, 
                g = a.extends);
                return {
                    is: b,
                    u: g
                };
            }
            function M() {}
            function N(a, b, c) {
                var g = H;
                a.__styleScoped ? a.__styleScoped = null : pa(g, a, b || "", c);
            }
            function pa(a, b, c, d) {
                b.nodeType === Node.ELEMENT_NODE && qa(b, c, d);
                if (b = "template" === b.localName ? (b.content || b.O || b).childNodes : b.children || b.childNodes) for (var g = 0; g < b.length; g++) pa(a, b[g], c, d);
            }
            function qa(a, b, c) {
                if (b) if (a.classList) c ? (a.classList.remove("style-scope"), a.classList.remove(b)) : (a.classList.add("style-scope"), 
                a.classList.add(b)); else if (a.getAttribute) {
                    var g = a.getAttribute(za);
                    c ? g && (b = g.replace("style-scope", "").replace(b, ""), L(a, b)) : L(a, (g ? g + " " : "") + "style-scope " + b);
                }
            }
            function ea(a, b, c) {
                var g = H, d = a.__cssBuild;
                x || "shady" === d ? b = t(b, c) : (a = D(a), b = J(g, b, a.is, a.u, c) + "\n\n");
                return b.trim();
            }
            function J(a, b, c, d, e) {
                var g = Aa(c, d);
                c = c ? U + c : "";
                return t(b, function(b) {
                    b.c || (b.selector = b.g = V(a, b, a.b, c, g), b.c = !0);
                    e && e(b, c, g);
                });
            }
            function Aa(a, b) {
                return b ? "[is=" + a + "]" : a;
            }
            function V(a, b, c, d, e) {
                var g = b.selector.split(Ba);
                if (!b.parent || b.parent.type !== Pa) {
                    b = 0;
                    for (var p = g.length, C; b < p && (C = g[b]); b++) g[b] = c.call(a, C, d, e);
                }
                return g.join(Ba);
            }
            function Ca(a) {
                return a.replace(fa, function(a, b, c) {
                    -1 < c.indexOf("+") ? c = c.replace(/\+/g, "___") : -1 < c.indexOf("___") && (c = c.replace(/___/g, "+"));
                    return ":" + b + "(" + c + ")";
                });
            }
            function O(a, b, c, d) {
                var g = a.indexOf(ha);
                0 <= a.indexOf(Z) ? a = cb(a, d) : 0 !== g && (a = c ? Ra(a, c) : a);
                c = !1;
                0 <= g && (b = "", c = !0);
                if (c) {
                    var e = !0;
                    c && (a = a.replace(Sa, function(a, b) {
                        return " > " + b;
                    }));
                }
                a = a.replace(Da, function(a, b, c) {
                    return '[dir="' + c + '"] ' + b + ", " + b + '[dir="' + c + '"]';
                });
                return {
                    value: a,
                    F: b,
                    stop: e
                };
            }
            function Ra(a, b) {
                a = a.split(aa);
                a[0] += b;
                return a.join(aa);
            }
            function cb(a, b) {
                var c = a.match(ra);
                return (c = c && c[2].trim() || "") ? c[0].match(Ea) ? a.replace(ra, function(a, c, g) {
                    return b + g;
                }) : c.split(Ea)[0] === b ? c : Fa : a.replace(Z, b);
            }
            function E(a, b, c, d) {
                this.j = a || null;
                this.b = b || null;
                this.A = c || [];
                this.o = null;
                this.u = d || "";
                this.a = this.h = this.m = null;
            }
            function Q(a) {
                return a ? a.__styleInfo : null;
            }
            function Ga(a) {
                var b = this.matches || this.matchesSelector || this.mozMatchesSelector || this.msMatchesSelector || this.oMatchesSelector || this.webkitMatchesSelector;
                return b && b.call(this, a);
            }
            function Ha() {}
            function Ta(a) {
                var b = {}, c = [], d = 0;
                w(a, function(a) {
                    ia(a);
                    a.index = d++;
                    a = a.f.cssText;
                    for (var c; c = Ia.exec(a); ) {
                        var g = c[1];
                        ":" !== c[2] && (b[g] = !0);
                    }
                }, function(a) {
                    c.push(a);
                });
                a.b = c;
                a = [];
                for (var g in b) a.push(g);
                return a;
            }
            function ia(a) {
                if (!a.f) {
                    var b = {}, c = {};
                    ja(a, c) && (b.i = c, a.rules = null);
                    b.cssText = a.parsedCssText.replace(db, "").replace(sa, "");
                    a.f = b;
                }
            }
            function ja(a, b) {
                var c = a.f;
                if (c) {
                    if (c.i) return Object.assign(b, c.i), !0;
                } else {
                    c = a.parsedCssText;
                    for (var d; a = sa.exec(c); ) {
                        d = (a[2] || a[3]).trim();
                        if ("inherit" !== d || "unset" !== d) b[a[1].trim()] = d;
                        d = !0;
                    }
                    return d;
                }
            }
            function ba(a, b, c) {
                b && (b = 0 <= b.indexOf(";") ? ta(a, b, c) : q(b, function(b, d, g, e) {
                    if (!d) return b + e;
                    (d = ba(a, c[d], c)) && "initial" !== d ? "apply-shim-inherit" === d && (d = "inherit") : d = ba(a, c[g] || g, c) || g;
                    return b + (d || "") + e;
                }));
                return b && b.trim() || "";
            }
            function ta(a, b, c) {
                b = b.split(";");
                for (var d = 0, g, e; d < b.length; d++) if (g = b[d]) {
                    I.lastIndex = 0;
                    if (e = I.exec(g)) g = ba(a, c[e[1]], c); else if (e = g.indexOf(":"), -1 !== e) {
                        var p = g.substring(e);
                        p = p.trim();
                        p = ba(a, p, c) || p;
                        g = g.substring(0, e) + p;
                    }
                    b[d] = g && g.lastIndexOf(";") === g.length - 1 ? g.slice(0, -1) : g || "";
                }
                return b.join(";");
            }
            function Ja(a, b) {
                var c = {}, d = [];
                w(a, function(a) {
                    a.f || ia(a);
                    var g = a.g || a.parsedSelector;
                    b && a.f.i && g && Ga.call(b, g) && (ja(a, c), a = a.index, g = parseInt(a / 32, 10), 
                    d[g] = (d[g] || 0) | 1 << a % 32);
                }, null, !0);
                return {
                    i: c,
                    key: d
                };
            }
            function Ua(a, b, c, d) {
                b.f || ia(b);
                if (b.f.i) {
                    var g = D(a);
                    a = g.is;
                    g = g.u;
                    g = a ? Aa(a, g) : "html";
                    var e = b.parsedSelector, f = ":host > *" === e || "html" === e, p = 0 === e.indexOf(":host") && !f;
                    "shady" === c && (f = e === g + " > *." + g || -1 !== e.indexOf("html"), p = !f && 0 === e.indexOf(g));
                    "shadow" === c && (f = ":host > *" === e || "html" === e, p = p && !f);
                    if (f || p) c = g, p && (b.g || (b.g = V(H, b, H.b, a ? U + a : "", g)), c = b.g || g), 
                    d({
                        K: c,
                        I: p,
                        R: f
                    });
                }
            }
            function ua(a, b) {
                var c = {}, d = {}, g = b && b.__cssBuild;
                w(b, function(b) {
                    Ua(a, b, g, function(g) {
                        Ga.call(a.P || a, g.K) && (g.I ? ja(b, c) : ja(b, d));
                    });
                }, null, !0);
                return {
                    J: d,
                    H: c
                };
            }
            function eb(a, b, c, d) {
                var g = D(b), e = Aa(g.is, g.u), f = new RegExp("(?:^|[^.#[:])" + (b.extends ? "\\" + e.slice(0, -1) + "\\]" : e) + "($|[.:[\\s>+~])");
                g = Q(b).j;
                var p = fb(g, d);
                return ea(b, g, function(b) {
                    var g = "";
                    b.f || ia(b);
                    b.f.cssText && (g = ta(a, b.f.cssText, c));
                    b.cssText = g;
                    if (!(x || b.parent && b.parent.type === Pa) && b.cssText) {
                        var n = g = b.cssText;
                        null == b.B && (b.B = Ka.test(g));
                        if (b.B) if (null == b.v) {
                            b.v = [];
                            for (var h in p) n = p[h], n = n(g), g !== n && (g = n, b.v.push(h));
                        } else {
                            for (h = 0; h < b.v.length; ++h) n = p[b.v[h]], g = n(g);
                            n = g;
                        }
                        b.cssText = n;
                        b.g = b.g || b.selector;
                        g = "." + d;
                        h = b.g.split(",");
                        n = 0;
                        for (var P = h.length, B; n < P && (B = h[n]); n++) h[n] = B.match(f) ? B.replace(e, g) : g + " " + B;
                        b.selector = h.join(",");
                    }
                });
            }
            function fb(a, b) {
                a = a.b;
                var c = {};
                if (!x && a) for (var d = 0, g = a[d]; d < a.length; g = a[++d]) {
                    var e = g, f = b;
                    e.l = new RegExp("\\b" + e.keyframesName + "(?!\\B|-)", "g");
                    e.a = e.keyframesName + "-" + f;
                    e.g = e.g || e.selector;
                    e.selector = e.g.replace(e.keyframesName, e.a);
                    c[g.keyframesName] = hb(g);
                }
                return c;
            }
            function hb(a) {
                return function(b) {
                    return b.replace(a.l, a.a);
                };
            }
            function ib(a, b) {
                var c = ka, d = v(a);
                a.textContent = t(d, function(a) {
                    var d = a.cssText = a.parsedCssText;
                    a.f && a.f.cssText && (d = d.replace(pb, "").replace(Qa, ""), a.cssText = ta(c, d, b));
                });
            }
            function Va() {
                this.cache = {};
            }
            function Wa() {}
            function Xa(a) {
                for (var b = 0; b < a.length; b++) {
                    var c = a[b];
                    if (c.target !== document.documentElement && c.target !== document.head) for (var d = 0; d < c.addedNodes.length; d++) {
                        var g = c.addedNodes[d];
                        if (g.nodeType === Node.ELEMENT_NODE) {
                            var e = g.getRootNode(), f = g, h = [];
                            f.classList ? h = Array.from(f.classList) : f instanceof window.SVGElement && f.hasAttribute("class") && (h = f.getAttribute("class").split(/\s+/));
                            f = h;
                            h = f.indexOf(H.a);
                            if ((f = -1 < h ? f[h + 1] : "") && e === g.ownerDocument) N(g, f, !0); else if (e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && (e = e.host)) if (e = D(e).is, 
                            f === e) for (g = window.ShadyDOM.nativeMethods.querySelectorAll.call(g, ":not(." + H.a + ")"), 
                            e = 0; e < g.length; e++) qa(g[e], f); else f && N(g, f, !0), N(g, e);
                        }
                    }
                }
            }
            function la(a) {
                if (a = ca[a]) a._applyShimCurrentVersion = a._applyShimCurrentVersion || 0, a._applyShimValidatingVersion = a._applyShimValidatingVersion || 0, 
                a._applyShimNextVersion = (a._applyShimNextVersion || 0) + 1;
            }
            function jb(a) {
                a._applyShimValidatingVersion = a._applyShimNextVersion;
                a.b || (a.b = !0, Ya.then(function() {
                    a._applyShimCurrentVersion = a._applyShimNextVersion;
                    a.b = !1;
                }));
            }
            function r() {
                this.w = {};
                this.c = document.documentElement;
                var a = new b();
                a.rules = [];
                a = new E(a);
                this.l = this.c.__styleInfo = a;
                this.s = !1;
                this.b = this.a = null;
            }
            function vb(a) {
                !a.b && window.ShadyCSS && window.ShadyCSS.CustomStyleInterface && (a.b = window.ShadyCSS.CustomStyleInterface, 
                a.b.transformCallback = function(b) {
                    a.C(b);
                }, a.b.validateCallback = function() {
                    requestAnimationFrame(function() {
                        (a.b.enqueued || a.s) && a.flushCustomStyles();
                    });
                });
            }
            function La(a) {
                !a.a && window.ShadyCSS && window.ShadyCSS.ApplyShim && (a.a = window.ShadyCSS.ApplyShim, 
                a.a.invalidCallback = la);
                vb(a);
            }
            function Za(a, b) {
                return (b = b.getRootNode().host) ? Q(b) ? b : Za(a, b) : a.c;
            }
            function qb(a, b, c) {
                a = Za(a, b);
                var d = Q(a);
                a = Object.create(d.m || null);
                var g = ua(b, c.j);
                b = Ja(d.j, b).i;
                Object.assign(a, g.H, b, g.J);
                b = c.o;
                for (var e in b) if ((g = b[e]) || 0 === g) a[e] = g;
                e = ka;
                b = Object.getOwnPropertyNames(a);
                for (g = 0; g < b.length; g++) d = b[g], a[d] = ba(e, a[d], a);
                c.m = a;
            }
            var rb = "undefined" != typeof window && window === this ? this : "undefined" != typeof a && null != a ? a : this, ob = 1, Pa = 7, mb = 4, nb = 1e3, sb = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim, tb = /@import[^;]*;/gim, pb = /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim, Qa = /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim, xa = /@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim, K = /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim, Oa = /^@[^\s]*keyframes/, oa = /\s+/g, x = !(window.ShadyDOM && window.ShadyDOM.inUse), ya;
            window.ShadyCSS && void 0 !== window.ShadyCSS.nativeCss ? ya = window.ShadyCSS.nativeCss : window.ShadyCSS ? (m(window.ShadyCSS), 
            window.ShadyCSS = void 0) : m(window.WebComponents && window.WebComponents.flags);
            var F = ya, sa = /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi, I = /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi, Ia = /(--[\w-]+)\s*([:,;)]|$)/gi, Ka = /(animation\s*:)|(animation-name\s*:)/, bb = /@media\s(.*)/, db = /\{[^}]*\}/g, $a = new Set(), R = null;
            M.prototype.b = function(a, b, c) {
                var d = !1;
                a = a.trim();
                var g = fa.test(a);
                g && (a = a.replace(fa, function(a, b, c) {
                    return ":" + b + "(" + c.replace(/\s/g, "") + ")";
                }), a = Ca(a));
                a = a.replace(ab, Z + " $1");
                a = a.replace(z, function(a, g, e) {
                    d || (a = O(e, g, b, c), d = d || a.stop, g = a.F, e = a.value);
                    return g + e;
                });
                g && (a = Ca(a));
                return a;
            };
            M.prototype.c = function(a) {
                return a.match(ha) ? this.b(a, y) : Ra(a.trim(), y);
            };
            rb.Object.defineProperties(M.prototype, {
                a: {
                    configurable: !0,
                    enumerable: !0,
                    get: function() {
                        return "style-scope";
                    }
                }
            });
            var fa = /:(nth[-\w]+)\(([^)]+)\)/, y = ":not(.style-scope)", Ba = ",", z = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=[])+)/g, Ea = /[[.:#*]/, Z = ":host", ha = "::slotted", ab = new RegExp("^(" + ha + ")"), ra = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/, Sa = /(?:::slotted)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/, Da = /(.*):dir\((?:(ltr|rtl))\)/, U = ".", aa = ":", za = "class", Fa = "should_not_match", H = new M();
            E.prototype.c = function() {
                return this.j;
            };
            E.prototype._getStyleRules = E.prototype.c;
            var Ma = navigator.userAgent.match("Trident");
            rb.Object.defineProperties(Ha.prototype, {
                a: {
                    configurable: !0,
                    enumerable: !0,
                    get: function() {
                        return "x-scope";
                    }
                }
            });
            var ka = new Ha(), ma = {}, na = window.customElements;
            if (na && !x) {
                var Na = na.define;
                na.define = function(a, b, c) {
                    var d = document.createComment(" Shady DOM styles for " + a + " "), g = document.head;
                    g.insertBefore(d, (R ? R.nextSibling : null) || g.firstChild);
                    R = d;
                    ma[a] = d;
                    Na.call(na, a, b, c);
                };
            }
            Va.prototype.store = function(a, b, c, d) {
                var g = this.cache[a] || [];
                g.push({
                    i: b,
                    styleElement: c,
                    h: d
                });
                100 < g.length && g.shift();
                this.cache[a] = g;
            };
            if (!x) {
                var da = new MutationObserver(Xa), W = function(a) {
                    da.observe(a, {
                        childList: !0,
                        subtree: !0
                    });
                };
                if (window.customElements && !window.customElements.polyfillWrapFlushCallback) W(document); else {
                    var va = function() {
                        W(document.body);
                    };
                    window.HTMLImports ? window.HTMLImports.whenReady(va) : requestAnimationFrame(function() {
                        if ("loading" === document.readyState) {
                            var a = function() {
                                va();
                                document.removeEventListener("readystatechange", a);
                            };
                            document.addEventListener("readystatechange", a);
                        } else va();
                    });
                }
                Wa = function() {
                    Xa(da.takeRecords());
                };
            }
            var kb = Wa, ca = {}, Ya = Promise.resolve(), X = new Va();
            var G = r.prototype;
            G.flush = function() {
                kb();
            };
            G.G = function(a) {
                return v(a);
            };
            G.M = function(a) {
                return t(a);
            };
            G.prepareTemplate = function(a, b, c) {
                this.prepareTemplateDom(a, b);
                this.prepareTemplateStyles(a, b, c);
            };
            G.prepareTemplateStyles = function(a, b, d) {
                if (!a.s) {
                    a.s = !0;
                    a.name = b;
                    a.extends = d;
                    ca[b] = a;
                    for (var e = (e = a.content.querySelector("style")) ? e.getAttribute("css-build") || "" : "", g = [], f = a.content.querySelectorAll("style"), h = 0; h < f.length; h++) {
                        var k = f[h];
                        if (k.hasAttribute("shady-unscoped")) {
                            if (!x) {
                                var n = k.textContent;
                                $a.has(n) || ($a.add(n), n = k.cloneNode(!0), document.head.appendChild(n));
                                k.parentNode.removeChild(k);
                            }
                        } else g.push(k.textContent), k.parentNode.removeChild(k);
                    }
                    g = g.join("").trim();
                    d = {
                        is: b,
                        "extends": d,
                        N: e
                    };
                    La(this);
                    f = I.test(g) || sa.test(g);
                    I.lastIndex = 0;
                    sa.lastIndex = 0;
                    g = c(g);
                    f && F && this.a && this.a.transformRules(g, b);
                    a._styleAst = g;
                    a.w = e;
                    e = [];
                    F || (e = Ta(a._styleAst));
                    if (!e.length || F) g = x ? a.content : null, b = ma[b], f = ea(d, a._styleAst), 
                    b = f.length ? P(f, d.is, g, b) : void 0, a.a = b;
                    a.l = e;
                }
            };
            G.prepareTemplateDom = function(a, b) {
                x || a.c || (a.c = !0, N(a.content, b));
            };
            G.flushCustomStyles = function() {
                var a;
                La(this);
                if (this.b) {
                    var b = this.b.processStyles();
                    if (this.b.enqueued) {
                        if (F) for (var c = 0; c < b.length; c++) {
                            if ((a = this.b.getStyleForCustomStyle(b[c])) && F && this.a) {
                                var d = v(a);
                                La(this);
                                this.a.transformRules(d);
                                a.textContent = t(d);
                            }
                        } else for (qb(this, this.c, this.l), c = 0; c < b.length; c++) (a = this.b.getStyleForCustomStyle(b[c])) && ib(a, this.l.m);
                        this.b.enqueued = !1;
                        this.s && !F && this.styleDocument();
                    }
                }
            };
            G.styleElement = function(a, b) {
                var c = D(a).is, d = Q(a);
                if (!d) {
                    var e = D(a);
                    d = e.is;
                    e = e.u;
                    var g = ma[d];
                    if (d = ca[d]) {
                        var f = d._styleAst;
                        var h = d.l;
                    }
                    f = new E(f, g, h, e);
                    d = a.__styleInfo = f;
                }
                a !== this.c && (this.s = !0);
                b && (d.o = d.o || {}, Object.assign(d.o, b));
                if (F) {
                    if (d.o) {
                        b = d.o;
                        for (var n in b) null === n ? a.style.removeProperty(n) : a.style.setProperty(n, b[n]);
                    }
                    if (((n = ca[c]) || a === this.c) && n && n.a && n._applyShimCurrentVersion !== n._applyShimNextVersion) {
                        if (n._applyShimCurrentVersion === n._applyShimNextVersion || n._applyShimValidatingVersion !== n._applyShimNextVersion) La(this), 
                        this.a && this.a.transformRules(n._styleAst, c), n.a.textContent = ea(a, d.j), jb(n);
                        x && (c = a.shadowRoot) && (c.querySelector("style").textContent = ea(a, d.j));
                        d.j = n._styleAst;
                    }
                } else if (this.flush(), qb(this, a, d), d.A && d.A.length) {
                    c = d;
                    n = D(a).is;
                    a: {
                        if (b = X.cache[n]) for (f = b.length - 1; 0 <= f; f--) {
                            h = b[f];
                            b: {
                                d = c.A;
                                for (e = 0; e < d.length; e++) if (g = d[e], h.i[g] !== c.m[g]) {
                                    d = !1;
                                    break b;
                                }
                                d = !0;
                            }
                            if (d) {
                                b = h;
                                break a;
                            }
                        }
                        b = void 0;
                    }
                    d = b ? b.styleElement : null;
                    f = c.h;
                    (h = b && b.h) || (h = this.w[n] = (this.w[n] || 0) + 1, h = n + "-" + h);
                    c.h = h;
                    h = c.h;
                    e = ka;
                    e = d ? d.textContent || "" : eb(e, a, c.m, h);
                    g = Q(a);
                    var k = g.a;
                    k && !x && k !== d && (k._useCount--, 0 >= k._useCount && k.parentNode && k.parentNode.removeChild(k));
                    x ? g.a ? (g.a.textContent = e, d = g.a) : e && (d = P(e, h, a.shadowRoot, g.b)) : d ? d.parentNode || (Ma && -1 < e.indexOf("@media") && (d.textContent = e), 
                    u(d, null, g.b)) : e && (d = P(e, h, null, g.b));
                    d && (d._useCount = d._useCount || 0, g.a != d && d._useCount++, g.a = d);
                    h = d;
                    x || (d = c.h, g = e = a.getAttribute("class") || "", f && (g = e.replace(new RegExp("\\s*x-scope\\s*" + f + "\\s*", "g"), " ")), 
                    g += (g ? " " : "") + "x-scope " + d, e !== g && L(a, g));
                    b || X.store(n, c.m, h, c.h);
                }
            };
            G.styleDocument = function(a) {
                this.styleSubtree(this.c, a);
            };
            G.styleSubtree = function(a, b) {
                var c = a.shadowRoot;
                (c || a === this.c) && this.styleElement(a, b);
                if (b = c && (c.children || c.childNodes)) for (a = 0; a < b.length; a++) this.styleSubtree(b[a]); else if (a = a.children || a.childNodes) for (b = 0; b < a.length; b++) this.styleSubtree(a[b]);
            };
            G.C = function(a) {
                var b = this, c = v(a);
                w(c, function(a) {
                    if (x) ":root" === a.selector && (a.selector = "html"); else {
                        var c = H;
                        a.selector = a.parsedSelector;
                        ":root" === a.selector && (a.selector = "html");
                        a.selector = a.g = V(c, a, c.c, void 0, void 0);
                    }
                    F && (La(b), b.a && b.a.transformRule(a));
                });
                F ? a.textContent = t(c) : this.l.j.rules.push(c);
            };
            G.getComputedStyleValue = function(a, b) {
                var c;
                F || (c = (Q(a) || Q(Za(this, a))).m[b]);
                return (c = c || window.getComputedStyle(a).getPropertyValue(b)) ? c.trim() : "";
            };
            G.L = function(a, b) {
                var c = a.getRootNode();
                b = b ? b.split(/\s/) : [];
                c = c.host && c.host.localName;
                if (!c) {
                    var d = a.getAttribute("class");
                    if (d) {
                        d = d.split(/\s/);
                        for (var e = 0; e < d.length; e++) if (d[e] === H.a) {
                            c = d[e + 1];
                            break;
                        }
                    }
                }
                c && b.push(H.a, c);
                F || (c = Q(a)) && c.h && b.push(ka.a, c.h);
                L(a, b.join(" "));
            };
            G.D = function(a) {
                return Q(a);
            };
            r.prototype.flush = r.prototype.flush;
            r.prototype.prepareTemplate = r.prototype.prepareTemplate;
            r.prototype.styleElement = r.prototype.styleElement;
            r.prototype.styleDocument = r.prototype.styleDocument;
            r.prototype.styleSubtree = r.prototype.styleSubtree;
            r.prototype.getComputedStyleValue = r.prototype.getComputedStyleValue;
            r.prototype.setElementClass = r.prototype.L;
            r.prototype._styleInfoForNode = r.prototype.D;
            r.prototype.transformCustomStyleForDocument = r.prototype.C;
            r.prototype.getStyleAst = r.prototype.G;
            r.prototype.styleAstToString = r.prototype.M;
            r.prototype.flushCustomStyles = r.prototype.flushCustomStyles;
            Object.defineProperties(r.prototype, {
                nativeShadow: {
                    get: function() {
                        return x;
                    }
                },
                nativeCss: {
                    get: function() {
                        return F;
                    }
                }
            });
            var A = new r(), S, Y;
            window.ShadyCSS && (S = window.ShadyCSS.ApplyShim, Y = window.ShadyCSS.CustomStyleInterface);
            window.ShadyCSS = {
                ScopingShim: A,
                prepareTemplate: function(a, b, c) {
                    A.flushCustomStyles();
                    A.prepareTemplate(a, b, c);
                },
                prepareTemplateDom: function(a, b) {
                    A.prepareTemplateDom(a, b);
                },
                prepareTemplateStyles: function(a, b, c) {
                    A.flushCustomStyles();
                    A.prepareTemplateStyles(a, b, c);
                },
                styleSubtree: function(a, b) {
                    A.flushCustomStyles();
                    A.styleSubtree(a, b);
                },
                styleElement: function(a) {
                    A.flushCustomStyles();
                    A.styleElement(a);
                },
                styleDocument: function(a) {
                    A.flushCustomStyles();
                    A.styleDocument(a);
                },
                flushCustomStyles: function() {
                    A.flushCustomStyles();
                },
                getComputedStyleValue: function(a, b) {
                    return A.getComputedStyleValue(a, b);
                },
                nativeCss: F,
                nativeShadow: x
            };
            S && (window.ShadyCSS.ApplyShim = S);
            Y && (window.ShadyCSS.CustomStyleInterface = Y);
        }).call(this);
    }).call(c, a(13));
}, function(d, c, a) {
    a.d(c, "a", function() {
        return b;
    });
    a.d(c, "c", function() {
        return f;
    });
    a.d(c, "d", function() {
        return e;
    });
    a.d(c, "b", function() {
        return h;
    });
    var b = {
        queryInput: {
            event: {
                name: "",
                languageCode: ""
            }
        }
    }, e = {
        queryInput: {
            text: {
                text: "",
                languageCode: ""
            }
        }
    }, f = {
        type: "",
        element: "",
        isBot: ""
    }, h = {
        error: {
            code: "",
            message: "",
            status: ""
        }
    };
}, function(d, c, a) {
    var b = a(16), e = a(0), f = a(2), h = a(4), k = a(1), l = a(18), m = a(19), t = a(20), v = a(21), w = a(22), P = a(24), u = a(9), q = a(25);
    d = function() {};
    d.prototype.processResponse = function(a) {
        var b = Object(k.a)("#" + e.f, Object(f.c)().shadowRoot);
        Object(k.g)(b);
        Object(k.d)(Object(f.d)(), e.X, {
            response: JSON.parse(a)
        });
        this.constructResponseForRendering(a, Object(f.a)());
    };
    d.prototype.constructResponseForRendering = function(a, b) {
        var c = this;
        a = a ? JSON.parse(a) : null;
        !a && a.queryResult.fulfillmentMessages && 0 == a.queryResult.fullfillmentMessages.length || a.queryResult.fulfillmentMessages.forEach(function(a) {
            a && (c.checkForTextResponseAndRender_(a), c.checkForRichElementsAndRender_(a));
        });
    };
    d.prototype.checkForTextResponseAndRender_ = function(a) {
        this.responseContainsTextMessage_(a) && this.constructTextResponse_(a.text.text, Object(f.a)());
    };
    d.prototype.checkForRichElementsAndRender_ = function(a) {
        var b = this;
        this.responseContainsRichContent_(a) && a.payload.richContent.forEach(function(a) {
            var c = a.filter(function(a) {
                return "chips" !== a.type;
            }).map(function(a) {
                return b.constructItemPayload(a);
            }).filter(function(a) {
                return void 0 != a && null != a;
            });
            a = a.filter(function(a) {
                return "chips" === a.type;
            }).map(function(a) {
                return b.constructChipsPayload_(a);
            });
            b.render_(b.constructCustomCard_(c));
            b.renderChips_(a);
        });
    };
    d.prototype.renderChips_ = function(a) {
        var b = this;
        a && a.forEach(function(a) {
            b.render_(a);
        });
    };
    d.prototype.render_ = function(a) {
        a && Object(f.a)().newMessage(a);
    };
    d.prototype.responseContainsTextMessage_ = function(a) {
        return !a.platform && a.text && a.text.text;
    };
    d.prototype.responseContainsRichContent_ = function(a) {
        return !a.platform && a.payload && a.payload.richContent;
    };
    d.prototype.constructCustomCard_ = function(a) {
        if (0 == a.length) return null;
        var b = new m.a();
        b.classList.add("bot-animation");
        b.elements = a;
        return {
            element: b,
            isBot: !0,
            type: "customCard"
        };
    };
    d.prototype.constructItemPayload = function(a) {
        switch (a.type) {
          case "info":
            return this.constructTitlePayload_(a);

          case "description":
            return this.constructDescPayload_(a);

          case "button":
            return this.constructButtonPayload_(a);

          case "image":
            return this.constructImagePayload_(a);

          case "list":
            return this.constructListPayload_(a);

          case "divider":
            return this.constructDivider_(a);

          case "accordion":
            return this.constructAccordionPayload_(a);

          case "chips":
            return this.constructChipsPayload_(a);

          default:
            console.error("DfMessenger: Could not render " + a.type);
        }
    };
    d.prototype.constructTitlePayload_ = function(a) {
        var b = new u.a();
        b.title = a.title ? a.title : "";
        b.subtitle = a.subtitle ? a.subtitle : "";
        b.imageData = a.image ? a.image : null;
        b.actionLink = a.actionLink ? a.actionLink : "";
        return {
            type: "info",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructDescPayload_ = function(a) {
        var b = new t.a();
        b.title = a.title ? a.title : "";
        b.text = a.text ? a.text : null;
        return {
            type: "description",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructImagePayload_ = function(a) {
        var b = new w.a();
        b.source = a.rawUrl ? a.rawUrl : "";
        b.accessibilityText = a.accessibilityText ? a.accessibilityText : "image";
        return {
            type: "image",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructTextResponse_ = function(a, b) {
        a.forEach(function(a) {
            if (a) {
                var c = Object.assign({}, h.c);
                a = Object(k.c)("div", [ "message", "bot-message", "bot-animation" ], a);
                c.isBot = !0;
                c.type = "text";
                c.element = a;
                b.newMessage(c);
            }
        });
    };
    d.prototype.constructButtonPayload_ = function(a) {
        var b = new l.a();
        b.text = a.text;
        b.link = a.link;
        b.iconColor = a.icon.color;
        b.iconType = a.icon.type;
        b.event = a.event;
        return {
            type: "button",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructListPayload_ = function(a) {
        var b = new P.a();
        b.title = a.title ? a.title : "";
        b.subtitle = a.subtitle ? a.subtitle : "";
        b.imageData = a.image ? a.image : null;
        b.event = a.event ? a.event : null;
        return {
            type: "list",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructAccordionPayload_ = function(a) {
        var c = new b.a();
        c.title = a.title;
        c.subtitle = a.subtitle;
        c.image = a.image;
        c.text = a.text;
        return {
            type: "accordion",
            isBot: !0,
            element: c
        };
    };
    d.prototype.constructChipsPayload_ = function(a) {
        var b = new q.a();
        b.chips = a.options;
        return {
            type: "chips",
            isBot: !0,
            element: b
        };
    };
    d.prototype.constructDivider_ = function(a) {
        return {
            type: "divider",
            isBot: !0,
            element: new v.a()
        };
    };
    c.a = d;
}, function(d, c, a) {
    function b(a) {
        Object(k.d)(Object(l.d)(), m.D, {
            error: a
        });
    }
    function e(a, b, c) {
        if (!c.requestBody) return c.userId && (a = f(c, a)), a;
        switch (b) {
          case "text":
            var d = c.requestBody(a.queryInput.text.text, m.N.text);
            d = h(c, d);
            break;

          case "event":
            d = c.requestBody(a.queryInput.event, m.N.event);
            d = h(c, d);
            break;

          default:
            console.error('DfMessenger: Invalid input type "' + b + '"');
        }
        return d;
    }
    function f(a, b) {
        b.queryParams ? b.queryParams.payload || (b.queryParams.payload = {}) : b.queryParams = {
            payload: {}
        };
        b.queryParams.payload.userId = a.userId;
        return b;
    }
    function h(a, b) {
        var c = b && b.queryInput && (b.queryInput.text || b.queryInput.event) ? !0 : !1;
        c ? a.userId && (b = f(a, b)) : (console.error("DfMessenger: Please return a valid request body."), 
        b = null);
        return b;
    }
    c.b = function(a, c, d) {
        var f = e(a, c, d);
        return new Promise(function(a, c) {
            var e = new XMLHttpRequest(), h = "";
            h = d.getAttribute(m.d) ? d.apiUri + "/" + d.projectId + "/sessions/" + d.sessionId : d.apiUri + "/" + d.projectId + "/agent/sessions/" + d.sessionId + ":detectIntent";
            e.open("POST", h, !0);
            e.setRequestHeader("Content-type", "application/json");
            null !== d.accessToken && "undefined" !== typeof d.accessToken && e.setRequestHeader("Authorization", "Bearer " + d.accessToken);
            f ? (Object(l.a)().newMessage(Object(l.a)().botWriting()), e.send(JSON.stringify(f)), 
            Object(k.d)(d, m.W, {
                requestBody: f
            })) : (h = Object.assign({}, t.b), h.error.message = "Please specify query input (text or event)", 
            b(h), c(h));
            e.onreadystatechange = function() {
                var d = e.responseText;
                d && d.indexOf && 0 === d.indexOf(m._5) && (d = d.substring(m._5.length));
                4 == e.readyState && 200 == e.status ? a(d) : 4 == e.readyState && 400 <= e.status && (d = d ? JSON.parse(d) : {}, 
                b(d), c(d));
            };
            e.onerror = function() {
                console.error("DfMessenger Request failed ", this.status + ": " + this.statusText);
            };
        });
    };
    c.a = function(a) {
        var b = Object.assign({}, t.d);
        b.queryInput.text.text = a || "";
        b.queryInput.text.languageCode = Object(l.d)().languageCode;
        return b;
    };
    var k = a(1), l = a(2), m = a(0), t = a(4);
}, function(d, c, a) {
    d = new Map([ [ "zh-TW", {
        askSomething: "開始提問...",
        chatTitle: "即時通訊",
        errorMessage: "發生錯誤，請再試一次",
        messageTooLong: "糟糕！你的訊息過長，已超出 numOfChars 個字元上限。"
    } ], [ "zh-CN", {
        askSomething: "输入问题…",
        chatTitle: "聊天",
        errorMessage: "出了点问题，请重试",
        messageTooLong: "哎呀！您的消息过长，超出上限 numOfChars 个字符。"
    } ], [ "zh-HK", {
        askSomething: "請輸入您的問題",
        chatTitle: "即時通訊",
        errorMessage: "發生錯誤，請再試一次",
        messageTooLong: "很抱歉，您的訊息超出了 numOfChars 個字元。"
    } ], [ "da", {
        askSomething: "Stil et spørgsmål...",
        chatTitle: "Chat",
        errorMessage: "Der opstod en fejl, prøv igen",
        messageTooLong: "Ups! Din besked fylder numOfChars tegn mere end det tilladte."
    } ], [ "nl", {
        askSomething: "Vraag iets...",
        chatTitle: "Chat",
        errorMessage: "Er is iets misgegaan. Probeer het opnieuw.",
        messageTooLong: "Uw bericht is numOfChars tekens te lang."
    } ], [ "fr", {
        askSomething: "Posez une question…",
        chatTitle: "Chat",
        errorMessage: "Une erreur s'est produite. Veuillez réessayer.",
        messageTooLong: "Petit problème… Votre message contient numOfChars caractère(s) de trop."
    } ], [ "de", {
        askSomething: "Frage eingeben",
        chatTitle: "Chat",
        errorMessage: "Ein Fehler ist aufgetreten. Bitte probieren Sie es noch einmal.",
        messageTooLong: "Hoppla! Ihre Nachricht ist numOfChars Zeichen zu lang."
    } ], [ "hi", {
        askSomething: "कुछ पूछें...",
        chatTitle: "चैट करें",
        errorMessage: "कुछ गड़बड़ी हुई है, कृपया फिर से कोशिश करें",
        messageTooLong: "ओह! आपके मैसेज में numOfChars वर्ण हैं जो बहुत ज़्यादा हैं."
    } ], [ "id", {
        askSomething: "Tanyakan Sesuatu...",
        chatTitle: "Chat",
        errorMessage: "Terjadi masalah, harap coba lagi",
        messageTooLong: "Maaf. Pesan Anda berisi numOfChars karakter yang terlalu panjang."
    } ], [ "it", {
        askSomething: "Poni una domanda…",
        chatTitle: "Chat",
        errorMessage: "Si è verificato un errore. Riprova",
        messageTooLong: "Spiacenti, il messaggio supera di numOfChars caratteri la lunghezza consentita."
    } ], [ "ja", {
        askSomething: "質問を入力...",
        chatTitle: "チャット",
        errorMessage: "エラーが発生しました。もう一度お試しください。",
        messageTooLong: "エラーが発生しました。メッセージの文字数上限を numOfChars 文字超えています。"
    } ], [ "ko", {
        askSomething: "질문을 입력하세요...",
        chatTitle: "채팅",
        errorMessage: "문제가 발생했습니다. 다시 시도해 보세요.",
        messageTooLong: "메시지가 너무 깁니다(numOfChars자 초과)."
    } ], [ "no", {
        askSomething: "Spør om noe …",
        chatTitle: "Chat",
        errorMessage: "Noe gikk galt – prøv på nytt",
        messageTooLong: "Beklager! Meldingen din er numOfChars tegn for lang."
    } ], [ "pt-BR", {
        askSomething: "Pergunte algo…",
        chatTitle: "Bate-papo",
        errorMessage: "Ocorreu um erro. Tente novamente.",
        messageTooLong: "Ops! Sua mensagem tem numOfChars caracteres a mais que o limite."
    } ], [ "pt-PT", {
        askSomething: "Pergunte algo…",
        chatTitle: "Chat",
        errorMessage: "Ocorreu um erro. Tente novamente mais tarde.",
        messageTooLong: "Ups! A sua mensagem tem numOfChars carateres a mais."
    } ], [ "ru", {
        askSomething: "Задайте вопрос",
        chatTitle: "Чат",
        errorMessage: "Произошла ошибка. Повторите попытку",
        messageTooLong: "Максимально допустимое число символов в сообщении превышено на numOfChars"
    } ], [ "es", {
        askSomething: "Haz una pregunta...",
        chatTitle: "Chat",
        errorMessage: "Se ha producido un error. Vuelve a intentarlo.",
        messageTooLong: "¡Vaya! Tu mensaje tiene numOfChars caracteres más de lo permitido."
    } ], [ "sv", {
        askSomething: "Fråga något …",
        chatTitle: "Chatt",
        errorMessage: "Något gick fel. Försök igen.",
        messageTooLong: "Hoppsan! Ditt meddelande är numOfChars tecken för långt."
    } ], [ "th", {
        askSomething: "ตั้งคำถาม...",
        chatTitle: "แชท",
        errorMessage: "มีข้อผิดพลาดเกิดขึ้น โปรดลองอีกครั้ง",
        messageTooLong: "อ๊ะ ข้อความของคุณยาวเกิน numOfChars อักขระ"
    } ], [ "uk", {
        askSomething: "Запитайте щось…",
        chatTitle: "Чат",
        errorMessage: "Сталася помилка. Повторіть спробу",
        messageTooLong: "Помилка. Ваше повідомлення довше на numOfChars симв."
    } ], [ "en", {
        askSomething: "Ask something...",
        chatTitle: "Chat",
        errorMessage: "Something went wrong, please try again.",
        messageTooLong: "Oops! Your message is numOfChars characters too long."
    } ] ]);
    c.a = d;
}, function(d, c, a) {
    function b() {
        return {
            ADD_ATTR: [ "target" ],
            FORBID_TAGS: [ "style" ]
        };
    }
    c.b = b;
    d = a(17)(window);
    d.setConfig(b());
    c.a = d;
}, function(d, c, a) {
    var b = a(0), e = a(1);
    d = a(3);
    a.n(d);
    var f = a(2), h = document.createElement("template");
    h.innerHTML = "\n  <style>\n    .image {\n      background-repeat: no-repeat;\n      background-size: contain;\n      margin-right: 24px;\n      max-height: 24px;\n      max-width: 24px;\n      padding-right: 24px;\n    }\n\n    .link-wrapper {\n      text-decoration: none;\n    }\n\n    .title {\n      color: black;\n      font-weight: bold;\n    }\n\n    .subtitle {\n      color: #757575;\n      padding-top: 8px;\n    }\n\n    .title-card-elements {\n      background-color: white;\n      border-radius: 8px;\n      display: flex;\n      font-family: 'Roboto', sans-serif;\n      font-size: 14px;\n      padding: 16px;\n    }\n  </style>\n";
    ShadyCSS.prepareTemplate(h, b.H);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(h.content.cloneNode(!0));
        this.render();
        this.listenForCardClick_();
    };
    a.prototype.render = function() {
        this.createOuterElement_();
        this.createImageElement_();
        this.createTitleElement_();
        this.createSubtitleElement_();
    };
    a.prototype.createOuterElement_ = function() {
        var a = this.actionLink ? this.wrapCardWithLinkWrapper_() : this.createContentWrapperElement_();
        this.shadowRoot.appendChild(a);
    };
    a.prototype.createContentWrapperElement_ = function() {
        if (this.title || this.subtitle || this.imageData) return Object(e.c)("div", [ b._1 ]);
    };
    a.prototype.createImageElement_ = function() {
        if (this.imageData && this.imageData.src && this.imageData.src.rawUrl) {
            var a = Object(e.c)("div", [ "image" ], null, {
                style: 'background-image: url("' + this.imageData.src.rawUrl + '")'
            });
            Object(e.a)("." + b._1, this.shadowRoot).appendChild(a);
        }
    };
    a.prototype.createTitleElement_ = function() {
        if (this.title) {
            this.createTextContainer_();
            var a = Object(e.c)("div", [ "title" ], this.title);
            Object(e.a)(".text-container", this.shadowRoot).appendChild(a);
        }
    };
    a.prototype.createSubtitleElement_ = function() {
        if (this.subtitle) {
            this.textContainerExists_() || this.createTextContainer_();
            var a = Object(e.c)("div", [ "subtitle" ], this.subtitle);
            Object(e.a)(".text-container", this.shadowRoot).appendChild(a);
        }
    };
    a.prototype.textContainerExists_ = function() {
        return Object(e.a)(".text-container", this.shadowRoot);
    };
    a.prototype.createTextContainer_ = function() {
        Object(e.a)("." + b._1, this.shadowRoot).appendChild(Object(e.c)("div", [ "text-container" ]));
    };
    a.prototype.createLinkWrapper_ = function() {
        return Object(e.c)("a", [ b.Q ], "", {
            href: this.actionLink,
            target: "_blank"
        });
    };
    a.prototype.wrapCardWithLinkWrapper_ = function() {
        var a = this.createContentWrapperElement_(), b = this.createLinkWrapper_();
        b.appendChild(a);
        return b;
    };
    a.prototype.listenForCardClick_ = function() {
        var a = this;
        this.actionLink && Object(e.a)("." + b.Q, this.shadowRoot).addEventListener("click", function(c) {
            Object(e.d)(Object(f.d)(), b.M, {
                element: a
            });
        });
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        title: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.title_;
            },
            set: function(a) {
                this.title_ = a;
            }
        },
        subtitle: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.subtitle_;
            },
            set: function(a) {
                this.subtitle_ = a;
            }
        },
        imageData: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.imageData_;
            },
            set: function(a) {
                this.imageData_ = a;
            }
        },
        actionLink: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.actionLink_;
            },
            set: function(a) {
                this.actionLink_ = a;
            }
        }
    });
    c.a = a;
    customElements.define(b.H, a);
}, function(d, c, a) {
    Object.defineProperty(c, "__esModule", {
        value: !0
    });
    a(11);
    var b = a(0), e = a(2), f = a(4), h = a(5), k = a(6), l = a(26), m = a(1);
    d = a(3);
    a.n(d);
    d = a(27);
    a.n(d);
    var t = a(0), v = !1, w = document.createElement("template");
    w.innerHTML = '\n  <style>\n    /*\n     * Using a wrapper since styling with :host is not compatible\n     * with Firefox, IE and Edge.\n     */\n    .df-messenger-wrapper {\n      background-color: white;\n      border: 0;\n      bottom: 20px;\n      color: rgba(0,0,0,0.87);\n      font-family: \'Roboto\', sans-serif;\n      font-size: 14px;\n      font-weight: normal;\n      margin: 0;\n      padding: 0;\n      position: fixed;\n      right: 20px;\n      text-decoration: none;\n      z-index: 100;\n    }\n\n    .df-messenger-wrapper a,\n    .df-messenger-wrapper button {\n      cursor: pointer;\n    }\n\n    .df-messenger-wrapper svg {\n      fill: rgba(0,0,0,0.87);\n      margin: 0;\n      padding: 0;\n    }\n\n    .df-messenger-wrapper img {\n      border: 0;\n      margin: 0;\n      padding: 0;\n    }\n\n    button#widgetIcon {\n      background: #42A5F5;\n      background: var(--df-messenger-button-titlebar-color);\n      border: none;\n      border-radius: 50%;\n      bottom: 0px;\n      box-shadow: rgba(0, 0, 0, 0.24) 1px 4px 15px 0px;\n      cursor: pointer;\n      height: 56px;\n      position: absolute;\n      right: 0px;\n      width: 56px;\n    }\n\n    button#widgetIcon:focus {\n      outline-width: 0;\n    }\n\n    button#widgetIcon .df-chat-icon {\n      height: 36px;\n      left: 10px;\n      opacity: 1;\n      position: absolute;\n      top: 10px;\n      transition: opacity 0.5s;\n      width: 36px;\n    }\n\n    button#widgetIcon .df-chat-icon.hidden {\n      opacity: 0;\n    }\n\n    button#widgetIcon div.rotate-fade #closeSvg {\n      opacity: 1;\n      transform: rotate(-90deg);\n    }\n\n    button#widgetIcon div #closeSvg {\n      fill: white;\n      fill: var(--df-messenger-button-titlebar-font-color);\n      left: 15px;\n      opacity: 0;\n      position: absolute;\n      top: 15px;\n      transition: transform 0.5s, opacity 0.5s;\n    }\n\n    button#widgetIcon .df-chat-icon.default {\n      display: none;\n    }\n\n    button#widgetIcon .df-chat-icon.default.show {\n      display: initial;\n    }\n\n    @media screen and (max-width: 500px) {\n      .expanded > #widgetIcon {\n        visibility: hidden;\n      }\n    }\n\n    @media screen and (min-width: 501px) {\n      .expanded > #widgetIcon {\n        visibility: visible;\n      }\n    }\n  </style>\n  <div class="df-messenger-wrapper">\n    <df-messenger-chat></df-messenger-chat>\n    <button id="widgetIcon">\n      <div class="df-chat-icon default">\n        <svg height="36px" width="36px" xmlns="http://www.w3.org/2000/svg"\n            xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="11999 18083 41 52">\n          <defs>\n            <style>\n              .cls-1 {\n                clip-path: url(#clip-path);\n              }\n\n              .cls-2 {\n                fill: #ef6c00;\n              }\n\n              .cls-3 {\n                fill: #ff9800;\n              }\n\n              .cls-4 {\n                fill: #bf360c;\n              }\n\n              .cls-4, .cls-5 {\n                opacity: 0.1;\n              }\n\n              .cls-5 {\n                fill: #fff;\n              }\n            </style>\n            <clipPath id="clip-path">\n              <path id="Path_1082" data-name="Path 1082"\n                  d="M39.217,10.27,22.275.48a3.559,3.559,0,0,0-3.554,0L1.779,\n                  10.27A3.572,3.572,0,0,0,.01,13.357v19.6a3.569,3.569,0,0,0,\n                  1.769,3.079l8.479,4.907v10a1.064,1.064,0,0,0,1.071,1.064,\n                  1.013,1.013,0,0,0,.527-.146L39.241,36.041a3.532,3.532,0,0,0,\n                  1.769-3.079v-19.6A3.575,3.575,0,0,0,39.217,10.27Z"\n                  transform="translate(0 0)"/>\n            </clipPath>\n          </defs>\n          <g id="Group_1192" data-name="Group 1192" class="cls-1"\n              transform="translate(11998.99 18082.994)">\n            <path id="Path_1078" data-name="Path 1078" class="cls-2"\n                d="M0,13.91V37.6l10.248,5.923V55.377L40.984,\n                37.6V13.91L20.5,25.755Z"\n                transform="translate(0.002 -2.608)"/>\n            <path id="Path_1079" data-name="Path 1079" class="cls-3"\n                d="M0,11.175,20.5-.67,40.984,11.175,20.5,23.021Z"\n                transform="translate(0.002 0.127)"/>\n            <path id="Path_1080" data-name="Path 1080" class="cls-4"\n                d="M40.5,13.56,20.139,25.332.13,13.763,\n                0,13.844,20.5,25.69,40.984,13.844Z"\n                transform="translate(0.002 -2.542)"/>\n            <path id="Path_1081" data-name="Path 1081" class="cls-5"\n                d="M20.5,25.772.13,14,0,14.073,20.5,25.918Z"\n                transform="translate(0.002 -2.625)"/>\n          </g>\n        </svg>\n      </div>\n      <div id="closeIcon">\n        <svg id="closeSvg" height="24"\n            viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59\n              12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>\n          <path d="M0 0h24v24H0z" fill="none"/>\n        </svg>\n      </div>\n    </button>\n  </div>';
    ShadyCSS.prepareTemplate(w, b.B);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        var a = this;
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(w.content.cloneNode(!0));
        0 < this.missingAttributes_().length && console.error("DfMessenger: The widget is missing the following attributes: " + this.missingAttributes_());
        this.intent && null === this.waitOpen && this.initializeDFMessenger_();
        this.setChatIcon_(this.chatIcon);
        this.handleFailedRequests_();
        this.performButtonClickActions_();
        var c = Object(m.c)("link", [], null, {
            href: "https://fonts.googleapis.com/icon?family=Material+Icons",
            rel: "stylesheet"
        }), d = Object(m.c)("link", [], null, {
            href: "https://fonts.googleapis.com/css?family=Roboto",
            rel: "stylesheet"
        });
        document.head.appendChild(c);
        document.head.appendChild(d);
        setTimeout(function() {
            Object(m.d)(a, b.E, {});
        });
    };
    a.prototype.attributeChangedCallback = function(a, c, d) {
        switch (a) {
          case b.L:
            this.expandChanged_(d);
        }
    };
    a.prototype.showMinChat = function() {
        return this.addMinChatView_();
    };
    a.prototype.renderCustomText = function(a) {
        new h.a().checkForTextResponseAndRender_({
            text: {
                text: [ a ]
            }
        });
    };
    a.prototype.renderCustomCard = function(a) {
        new h.a().checkForRichElementsAndRender_({
            payload: {
                richContent: [ a ]
            }
        });
    };
    a.prototype.isWelcomeFired_ = function() {
        return v;
    };
    a.prototype.initializeDFMessenger_ = function() {
        var a = this;
        var c = Object.assign({}, f.a);
        c.queryInput.event.name = this.intent;
        c.queryInput.event.languageCode = this.languageCode;
        Object(k.b)(c, b.N.event, this).then(function(b) {
            new h.a().processResponse(b);
            null !== a.expand || a.isSmallScreen_() || a.addMinChatView_();
            v = !0;
        }, function(a) {
            console.error("DfMessenger Request failed ", a.error.code + ": " + a.error.message);
        });
    };
    a.prototype.addMinChatView_ = function() {
        Object(e.b)().classList.add(b.j);
        Object(m.a)("." + b.T, Object(e.c)().shadowRoot).classList.add(b.S);
        this.setAttribute(b.L, "");
    };
    a.prototype.missingAttributes_ = function() {
        var a = [];
        this.sessionId || (this.sessionId = this.generateSessionId_());
        this.projectId || a.push(b.V);
        this.languageCode || a.push(b.P);
        this.apiUri || (this.getAttribute(b.d) ? this.apiUri = "https://dialogflow.cloud.google.com/v1/integrations/messenger/webhook" : this.apiUri = "https://dialogflow.googleapis.com/v2/projects");
        return a;
    };
    a.prototype.toggleExpandAttribute_ = function() {
        this.hasAttribute(b.L) ? this.removeAttribute(b.L) : this.setAttribute(b.L, "");
    };
    a.prototype.expandChanged_ = function(a) {
        var c = this;
        return $jscomp.executeAsyncGenerator(function() {
            function d(d, k) {
                for (;;) switch (e) {
                  case 0:
                    return e = 1, {
                        value: c.waitForShadowroot(),
                        done: !1
                    };

                  case 1:
                    if (void 0 === k) {
                        e = 2;
                        break;
                    }
                    e = -1;
                    throw k;

                  case 2:
                    f = h = d, void 0 !== a && null !== a ? (c.chatIsMinimized_() ? Object(m.d)(c, t.k, {}) : (Object(m.a)("#" + b.p, f).classList.add("rotate-fade"), 
                    Object(m.a)("." + b.u, f).classList.add("hidden"), v || null === c.waitOpen || null === c.intent || c.initializeDFMessenger_(), 
                    Object(m.d)(c, b.l, {})), c.showChat_(), Object(m.a)(".df-messenger-wrapper", c.shadowRoot).classList.add("expanded")) : (Object(m.a)("#" + b.p, f).classList.remove("rotate-fade"), 
                    Object(m.a)("." + b.u, f).classList.remove("hidden"), c.hideChat_(), Object(m.d)(c, t.h, {}), 
                    Object(m.a)(".df-messenger-wrapper", c.shadowRoot).classList.remove("expanded")), 
                    e = -1;

                  default:
                    return {
                        value: void 0,
                        done: !0
                    };
                }
            }
            var e = 0, f, h, k = {
                next: function(a) {
                    return d(a, void 0);
                },
                "throw": function(a) {
                    return d(void 0, a);
                },
                "return": function(a) {
                    throw Error("Not yet implemented");
                }
            };
            $jscomp.initSymbolIterator();
            k[Symbol.iterator] = function() {
                return this;
            };
            return k;
        }());
    };
    a.prototype.chatIsMinimized_ = function() {
        return Object(e.b)().classList.contains(b.j);
    };
    a.prototype.showChat_ = function() {
        Object(e.b)().setAttribute("style", "visibility:visible");
        Object(e.b)().setAttribute("opened", "true");
    };
    a.prototype.hideChat_ = function() {
        Object(e.b)().setAttribute("opened", "false");
    };
    a.prototype.waitForShadowroot = function() {
        var a = this;
        return new Promise(function(b) {
            setTimeout(function() {
                b(a.shadowRoot);
            }, 0);
        });
    };
    a.prototype.rendererForTesting = function(a, b) {
        var c = new h.a();
        "text" === a ? c.constructTextResponse_(b, Object(e.a)()) : ("chips" === a ? c = c.constructChipsPayload_(b) : (b.type = a, 
        a = c.constructItemPayload(b), c = c.constructCustomCard_([ a ])), Object(e.a)().newMessage(c));
    };
    a.prototype.payloadForTesting = function(a) {
        switch (a) {
          case "info":
            return Object.assign({}, l.f);

          case "description":
            return Object.assign({}, l.d);

          case "image":
            return Object.assign({}, l.e);

          case "list":
            return Object.assign({}, l.g);

          case "button":
            return Object.assign({}, l.b);

          case "accordion":
            return Object.assign({}, l.a);

          case "chips":
            return Object.assign({}, l.c);

          case "text":
            return [];

          default:
            console.error("Could not find a payload for " + a);
        }
    };
    a.prototype.handleFailedRequests_ = function() {
        var a = this;
        this.addEventListener(b.D, function() {
            var c = Object(e.c)().shadowRoot, d = Object(m.a)("." + b.K, c);
            d.innerHTML = Object(m.e)(a.languageCode, "errorMessage");
            d.classList.add(b.Z);
            setTimeout(function() {
                d.classList.remove(b.Z);
                a.stopBotTyping_();
            }, 5e3);
        });
    };
    a.prototype.stopBotTyping_ = function() {
        var a = Object(m.a)("#" + b.f, Object(e.c)().shadowRoot);
        a && Object(m.g)(a);
    };
    a.prototype.isSmallScreen_ = function() {
        return window.matchMedia("(max-width:500px)").matches;
    };
    a.prototype.performButtonClickActions_ = function() {
        var a = this;
        this.shadowRoot.querySelector("button").addEventListener("click", function() {
            a.toggleExpandAttribute_();
        });
    };
    a.prototype.sendEvent = function(a) {
        a.queryInput && a.queryInput.event ? Object(k.b)(a, b.N.event, this).then(function(a) {
            new h.a().processResponse(a);
        }, function(a) {
            console.error("DfMessenger Request failed ", a.error.code + ": " + a.error.message);
        }) : console.error("DfMessenger: Please enter a valid query input for the event");
    };
    a.prototype.setChatIcon_ = function(a) {
        if (a) {
            var c = Object(m.c)("img", [ b.u ]);
            Object(m.f)(this, a, c, this.onLoad, this.onError);
        } else this.setDefaultIcon_();
    };
    a.prototype.onLoad = function(a, b, c) {
        b.src = c;
        a = Object(m.a)("#widgetIcon", Object(e.d)().shadowRoot);
        a.insertBefore(b, a.firstChild);
    };
    a.prototype.onError = function(a, b, c) {
        Object(e.d)().setDefaultIcon_();
    };
    a.prototype.setDefaultIcon_ = function() {
        Object(e.d)().shadowRoot.querySelector("div." + b.u).classList.add("show");
    };
    a.prototype.generateSessionId_ = function() {
        return "dfMessenger-" + Math.floor(1e8 * Math.random());
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        apiUri: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.e, a);
            },
            get: function() {
                return this.getAttribute(b.e);
            }
        },
        projectId: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.V, a);
            },
            get: function() {
                return this.getAttribute(b.d) ? this.getAttribute(b.d) : this.getAttribute(b.V);
            }
        },
        languageCode: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.P, a);
            },
            get: function() {
                return this.getAttribute(b.P);
            }
        },
        sessionId: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.Y, a);
            },
            get: function() {
                return this.getAttribute(b.Y);
            }
        },
        expand: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.L, a);
            },
            get: function() {
                return this.getAttribute(b.L);
            }
        },
        accessToken: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.a, a);
            },
            get: function() {
                return this.getAttribute(b.a);
            }
        },
        intent: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.O, a);
            },
            get: function() {
                return this.getAttribute(b.O);
            }
        },
        chatIcon: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.i, a);
            },
            get: function() {
                return this.getAttribute(b.i);
            }
        },
        chatTitle: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b.m, a);
            },
            get: function() {
                return this.getAttribute(b.m);
            }
        },
        userId: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                a && this.setAttribute(b._2, a);
            },
            get: function() {
                return this.getAttribute(b._2);
            }
        },
        waitOpen: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.getAttribute(b._4);
            },
            set: function(a) {
                a && this.setAttribute(b._4, a);
            }
        }
    });
    $jscomp.global.Object.defineProperties(a, {
        observedAttributes: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return [ b.L ];
            }
        }
    });
    customElements.define(b.B, a);
}, function(d, c, a) {
    a(12);
    a(14);
    a(15);
    var b = a(0), e = a(4), f = a(1);
    d = a(3);
    a.n(d);
    var h = document.createElement("template");
    h.innerHTML = '\n  <style>\n    div.chat-wrapper {\n      background-color: #e5e5e5;\n      border-radius: 4px;\n      bottom: 105px;\n      box-shadow: rgba(0, 0, 0, 0.24) 1px 4px 15px 0px;\n      display: flex;\n      flex-direction: column;\n      height: 0;\n      opacity: 0;\n      position: fixed;\n      right: 20px;\n      transform: translateX(25%) translateY(35%) scale(0.5, 0.5);\n      transition: transform 0.2s ease, opacity 0.2s ease-in, height 0s ease 0.2s;\n      width: 370px;\n      overflow: hidden;\n    }\n\n    div.chat-min {\n      background-color: #fafafa;\n      bottom: 20px;\n      height: 0;\n      max-width: 370px;\n      right: 100px;\n      width: auto;\n    }\n    \n    div.chat-wrapper.chat-min[opened="true"] {\n      height: auto;\n    }\n    \n    div.chat-wrapper[opened="true"] {\n     height: 560px;\n      opacity: 1;\n      transform: translate3d(0px, 0px, 0px) scale(1, 1);\n      transition: transform 0.2s ease, opacity 0.2s ease-in;\n    }\n\n\n    div.chat-min df-message-list {\n      background-color: #fafafa;\n      background-color: var(--df-messenger-chat-background-color);\n    }\n\n    div.chat-min df-messenger-titlebar {\n      display: none;\n    }\n\n    div.chat-min df-messenger-user-input {\n      display: none;\n    }\n\n    df-message-list {\n      background-color: #fafafa;\n      background-color: var(--df-messenger-chat-background-color);\n      display: flex;\n      flex-direction: column;\n      flex: 1 1 auto;\n      min-height: 0;\n      min-width: 250px;\n    }\n\n    df-messenger-titlebar {\n      z-index: 2;\n    }\n\n    @media screen and (max-width: 500px) {\n      div.chat-wrapper {\n        bottom: 0;       \n        right: 0;\n        width: 100%;\n      }\n      div.chat-wrapper[opened="true"] {       \n        height: 100%;      \n      }\n\n    }\n  </style>\n  <div class="chat-wrapper">\n    <df-messenger-titlebar></df-messenger-titlebar>\n    <df-message-list></df-message-list>\n    <df-messenger-user-input></df-messenger-user-input>\n  </div>\n';
    ShadyCSS.prepareTemplate(h, b.C);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        var a = this.attachShadow({
            mode: "open"
        });
        a.appendChild(h.content.cloneNode(!0));
        this.messageList = Object(f.a)(b.A, a);
    };
    a.prototype.newMessage = function(a) {
        this.messageList.add(a);
    };
    a.prototype.botWriting = function() {
        var a = Object.assign(e.c, {});
        a.type = "text";
        a.isBot = !0;
        a.element = Object(f.c)("div", [ "bot-animation", "message", "bot-message" ], "..");
        a.element.id = b.f;
        return a;
    };
    customElements.define(b.C, a);
}, function(d, c, a) {
    var b = a(0), e = a(2), f = a(1);
    d = a(3);
    a.n(d);
    var h = document.createElement("template");
    h.innerHTML = '\n  <style>\n    .message-list-wrapper.minimized {\n      flex-direction: row;\n    }\n\n    .message-list-wrapper.minimized #messageList {\n      overflow-y: hidden;\n    }\n\n    .message-list-wrapper.minimized #messageList .message {\n      cursor: pointer;\n      margin: 0;\n    }\n\n    .minimized #messageList > :not(:first-child) {\n      display: none;\n    }\n\n    .message-list-wrapper #dismissIcon {\n      display: none;\n    }\n\n    .message-list-wrapper.minimized #dismissIcon {\n      align-self: flex-start;\n      cursor: pointer;\n      display: initial;\n      fill: rgba(0,0,0,0.87);\n      fill: var(--df-messenger-minimized-chat-close-icon-color);\n      flex: 0 0 auto;\n      padding: 10px;\n    }\n\n    .message-list-wrapper {\n      display: flex;\n      flex-direction: column;\n      flex: 1 1 auto;\n      min-height: 0;\n    }\n\n    #messageList {\n      display: flex;\n      flex-direction: column;\n      flex: 1 1;\n      overflow-x: hidden;\n      overflow-y: scroll;\n      padding: 10px;\n    }\n\n    #messageList #typing {\n      font-size: 14px;\n    }\n\n    #messageList .message {\n      background: white;\n      border: 1px solid #e0e0e0;\n      border-radius: 20px;\n      color: rgba(0,0,0,0.87);\n      color: var(--df-messenger-font-color);\n      flex: 0 0 auto;\n      font-family: \'Roboto\', sans-serif;\n      font-size: 14px;\n      margin-top: 10px;\n      max-width: calc(100% - 28px);\n      padding: 7px 16px;\n      word-break: break-word;\n      word-wrap: break-word;\n    }\n\n    #messageList .bot-animation {\n      animation: present-yourself 0.3s ease 0.1s forwards;\n      opacity: 0;\n    }\n\n    #messageList .user-animation {\n      animation: present-yourself 0.3s ease 0.1s forwards;\n      opacity: 0;\n    }\n\n    #messageList > :first-child {\n      margin-top: auto !important;\n    }\n\n    #messageList .message.bot-message {\n      align-self: flex-start;\n      background-color: #E1F5FE;\n      background-color: var(--df-messenger-bot-message);\n      margin-right: 75px;\n      line-height: 1.4;\n    }\n\n    #messageList .message.user-message {\n      align-self: flex-end;\n      background-color: #eeeeee;\n      background-color: var(--df-messenger-user-message);\n      margin-left: 75px;\n    }\n\n    #typing:after {\n      content: ".";\n      animation: fade_pulse 1s linear infinite;\n    }\n\n    .minimized .error {\n      display: none;\n    }\n\n    .error {\n      align-items: center;\n      align-self: center;\n      background-color: black;\n      box-shadow: 1px 4px 15px 0 rgba(0, 0, 0, 0.24);\n      color: white;\n      display: flex;\n      font-family: \'Roboto\', sans-serif;\n      font-size: 12px;\n      justify-content: center;\n      margin-top: 0;\n      opacity: 0;\n      padding: 10px;\n      position: absolute;\n      transition: transform 0.2s, opacity 0.2s;\n      transform: translateY(-100%);\n      width: 95%;\n      z-index: 1;\n    }\n\n    .error.show {\n      opacity: 0.8;\n      transform: translateY(0);\n    }\n\n    df-card {\n      background-color: white;\n      border: 1px solid #e0e0e0;\n      border-radius: 8px;\n      box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.24);\n      margin-top: 10px;\n    }\n\n    @keyframes fade_pulse {\n      0% {opacity: 1;}\n      50% {opacity: 0.4;}\n      100% {opacity: 1;}\n    }\n\n    @keyframes present-yourself {\n      to {\n        opacity: 1;\n      }\n    }\n  </style>\n  <div class="message-list-wrapper">\n    <div class="error"></div>\n    <div id="messageList">\n    </div>\n    <div id="dismissIcon">\n      <svg height="24" viewBox="0 0 24 24"\n          width="24" xmlns="http://www.w3.org/2000/svg">\n        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41\n          10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>\n        <path d="M0 0h24v24H0z" fill="none"/>\n      </svg>\n    </div>\n  </div>';
    ShadyCSS.prepareTemplate(h, b.A);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        var a = this;
        ShadyCSS.styleElement(this);
        var c = this.attachShadow({
            mode: "open"
        });
        c.appendChild(h.content.cloneNode(!0));
        this.messageList = Object(f.a)("#messageList", c);
        Object(f.a)("#" + b.J, c).addEventListener("click", function(c) {
            a.maximizeChat_();
            Object(e.b)().setAttribute("style", "visibility:hidden");
            Object(e.d)().removeAttribute(b.L);
        });
        Object(f.a)("#messageList", c).addEventListener("click", function(c) {
            a.maximizeChat_();
            Object(f.a)("." + b.u, Object(e.d)().shadowRoot).classList.add("hidden");
            Object(f.a)("#" + b.p, Object(e.d)().shadowRoot).classList.add("rotate-fade");
        });
    };
    a.prototype.add = function(a) {
        this.messageList.appendChild(a.element);
        this.scrollToLatest_();
    };
    a.prototype.scrollToLatest_ = function() {
        Object(f.a)("#messageList > :last-child", this.shadowRoot).scrollIntoView();
    };
    a.prototype.maximizeChat_ = function() {
        Object(f.a)("." + b.T, this.shadowRoot).classList.remove(b.S);
        Object(e.b)().classList.remove(b.j);
        null === Object(e.d)().waitOpen || null === Object(e.d)().intent || Object(e.d)().isWelcomeFired_() || Object(e.d)().initializeDFMessenger_();
    };
    customElements.define(b.A, a);
}, function(d, c) {
    c = function() {
        return this;
    }();
    try {
        c = c || Function("return this")() || (0, eval)("this");
    } catch (a) {
        "object" === typeof window && (c = window);
    }
    d.exports = c;
}, function(d, c, a) {
    var b = a(1), e = a(2), f = a(0);
    d = a(3);
    a.n(d);
    var h = document.createElement("template");
    h.innerHTML = '\n  <style>\n    .title-wrapper {\n      align-items: center;\n      background-color: #ffffff;\n      background-color: var(--df-messenger-button-titlebar-color);\n      border-radius: 5px 5px 0 0;\n      box-shadow: 0px 3px 6px 0px #00000029;\n      color: white;\n      color: var(--df-messenger-button-titlebar-font-color);\n      display: flex;\n      font-family: \'Roboto\', sans-serif;\n      font-size: 18px;\n      height: 50px;\n      justify-content: space-between;\n      padding-left: 15px;\n    }\n\n    #minimizeIcon {\n      fill: white;\n      fill: var(--df-messenger-button-titlebar-font-color);\n      margin: 15px;\n      transform: rotate(90deg);\n    }\n\n    @media screen and (min-width: 501px) {\n      #minimizeIcon {\n        visibility: hidden;\n      }\n    }\n  </style>\n  <div class="title-wrapper">\n    <div id="dfTitlebar"></div>\n  <div class="gcse-search"></div>\n   <svg height="24" viewBox="0 0 24 24"\n        id="minimizeIcon"\n        width="24" xmlns="http://www.w3.org/2000/svg">\n      <path d="M0 0h24v24H0z" fill="none"/>\n      <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/>\n    </svg>\n  </div>';
    ShadyCSS.prepareTemplate(h, f.F);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(h.content.cloneNode(!0));
        Object(b.a)("#" + f.I, this.shadowRoot).innerText = Object(e.d)().chatTitle || Object(b.e)(Object(e.d)().languageCode, "chatTitle");
        Object(b.a)("#" + f.U, this.shadowRoot).addEventListener("click", function() {
            Object(e.d)().removeAttribute(f.L);
        });
    };
    customElements.define(f.F, a);
},
 function(d, c, a) {
    var b = a(2), e = a(4), f = a(5), h = a(6), k = a(0), l = a(1);
    d = a(3);
    a.n(d);
    var m = document.createElement("template");
    m.innerHTML = '\n  <style>\n    .input-box-wrapper {\n      align-items: center;\n      background-color: white;\n      background-color: var(--df-messenger-input-box-color);\n      border-top: 1px solid #eeeeee;\n      display: flex;\n      font-family: \'Roboto\', sans-serif;\n      height: 50px;\n      z-index: 2;\n    }\n\n    .input-container {\n      display: flex;\n      flex-direction: column;\n      height: 50px;\n    }\n\n    .input-container input {\n      background-color: white;\n      background-color: var(--df-messenger-input-box-color);\n      border: none;\n      border-radius: 0 0 4px 4px;\n      color: rgba(0,0,0,0.87);\n      color: var(--df-messenger-input-font-color);\n      font-size: 14px;\n      padding-left: 15px;\n      width: 100%;\n    }\n\n    ::placeholder {\n      color: #757575;\n      color: var(--df-messenger-input-placeholder-font-color);\n      opacity: 1;\n    }\n\n    :--ms-input-placeholder {\n      color: #757575;\n      color: var(--df-messenger-input-placeholder-font-color);\n    }\n\n    ::-ms-input-placeholder {\n      color: #757575;\n      color: var(--df-messenger-input-placeholder-font-color);\n    }\n\n    input:focus {\n      outline-width: 0;\n    }\n\n    #sendIcon {\n      cursor: pointer;\n      fill: #42A5F5;\n      fill: var(--df-messenger-send-icon);\n      flex: 0 0 auto;\n      height: 24px;\n      margin: 15px;\n      viewbox: 0 0 24 24;\n      width: 24px;\n      transform: scale(0.01, 0.01);\n      transition: 0.3s ease;\n    }\n\n    #sendIcon:hover {\n      fill: green;\n    }\n\n    .valid #sendIcon {\n      transform: scale(1, 1);\n    }\n\n    .check-input {\n      background-color: #E53935;\n      color: #fafafa;\n      font-family: \'Roboto\', sans-serif;\n      font-size: 13px;\n      font-weight: bold;\n      height: 50px;\n      line-height: 1.7;\n      margin-bottom: -50px;\n      padding-left: 10px;\n      transition: transform 0.2s;\n      transform: translateY(0);\n      z-index: 1;\n    }\n\n    div.check-input.too-long {\n      transform: translateY(-100%);\n    }\n  </style>\n\n  <div class="input-container">\n    <div class="check-input"></div>\n    <div class="input-box-wrapper">\n      <input type="text"/>\n      <svg xmlns="http://www.w3.org/2000/svg" id="sendIcon">\n        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>\n        <path d="M0 0h24v24H0z" fill="none"/>\n      </svg>\n    </div>\n  </div>\n';
    ShadyCSS.prepareTemplate(m, k.G);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        var a = this;
        ShadyCSS.styleElement(this);
        var c = this.attachShadow({
            mode: "open"
        });
        c.appendChild(m.content.cloneNode(!0));
        this.parentRoot = this.parentNode;
        Object(l.a)("input", c).setAttribute("placeholder", Object(l.e)(Object(b.d)().languageCode, "askSomething"));
        Object(l.a)("input", c).addEventListener("keypress", function(b) {
            a.handleKeyPress_(b.keyCode);
        });
        Object(l.a)("input", c).addEventListener("input", function() {
            a.handleInput_();
        });
        Object(l.a)("#sendIcon", c).addEventListener("click", function(b) {
            a.sendMessage_();
        });
    };
    a.prototype.handleInput_ = function() {
        var a = this.shadowRoot, c = Object(l.a)("input", a);
        a = Object(l.a)(".check-input", a);
        var d = Object(l.a)(".input-box-wrapper", this.shadowRoot);
        "" === c.value && d.classList.remove("valid");
        256 < c.value.length ? a.classList.add("too-long") : a.classList.remove("too-long");
        256 >= c.value.length && 0 < c.value.length ? d.classList.add("valid") : d.classList.remove("valid");
        256 < c.value.length && (c = Object(l.e)(Object(b.d)().languageCode, "messageTooLong").replace("numOfChars", c.value.length - 256), 
        a.innerHTML = c);
    };
    a.prototype.handleKeyPress_ = function(a) {
        var b = Object(l.a)("input", this.shadowRoot).value.length;
        13 === a && 256 >= b && 0 < b && this.sendMessage_();
    };
    a.prototype.sendMessage_ = function() {
        var a = Object(l.a)("input", this.shadowRoot);
        a.value && (Object(l.a)(".input-box-wrapper", this.shadowRoot).classList.remove("valid"), 
        Object(b.a)().newMessage(this.buildMessageForDisplay_(a.value)), Object(l.d)(Object(b.d)(), k._3, {
            input: a.value
        }), this.makeRequest_(a.value), a.value = "", a.focus());
    };
    a.prototype.makeRequest_ = function(a) {
        var b = Object(l.a)(k.B);
        Object(h.b)(Object(h.a)(a), k.N.text, b).then(function(a) {
            new f.a().processResponse(a);
        }, function(a) {
            console.error("DfMessenger: Request failed", a.error.code + ": " + a.error.message);
        });
    };
    a.prototype.buildMessageForDisplay_ = function(a) {
        var b = Object.assign({}, e.c);
        b.type = "text";
        b.isBot = !1;
        b.element = Object(l.c)("div", [ "message", "user-message", "user-animation" ], a);
        return b;
    };
    customElements.define(k.G, a);
}, function(d, c, a) {
    var b = a(1), e = a(0), f = a(2), h = a(8), k = document.createElement("template");
    k.innerHTML = "\n  <style>\n    @import url(//fonts.googleapis.com/icon?family=Material+Icons);\n\n    #dfAccordionWrapper {\n      background: white;\n      border-radius: 8px;\n      color: black;\n      cursor: pointer;\n      display: flex;\n      flex-direction: column;\n      font-family: 'Roboto', sans-serif;\n      font-size: 14px;\n      padding: 12px 12px;\n      text-decoration: none;\n    }\n\n    #dfAccordionWrapper .top-row {\n      display: flex;\n      justify-content: space-between;\n    }\n\n    #dfAccordionWrapper .top-row .content {\n      display: flex;\n    }\n\n    #dfAccordionWrapper .image-content {\n      display: none;\n      flex-direction: column;\n      justify-content: center;\n      overflow: hidden;\n    }\n\n    #dfAccordionWrapper .image-content.visible {\n      display: block;\n      overflow: inherit;\n      width: auto;\n    }\n\n    #dfAccordionWrapper #image {\n      border-radius: 3px;\n      margin-right: 10px;\n      max-width: 47px;\n    }\n\n    #dfAccordionWrapper #title {\n      color: black;\n      font-size: 14px;\n      font-weight: bold;\n    }\n\n    #dfAccordionWrapper #subtitle {\n      color: #757575;\n      font-size: 13px;\n    }\n\n    #dfAccordionWrapper .text-content {\n      display: flex;\n      flex-direction: column;\n      justify-content: space-evenly;\n    }\n\n    #dfAccordionWrapper .text-row {\n      max-height: 0;\n      overflow: hidden;\n      transition: max-height 0.25s ease-out;\n    }\n\n    #dfAccordionWrapper .text-row.open {\n      /* Max-height trick needed to animate expansion. Height won't animate. */\n      max-height: inherit;\n      transition: max-height 0.25s ease-in;\n    }\n\n    #dfAccordionWrapper #text {\n      padding-top: 10px;\n    }\n\n    #dfAccordionWrapper #expandIcon {\n      color: #757575;\n      display: none;\n      font-size: 32px;\n      padding: 7px 0;\n      transform: rotate(90deg);\n      transition: transform 0.15s ease-out;\n    }\n\n    #dfAccordionWrapper #expandIcon.visible {\n      display: inherit;\n    }\n\n    #dfAccordionWrapper .word-wrap {\n      overflow-wrap: break-word;\n      word-break: break-word;\n      word-wrap: break-word;\n    }\n\n    #dfAccordionWrapper #expandIcon.open {\n      font-size: 32px;\n      padding: 7px 0;\n      transform: rotate(-90deg);\n      transition: transform 0.15s ease-in;\n    }\n  </style>\n\n  <div id=\"" + e.c + '">\n    <div class="top-row">\n      <div class="content">\n        <div class="image-content">\n          <img id="image" />\n        </div>\n        <div class="text-content">\n          <div id="title" class="word-wrap"></div>\n          <div id="subtitle" class="word-wrap"></div>\n        </div>\n      </div>\n      <div class="expand-icon">\n        <span class="material-icons" id="expandIcon">chevron_right</span>\n      </div>\n    </div>\n    <div class="text-row">\n      <div id="text" class="word-wrap"></div>\n    </div>\n  </div>';
    d = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(d, HTMLElement);
    d.prototype.connectedCallback = function() {
        var a = this, c = this.attachShadow({
            mode: "open"
        });
        c.appendChild(k.content.cloneNode(!0));
        this.render();
        Object(b.a)("#" + e.c, c).addEventListener("click", function(b) {
            a.onClick();
        });
    };
    d.prototype.render = function() {
        Object(b.a)("#" + e.c + " #title", this.shadowRoot).innerHTML = h.a.sanitize(this.title);
        Object(b.a)("#" + e.c + " #subtitle", this.shadowRoot).innerHTML = h.a.sanitize(this.subtitle);
        0 < this.text.length && (Object(b.a)("#" + e.c + " #text", this.shadowRoot).innerHTML = h.a.sanitize(this.text), 
        Object(b.a)("#" + e.c + " #expandIcon", this.shadowRoot).classList.add("visible"));
        this.image && this.image.src && 0 < this.image.src.length && (Object(b.a)("#" + e.c + " #image", this.shadowRoot).src = this.image.src, 
        Object(b.a)("#" + e.c + " .image-content", this.shadowRoot).classList.add("visible"));
    };
    d.prototype.onClick = function() {
        Object(b.d)(Object(f.d)(), e.b, {
            element: this
        });
        0 >= this.text.length || (Object(b.a)("#" + e.c + " .text-row", this.shadowRoot).classList.toggle("open"), 
        Object(b.a)("#" + e.c + " #expandIcon", this.shadowRoot).classList.toggle("open"));
    };
    $jscomp.global.Object.defineProperties(d.prototype, {
        title: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.title_;
            },
            set: function(a) {
                this.title_ = a ? a : "";
            }
        },
        subtitle: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.subtitle_;
            },
            set: function(a) {
                this.subtitle_ = a ? a : "";
            }
        },
        text: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.text_;
            },
            set: function(a) {
                this.text_ = a ? a : "";
            }
        },
        image: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.image_;
            },
            set: function(a) {
                this.image_ = a ? a : {
                    src: ""
                };
            }
        }
    });
    c.a = d;
    customElements.define(e.r, d);
}, function(d, c, a) {
    (function(a, c) {
        d.exports = c();
    })(this, function() {
        function a(a) {
            if (Array.isArray(a)) {
                for (var b = 0, c = Array(a.length); b < a.length; b++) c[b] = a[b];
                return c;
            }
            return Array.from(a);
        }
        function c(a) {
            return function(b) {
                for (var c = arguments.length, d = Array(1 < c ? c - 1 : 0), e = 1; e < c; e++) d[e - 1] = arguments[e];
                return D(a, b, d);
            };
        }
        function d(a) {
            return function() {
                for (var b = arguments.length, c = Array(b), d = 0; d < b; d++) c[d] = arguments[d];
                return M(a, c);
            };
        }
        function h(a, b) {
            v && v(a, null);
            for (var c = b.length; c--; ) {
                var d = b[c];
                if ("string" === typeof d) {
                    var e = V(d);
                    e !== d && (w(b) || (b[c] = e), d = e);
                }
                a[d] = !0;
            }
            return a;
        }
        function k(a) {
            var b = {}, c = void 0;
            for (c in a) D(t, a, [ c ]) && (b[c] = a[c]);
            return b;
        }
        function l(a) {
            if (Array.isArray(a)) {
                for (var b = 0, c = Array(a.length); b < a.length; b++) c[b] = a[b];
                return c;
            }
            return Array.from(a);
        }
        function m() {
            var a = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : "undefined" === typeof window ? null : window, b = function(a) {
                return m(a);
            };
            b.version = "2.0.8";
            b.removed = [];
            if (!a || !a.document || 9 !== a.document.nodeType) return b.isSupported = !1, b;
            var c = a.document, d = !1, e = !1, f = a.document, t = a.DocumentFragment, v = a.Node, w = a.NodeFilter, q = a.NamedNodeMap, D = void 0 === q ? a.NamedNodeMap || a.MozNamedAttrMap : q, L = a.Text, M = a.Comment, Qa = a.DOMParser;
            q = a.trustedTypes;
            if ("function" === typeof a.HTMLTemplateElement) {
                var xa = f.createElement("template");
                xa.content && xa.content.ownerDocument && (f = xa.content.ownerDocument);
            }
            var K = jb(q, c), Oa = K ? K.createHTML("") : "";
            q = f;
            var oa = q.implementation, x = q.createNodeIterator, ya = q.getElementsByTagName, F = q.createDocumentFragment, sa = c.importNode, I = {};
            b.isSupported = oa && "undefined" !== typeof oa.createHTMLDocument && 9 !== f.documentMode;
            var Ia = eb, Ka = fb, bb = hb, db = ib, $a = Wa, R = Xa, fa = Va, y = null, Ba = h({}, [].concat(l(Ha), l(Ta), l(ia), l(ja), l(ba))), z = null, Ea = h({}, [].concat(l(ta), l(Ja), l(Ua), l(ua))), Z = null, ha = null, ab = !0, ra = !0, Sa = !1, Da = !1, U = !1, aa = !1, za = !1, Fa = !1, H = !1, Ma = !1, ka = !1, ma = !1, na = !0, Na = !0, da = !1, W = {}, va = h({}, "annotation-xml audio colgroup desc foreignobject head iframe math mi mn mo ms mtext noembed noframes plaintext script style svg template thead title video xmp".split(" ")), kb = h({}, [ "audio", "video", "img", "source", "image" ]), ca = null, Ya = h({}, "alt class for id label name pattern placeholder summary title value style xmlns".split(" ")), X = null, G = f.createElement("form"), A = function(a) {
                X && X === a || (a && "object" === ("undefined" === typeof a ? "undefined" : la(a)) || (a = {}), 
                y = "ALLOWED_TAGS" in a ? h({}, a.ALLOWED_TAGS) : Ba, z = "ALLOWED_ATTR" in a ? h({}, a.ALLOWED_ATTR) : Ea, 
                ca = "ADD_URI_SAFE_ATTR" in a ? h(k(Ya), a.ADD_URI_SAFE_ATTR) : Ya, Z = "FORBID_TAGS" in a ? h({}, a.FORBID_TAGS) : {}, 
                ha = "FORBID_ATTR" in a ? h({}, a.FORBID_ATTR) : {}, W = "USE_PROFILES" in a ? a.USE_PROFILES : !1, 
                ab = !1 !== a.ALLOW_ARIA_ATTR, ra = !1 !== a.ALLOW_DATA_ATTR, Sa = a.ALLOW_UNKNOWN_PROTOCOLS || !1, 
                Da = a.SAFE_FOR_JQUERY || !1, U = a.SAFE_FOR_TEMPLATES || !1, aa = a.WHOLE_DOCUMENT || !1, 
                H = a.RETURN_DOM || !1, Ma = a.RETURN_DOM_FRAGMENT || !1, ka = a.RETURN_DOM_IMPORT || !1, 
                ma = a.RETURN_TRUSTED_TYPE || !1, Fa = a.FORCE_BODY || !1, na = !1 !== a.SANITIZE_DOM, 
                Na = !1 !== a.KEEP_CONTENT, da = a.IN_PLACE || !1, fa = a.ALLOWED_URI_REGEXP || fa, 
                U && (ra = !1), Ma && (H = !0), W && (y = h({}, [].concat(l(ba))), z = [], !0 === W.html && (h(y, Ha), 
                h(z, ta)), !0 === W.svg && (h(y, Ta), h(z, Ja), h(z, ua)), !0 === W.svgFilters && (h(y, ia), 
                h(z, Ja), h(z, ua)), !0 === W.mathMl && (h(y, ja), h(z, Ua), h(z, ua))), a.ADD_TAGS && (y === Ba && (y = k(y)), 
                h(y, a.ADD_TAGS)), a.ADD_ATTR && (z === Ea && (z = k(z)), h(z, a.ADD_ATTR)), a.ADD_URI_SAFE_ATTR && h(ca, a.ADD_URI_SAFE_ATTR), 
                Na && (y["#text"] = !0), aa && h(y, [ "html", "head", "body" ]), y.table && (h(y, [ "tbody" ]), 
                delete Z.tbody), u && u(a), X = a);
            }, S = function(a) {
                J(b.removed, {
                    element: a
                });
                try {
                    a.parentNode.removeChild(a);
                } catch (gb) {
                    a.outerHTML = Oa;
                }
            }, Y = function(a, c) {
                try {
                    J(b.removed, {
                        attribute: c.getAttributeNode(a),
                        from: c
                    });
                } catch (wb) {
                    J(b.removed, {
                        attribute: null,
                        from: c
                    });
                }
                c.removeAttribute(a);
            }, g = function(a) {
                var b = void 0, c = void 0;
                Fa ? a = "<remove></remove>" + a : c = (c = Ca(a, /^[\s]+/)) && c[0];
                var g = K ? K.createHTML(a) : a;
                if (d) try {
                    b = new Qa().parseFromString(g, "text/html");
                } catch (yb) {}
                e && h(Z, [ "title" ]);
                if (!b || !b.documentElement) {
                    b = oa.createHTMLDocument("");
                    var n = b.body;
                    n.parentNode.removeChild(n.parentNode.firstElementChild);
                    n.outerHTML = g;
                }
                a && c && b.body.insertBefore(f.createTextNode(c), b.body.childNodes[0] || null);
                return ya.call(b, aa ? "html" : "body")[0];
            };
            if (b.isSupported) {
                try {
                    g('<svg><p><textarea><img src="</textarea><img src=x abc=1//">').querySelector("svg img") && (d = !0);
                } catch (n) {}
                (function() {
                    try {
                        var a = g("<x/><title>&lt;/title&gt;&lt;img&gt;");
                        E(/<\/title/, a.querySelector("title").innerHTML) && (e = !0);
                    } catch (gb) {}
                })();
            }
            var p = function(a) {
                return x.call(a.ownerDocument || a, a, w.SHOW_ELEMENT | w.SHOW_COMMENT | w.SHOW_TEXT, function() {
                    return w.FILTER_ACCEPT;
                }, !1);
            }, wa = function(a) {
                return "object" === ("undefined" === typeof v ? "undefined" : la(v)) ? a instanceof v : a && "object" === ("undefined" === typeof a ? "undefined" : la(a)) && "number" === typeof a.nodeType && "string" === typeof a.nodeName;
            }, B = function(a, c, d) {
                I[a] && N(I[a], function(a) {
                    a.call(b, c, d, X);
                });
            }, C = function(a) {
                B("beforeSanitizeElements", a, null);
                var c = a instanceof L || a instanceof M ? !1 : "string" === typeof a.nodeName && "string" === typeof a.textContent && "function" === typeof a.removeChild && a.attributes instanceof D && "function" === typeof a.removeAttribute && "function" === typeof a.setAttribute && "string" === typeof a.namespaceURI ? !1 : !0;
                if (c) return S(a), !0;
                c = V(a.nodeName);
                B("uponSanitizeElement", a, {
                    tagName: c,
                    allowedTags: y
                });
                if (("svg" === c || "math" === c) && 0 !== a.querySelectorAll("p, br").length) return S(a), 
                !0;
                if (!y[c] || Z[c]) {
                    if (Na && !va[c] && "function" === typeof a.insertAdjacentHTML) try {
                        var d = a.innerHTML;
                        a.insertAdjacentHTML("AfterEnd", K ? K.createHTML(d) : d);
                    } catch (xb) {}
                    S(a);
                    return !0;
                }
                if ("noscript" === c && E(/<\/noscript/i, a.innerHTML) || "noembed" === c && E(/<\/noembed/i, a.innerHTML)) return S(a), 
                !0;
                !Da || a.firstElementChild || a.content && a.content.firstElementChild || !E(/</g, a.textContent) || (J(b.removed, {
                    element: a.cloneNode()
                }), a.innerHTML = a.innerHTML ? O(a.innerHTML, /</g, "&lt;") : O(a.textContent, /</g, "&lt;"));
                U && 3 === a.nodeType && (d = a.textContent, d = O(d, Ia, " "), d = O(d, Ka, " "), 
                a.textContent !== d && (J(b.removed, {
                    element: a.cloneNode()
                }), a.textContent = d));
                B("afterSanitizeElements", a, null);
                return !1;
            }, T = function(a, b, c) {
                if (na && ("id" === b || "name" === b) && (c in f || c in G)) return !1;
                if (!ra || !E(bb, b)) if (!ab || !E(db, b)) if (!z[b] || ha[b] || !(ca[b] || E(fa, O(c, R, "")) || ("src" === b || "xlink:href" === b || "href" === b) && "script" !== a && 0 === Ra(c, "data:") && kb[a] || Sa && !E($a, O(c, R, ""))) && c) return !1;
                return !0;
            }, lb = function(a) {
                var c, d;
                B("beforeSanitizeAttributes", a, null);
                var e = a.attributes;
                if (e) {
                    var g = {
                        attrName: "",
                        attrValue: "",
                        keepAttr: !0,
                        allowedAttributes: z
                    };
                    for (d = e.length; d--; ) {
                        var f = c = e[d], h = f.name;
                        f = f.namespaceURI;
                        c = cb(c.value);
                        var k = V(h);
                        g.attrName = k;
                        g.attrValue = c;
                        g.keepAttr = !0;
                        g.forceKeepAttr = void 0;
                        B("uponSanitizeAttribute", a, g);
                        c = g.attrValue;
                        if (!g.forceKeepAttr) {
                            if ("name" === k && "IMG" === a.nodeName && e.id) {
                                var J = e.id;
                                e = Aa(e, []);
                                Y("id", a);
                                Y(h, a);
                                pa(e, J) > d && a.setAttribute("id", J.value);
                            } else if ("INPUT" !== a.nodeName || "type" !== k || "file" !== c || !g.keepAttr || !z[k] && ha[k]) "id" === h && a.setAttribute(h, ""), 
                            Y(h, a); else continue;
                            if (g.keepAttr) if (Da && E(/\/>/i, c)) Y(h, a); else if (E(/svg|math/i, a.namespaceURI) && E(Q("</(" + qa(P(va), "|") + ")", "i"), c)) Y(h, a); else if (U && (c = O(c, Ia, " "), 
                            c = O(c, Ka, " ")), J = a.nodeName.toLowerCase(), T(J, k, c)) try {
                                f ? a.setAttributeNS(f, h, c) : a.setAttribute(h, c), ea(b.removed);
                            } catch (zb) {}
                        }
                    }
                    B("afterSanitizeAttributes", a, null);
                }
            }, ub = function gb(a) {
                var b, c = p(a);
                for (B("beforeSanitizeShadowDOM", a, null); b = c.nextNode(); ) B("uponSanitizeShadowNode", b, null), 
                C(b) || (b.content instanceof t && gb(b.content), lb(b));
                B("afterSanitizeShadowDOM", a, null);
            };
            b.sanitize = function(d, e) {
                var f = void 0, h = void 0;
                d || (d = "<!-->");
                if ("string" !== typeof d && !wa(d)) {
                    if ("function" !== typeof d.toString) throw Ga("toString is not a function");
                    d = d.toString();
                    if ("string" !== typeof d) throw Ga("dirty is not a string, aborting");
                }
                if (!b.isSupported) {
                    if ("object" === la(a.toStaticHTML) || "function" === typeof a.toStaticHTML) {
                        if ("string" === typeof d) return a.toStaticHTML(d);
                        if (wa(d)) return a.toStaticHTML(d.outerHTML);
                    }
                    return d;
                }
                za || A(e);
                b.removed = [];
                "string" === typeof d && (da = !1);
                if (!da) if (d instanceof v) f = g("<!-->"), e = f.ownerDocument.importNode(d, !0), 
                1 === e.nodeType && "BODY" === e.nodeName ? f = e : "HTML" === e.nodeName ? f = e : f.appendChild(e); else {
                    if (!H && !U && !aa && ma && -1 === d.indexOf("<")) return K ? K.createHTML(d) : d;
                    f = g(d);
                    if (!f) return H ? null : Oa;
                }
                f && Fa && S(f.firstChild);
                for (var k = p(da ? d : f); e = k.nextNode(); ) 3 === e.nodeType && e === h || C(e) || (e.content instanceof t && ub(e.content), 
                lb(e), h = e);
                if (da) return d;
                if (H) {
                    if (Ma) for (d = F.call(f.ownerDocument); f.firstChild; ) d.appendChild(f.firstChild); else d = f;
                    ka && (d = sa.call(c, d, !0));
                    return d;
                }
                f = aa ? f.outerHTML : f.innerHTML;
                U && (f = O(f, Ia, " "), f = O(f, Ka, " "));
                return K && ma ? K.createHTML(f) : f;
            };
            b.setConfig = function(a) {
                A(a);
                za = !0;
            };
            b.clearConfig = function() {
                X = null;
                za = !1;
            };
            b.isValidAttribute = function(a, b, c) {
                X || A({});
                a = V(a);
                b = V(b);
                return T(a, b, c);
            };
            b.addHook = function(a, b) {
                "function" === typeof b && (I[a] = I[a] || [], J(I[a], b));
            };
            b.removeHook = function(a) {
                I[a] && ea(I[a]);
            };
            b.removeHooks = function(a) {
                I[a] && (I[a] = []);
            };
            b.removeAllHooks = function() {
                I = {};
            };
            return b;
        }
        var t = Object.hasOwnProperty, v = Object.setPrototypeOf, w = Object.isFrozen, P = Object.keys, u = Object.freeze, q = Object.seal, L = "undefined" !== typeof Reflect && Reflect, D = L.apply, M = L.construct;
        D || (D = function(a, b, c) {
            return a.apply(b, c);
        });
        u || (u = function(a) {
            return a;
        });
        q || (q = function(a) {
            return a;
        });
        M || (M = function(b, c) {
            return new (Function.prototype.bind.apply(b, [ null ].concat(a(c))))();
        });
        var N = c(Array.prototype.forEach), pa = c(Array.prototype.indexOf), qa = c(Array.prototype.join), ea = c(Array.prototype.pop), J = c(Array.prototype.push), Aa = c(Array.prototype.slice), V = c(String.prototype.toLowerCase), Ca = c(String.prototype.match), O = c(String.prototype.replace), Ra = c(String.prototype.indexOf), cb = c(String.prototype.trim), E = c(RegExp.prototype.test), Q = d(RegExp), Ga = d(TypeError), Ha = u("a abbr acronym address area article aside audio b bdi bdo big blink blockquote body br button canvas caption center cite code col colgroup content data datalist dd decorator del details dfn dir div dl dt element em fieldset figcaption figure font footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i img input ins kbd label legend li main map mark marquee menu menuitem meter nav nobr ol optgroup option output p picture pre progress q rp rt ruby s samp section select shadow small source spacer span strike strong style sub summary sup table tbody td template textarea tfoot th thead time tr track tt u ul var video wbr".split(" ")), Ta = u("svg a altglyph altglyphdef altglyphitem animatecolor animatemotion animatetransform audio canvas circle clippath defs desc ellipse filter font g glyph glyphref hkern image line lineargradient marker mask metadata mpath path pattern polygon polyline radialgradient rect stop style switch symbol text textpath title tref tspan video view vkern".split(" ")), ia = u("feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence".split(" ")), ja = u("math menclose merror mfenced mfrac mglyph mi mlabeledtr mmultiscripts mn mo mover mpadded mphantom mroot mrow ms mspace msqrt mstyle msub msup msubsup mtable mtd mtext mtr munder munderover".split(" ")), ba = u([ "#text" ]), ta = u("accept action align alt autocomplete background bgcolor border cellpadding cellspacing checked cite class clear color cols colspan controls coords crossorigin datetime default dir disabled download enctype face for headers height hidden high href hreflang id integrity ismap label lang list loop low max maxlength media method min minlength multiple name noshade novalidate nowrap open optimum pattern placeholder poster preload pubdate radiogroup readonly rel required rev reversed role rows rowspan spellcheck scope selected shape size sizes span srclang start src srcset step style summary tabindex title type usemap valign value width xmlns".split(" ")), Ja = u("accent-height accumulate additive alignment-baseline ascent attributename attributetype azimuth basefrequency baseline-shift begin bias by class clip clip-path clip-rule color color-interpolation color-interpolation-filters color-profile color-rendering cx cy d dx dy diffuseconstant direction display divisor dur edgemode elevation end fill fill-opacity fill-rule filter filterunits flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight fx fy g1 g2 glyph-name glyphref gradientunits gradienttransform height href id image-rendering in in2 k k1 k2 k3 k4 kerning keypoints keysplines keytimes lang lengthadjust letter-spacing kernelmatrix kernelunitlength lighting-color local marker-end marker-mid marker-start markerheight markerunits markerwidth maskcontentunits maskunits max mask media method mode min name numoctaves offset operator opacity order orient orientation origin overflow paint-order path pathlength patterncontentunits patterntransform patternunits points preservealpha preserveaspectratio primitiveunits r rx ry radius refx refy repeatcount repeatdur restart result rotate scale seed shape-rendering specularconstant specularexponent spreadmethod stddeviation stitchtiles stop-color stop-opacity stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke stroke-width style surfacescale tabindex targetx targety transform text-anchor text-decoration text-rendering textlength type u1 u2 unicode values viewbox visibility version vert-adv-y vert-origin-x vert-origin-y width word-spacing wrap writing-mode xchannelselector ychannelselector x x1 x2 xmlns y y1 y2 z zoomandpan".split(" ")), Ua = u("accent accentunder align bevelled close columnsalign columnlines columnspan denomalign depth dir display displaystyle encoding fence frame height href id largeop length linethickness lspace lquote mathbackground mathcolor mathsize mathvariant maxsize minsize movablelimits notation numalign open rowalign rowlines rowspacing rowspan rspace rquote scriptlevel scriptminsize scriptsizemultiplier selection separator separators stretchy subscriptshift supscriptshift symmetric voffset width xmlns".split(" ")), ua = u([ "xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink" ]), eb = q(/\{\{[\s\S]*|[\s\S]*\}\}/gm), fb = q(/<%[\s\S]*|[\s\S]*%>/gm), hb = q(/^data-[\-\w.\u00B7-\uFFFF]/), ib = q(/^aria-[\-\w]+$/), Va = q(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i), Wa = q(/^(?:\w+script|data):/i), Xa = q(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g);
        $jscomp.initSymbol();
        $jscomp.initSymbol();
        $jscomp.initSymbolIterator();
        var la = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(a) {
            return typeof a;
        } : function(a) {
            $jscomp.initSymbol();
            $jscomp.initSymbol();
            $jscomp.initSymbol();
            return a && "function" === typeof Symbol && a.constructor === Symbol && a !== Symbol.prototype ? "symbol" : typeof a;
        }, jb = function(a, b) {
            if ("object" !== ("undefined" === typeof a ? "undefined" : la(a)) || "function" !== typeof a.createPolicy) return null;
            var c = null;
            b.currentScript && b.currentScript.hasAttribute("data-tt-policy-suffix") && (c = b.currentScript.getAttribute("data-tt-policy-suffix"));
            b = "dompurify" + (c ? "#" + c : "");
            try {
                return a.createPolicy(b, {
                    createHTML: function(a) {
                        return a;
                    }
                });
            } catch (Za) {
                return console.warn("TrustedTypes policy " + b + " could not be created."), null;
            }
        };
        return m();
    });
}, function(d, c, a) {
    var b = a(0), e = a(2), f = a(1), h = a(5), k = a(6), l = a(8), m = document.createElement("template");
    m.innerHTML = '\n  <style>\n    @import url(//fonts.googleapis.com/icon?family=Material+Icons);\n\n    #dfButtonAnchorWrapper {\n      align-items: center;\n      background: white;\n      border-radius: 8px;\n      color: black;\n      cursor: pointer;\n      display: flex;\n      font-family: \'Roboto\', sans-serif;\n      font-size: 14px;\n      padding: 12px 12px;\n      text-decoration: none;\n    }\n\n    #dfButtonAnchorWrapper:hover > #dfLinkText,\n    #dfButtonAnchorWrapper:hover > .df-button-icon {\n      opacity: .5;\n    }\n\n    #dfLinkText {\n      padding-left: 12px;\n    }\n\n    .df-button-icon,\n    .df-button-icon #materialIcon {\n      height: 24px;\n      width: 24px;\n    }\n  </style>\n\n  <a id="dfButtonAnchorWrapper" href="" target="_blank">\n    <div class="df-button-icon">\n      <span class="material-icons" id="materialIcon">forward_arrow</span>\n    </div>\n    <div id="dfLinkText">link text</div>\n  </a>';
    d = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(d, HTMLElement);
    d.prototype.connectedCallback = function() {
        var a = this, b = this.attachShadow({
            mode: "open"
        });
        b.appendChild(m.content.cloneNode(!0));
        this.render();
        Object(f.a)("#dfButtonAnchorWrapper", b).addEventListener("click", function(b) {
            a.onClick();
        });
    };
    d.prototype.render = function() {
        this.setTextAndLink_();
        this.setIcon_();
        this.sanitize_();
    };
    d.prototype.setTextAndLink_ = function() {
        var a = Object(f.a)("#dfButtonAnchorWrapper", this.shadowRoot);
        this.link ? a.href = this.link : (a.removeAttribute("href"), a.removeAttribute("target"));
        Object(f.a)("#dfLinkText", this.shadowRoot).innerHTML = this.text;
    };
    d.prototype.setIcon_ = function() {
        Object(f.a)(".df-button-icon #materialIcon", this.shadowRoot).style.color = this.iconColor;
        Object(f.a)(".df-button-icon #materialIcon", this.shadowRoot).innerHTML = this.iconType;
    };
    d.prototype.sanitize_ = function() {
        var a = Object(l.b)();
        a.IN_PLACE = !0;
        l.a.clearConfig();
        l.a.sanitize(Object(f.a)("#dfButtonAnchorWrapper", this.shadowRoot), a);
        l.a.setConfig(Object(l.b)());
    };
    d.prototype.onClick = function() {
        Object(f.d)(Object(e.d)(), b.g, {
            element: this
        });
        var a = {};
        this.event && (a.queryInput = {
            event: this.event
        });
        a.queryInput && Object(k.b)(a, b.N.event, Object(e.d)()).then(function(a) {
            new h.a().processResponse(a);
        }, function(a) {
            console.error("DfMessenger: Request failed", a.error.code + ": " + a.error.message);
        });
    };
    $jscomp.global.Object.defineProperties(d.prototype, {
        link: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                this.link_ = a ? a : "";
            },
            get: function() {
                return this.link_;
            }
        },
        text: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                this.text_ = a ? a : "";
            },
            get: function() {
                return this.text_;
            }
        },
        iconColor: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                this.iconColor_ = a ? a : "#757575";
            },
            get: function() {
                return this.iconColor_;
            }
        },
        iconType: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                this.iconType_ = a ? a : "forward_arrow";
            },
            get: function() {
                return this.iconType_;
            }
        },
        event: {
            configurable: !0,
            enumerable: !0,
            set: function(a) {
                this.event_ = a ? a : null;
            },
            get: function() {
                return this.event_;
            }
        }
    });
    c.a = d;
    customElements.define(b.s, d);
}, function(d, c, a) {
    d = a(0);
    var b = a(3);
    a.n(b);
    var e = document.createElement("template");
    e.innerHTML = "\n  <style>\n    hr {\n      border: 0;\n      border-top: 1px solid #e0e0e0;\n      margin: 0;\n    }\n  </style>\n";
    ShadyCSS.prepareTemplate(e, d.t);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(e.content.cloneNode(!0));
        this.render_();
    };
    a.prototype.render_ = function() {
        var a = this;
        this.elements.forEach(function(b) {
            b && a.shadowRoot.appendChild(b.element);
        });
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        elements: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.elements_;
            },
            set: function(a) {
                this.elements_ = a ? a : [];
            }
        }
    });
    c.a = a;
    customElements.define(d.t, a);
}, function(d, c, a) {
    var b = a(0), e = a(1);
    d = a(3);
    a.n(d);
    var f = document.createElement("template");
    f.innerHTML = "\n  <style>\n  .description-line {\n    color: rgba(0,0,0,0.87);\n    font-size: 14px;\n    padding-top: 8px;\n    word-break: break-word;\n  }\n\n  #descriptionWrapper {\n    background-color: white;\n    border-radius: 8px;\n    display: flex;\n    flex-direction: column;\n    font-family: 'Roboto', sans-serif;\n    padding: 16px;\n  }\n\n  .title {\n    color: black;\n    font-size: 14px;\n    font-weight: bold;\n  }\n  </style>\n";
    ShadyCSS.prepareTemplate(f, b.w);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(f.content.cloneNode(!0));
        this.render();
    };
    a.prototype.render = function() {
        this.createOuterElement_();
        this.createTitleElement_();
        this.createTextElement_();
    };
    a.prototype.createOuterElement_ = function() {
        if (this.title || this.text) {
            var a = Object(e.c)("div");
            a.id = b.q;
            this.shadowRoot.appendChild(a);
        }
    };
    a.prototype.createTitleElement_ = function() {
        if (this.title) {
            var a = Object(e.c)("div", [ "title" ], this.title);
            Object(e.a)("#" + b.q, this.shadowRoot).appendChild(a);
        }
    };
    a.prototype.createTextElement_ = function() {
        var a = this;
        this.text && this.text.forEach(function(c) {
            c = Object(e.c)("div", [ "description-line" ], c);
            Object(e.a)("#" + b.q, a.shadowRoot).appendChild(c);
        });
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        title: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.title_;
            },
            set: function(a) {
                this.title_ = a;
            }
        },
        text: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.text_;
            },
            set: function(a) {
                this.text_ = a;
            }
        }
    });
    c.a = a;
    customElements.define(b.w, a);
}, function(d, c, a) {
    var b = a(1);
    d = a(0);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        this.appendChild(Object(b.c)("hr", [ "divider" ]));
    };
    c.a = a;
    customElements.define(d.x, a);
}, function(d, c, a) {
    d = a(23);
    var b = a.n(d), e = a(0), f = a(1);
    d = a(3);
    a.n(d);
    var h = document.createElement("template");
    h.innerHTML = "\n  <style>\n    img {\n      border-radius: 8px;\n      border-style: none;\n      width: 100%;\n    }\n\n    .loading {\n      height: 200px;\n    }\n  </style>";
    ShadyCSS.prepareTemplate(h, e.y);
    a = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(a, HTMLElement);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(h.content.cloneNode(!0));
        this.source && (this.setLoadingBackground_(), this.setAccessibilityText_(), this.asyncLoad_());
    };
    a.prototype.setAccessibilityText_ = function() {
        this.accessibilityText && Object(f.a)("img", this.shadowRoot).setAttribute("alt", this.accessibilityText);
    };
    a.prototype.onLoad = function(a, b, c) {
        b.setAttribute("src", c);
        b.classList.remove("loading");
    };
    a.prototype.onError = function(a, b, c) {
        a && a.parentNode && a.parentNode.host && (b = a.parentNode.host, c = b.tagName, 
        Object(f.g)(a), b && c === e.t.toUpperCase() && Object(f.g)(b));
    };
    a.prototype.asyncLoad_ = function() {
        Object(f.f)(this, this.source, Object(f.a)("img", this.shadowRoot), this.onLoad, this.onError);
    };
    a.prototype.setLoadingBackground_ = function() {
        var a = Object(f.c)("img", [ "loading" ]);
        this.shadowRoot.appendChild(a);
        a.setAttribute("style", 'background: url("' + b.a + '") 50% no-repeat');
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        source: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.source_;
            },
            set: function(a) {
                this.source_ = a;
            }
        },
        accessibilityText: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.accessibilityText_;
            },
            set: function(a) {
                this.accessibilityText_ = a;
            }
        }
    });
    c.a = a;
    customElements.define(e.y, a);
}, function(d, c, a) {
    d.exports = a.p + "/images/progress_spinner_grey.gif";
}, function(d, c, a) {
    d = a(9);
    var b = a(0), e = a(2), f = a(6), h = a(5), k = a(1), l = a(3);
    a.n(l);
    var m = d.a, t = document.createElement("template");
    t.innerHTML = "\n  <style>\n    .image {\n      background-repeat: no-repeat;\n      background-size: contain;\n      margin-right: 24px;\n      max-height: 24px;\n      max-width: 24px;\n      padding-right: 24px;\n    }\n\n    .title {\n      color: black;\n      font-weight: bold;\n    }\n\n    .subtitle {\n      color: #757575;\n      padding-top: 8px;\n    }\n\n    .title-card-elements {\n      background-color: white;\n      background:\n        linear-gradient(\n          to left,\n          rgba(216,209,213) 0%,\n          rgba(177,166,177) 47%,\n          rgba(216,209,213) 100%\n        )\n        left\n        bottom\n        white\n        no-repeat;\n      background-size: 100% 1px;\n      border-radius: 8px;\n      cursor: pointer;\n      display: flex;\n      font-family: 'Roboto', sans-serif;\n      font-size: 14px;\n      padding: 16px;\n    }\n  </style>\n";
    ShadyCSS.prepareTemplate(t, b.z);
    a = function() {
        return m.call(this) || this;
    };
    $jscomp.inherits(a, m);
    a.prototype.connectedCallback = function() {
        ShadyCSS.styleElement(this);
        this.attachShadow({
            mode: "open"
        }).appendChild(t.content.cloneNode(!0));
        this.render();
        this.addEventListener("click", this.onListElementClick_);
    };
    a.prototype.onListElementClick_ = function() {
        var a = this;
        Object(k.d)(Object(e.d)(), b.R, {
            element: this
        });
        var c = {};
        this.event && (this.event.languageCode || (this.event.languageCode = Object(e.d)().languageCode), 
        c.queryInput = {
            event: this.event
        });
        c.queryInput && c.queryInput.event && c.queryInput.event.name ? this.makeRequest(c).then(function(b) {
            return a.successHandler_(b);
        }).catch(function(b) {
            return a.failureHandler_(b);
        }) : console.error("DfMessenger: The list element does not have a validevent object. Please add a valid event to your agent");
    };
    a.prototype.successHandler_ = function(a) {
        new h.a().processResponse(a);
    };
    a.prototype.failureHandler_ = function(a) {
        console.error("DfMessenger: Request failed", a.error.code + ": " + a.error.message);
    };
    a.prototype.makeRequest = function(a) {
        return Object(f.b)(a, b.N.event, Object(e.d)());
    };
    $jscomp.global.Object.defineProperties(a.prototype, {
        event: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.event_;
            },
            set: function(a) {
                this.event_ = a;
            }
        }
    });
    c.a = a;
    customElements.define(b.z, a);
}, function(d, c, a) {
    var b = a(0), e = a(1), f = a(2), h = a(4), k = a(6), l = a(5), m = document.createElement("template");
    m.innerHTML = '\n  <style scope="' + b.v + "\">\n    .df-chips-wrapper {\n      padding: 10px;\n    }\n\n    .df-chips-wrapper.clicked {\n      display: none;\n    }\n\n    .df-chips-wrapper a {\n      align-items: center;\n      background-color: white;\n      background-color: var(--df-messenger-chip-color);\n      border-radius: 20px;\n      border: 1px solid;\n      border-color: #e0e0e0;\n      border-color: var(--df-messenger-chip-border-color);\n      box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.24);\n      color: black;\n      cursor: pointer;\n      display: inline-flex;\n      font-family: 'Roboto', sans-serif;\n      font-size: 14px;\n      height: 35px;\n      margin: 0 10px 10px 0;\n      padding: 0 16px;\n      text-decoration: none;\n      vertical-align: bottom;\n    }\n\n    .df-chips-wrapper a:hover {\n      background: hsl(0,0%,90%);\n    }\n\n    .df-chips-wrapper a > img {\n      margin-right: 8px;\n      max-height: 17.5px;\n      max-width: 17.5px;\n    }\n\n    .df-chips-wrapper a[href]:after {\n      background: center / contain no-repeat url(\"data:image/svg+xml;utf8, <svg xmlns='http://www.w3.org/2000/svg' fill='black' height='24' viewBox='0 0 24 24' width='24'> <path d='M0 0h24v24H0z' fill='none'/> <path d='M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z'/> </svg>\");\n      content: \"\";\n      display: inline-block;\n      height: 15px;\n      margin-left: 8px;\n      width: 15px;\n    }\n  </style>\n  <div class=\"" + b.o + '"></div>\n';
    d = function() {
        return HTMLElement.call(this) || this;
    };
    $jscomp.inherits(d, HTMLElement);
    d.prototype.connectedCallback = function() {
        this.attachShadow({
            mode: "open"
        }).appendChild(m.content.cloneNode(!0));
        this.chips && (this.renderChips_(), this.onClick_());
    };
    d.prototype.renderChips_ = function() {
        this.shadowRoot.appendChild(this.chips.map(function(a) {
            var b = a.image, c = a.link;
            a = a.text;
            c = c ? Object(e.c)("a", [ "chip-link" ], a, {
                href: c,
                target: "_blank"
            }) : Object(e.c)("a", [], a);
            b && b.src && b.src.rawUrl && (b = Object(e.c)("img", [], null, {
                src: b.src.rawUrl
            }), c.insertBefore(b, c.firstChild));
            return c;
        }).reduce(function(a, b) {
            a.appendChild(b);
            return a;
        }, Object(e.a)("." + b.o, this.shadowRoot)));
    };
    d.prototype.onClick_ = function() {
        var a = this, c = Object(e.b)("." + b.o + " > a", this.shadowRoot);
        c && c.length && c.forEach(function(c) {
            c.addEventListener("click", function() {
                Object(e.d)(Object(f.d)(), b._0, {
                    query: c.textContent
                });
                c.hasAttribute("href") || (a.addToMessageList_(c.textContent), a.sendChipTextAsRequest_(Object(k.a)(c.textContent)));
                a.removeChipsFromMessageList_();
            });
        });
    };
    d.prototype.sendChipTextAsRequest_ = function(a) {
        a && Object(k.b)(a, b.N.text, Object(f.d)()).then(function(a) {
            new l.a().processResponse(a);
        }, function(a) {
            console.error("DfMessenger Request failed ", a.error.code + ": " + a.error.message);
        });
    };
    d.prototype.addToMessageList_ = function(a) {
        var b = Object.assign({}, h.c);
        b.type = "text";
        b.isBot = !1;
        b.element = Object(e.c)("div", [ "message", "user-message", "user-animation" ], a);
        Object(f.a)().newMessage(b);
    };
    d.prototype.removeChipsFromMessageList_ = function() {
        Object(e.a)("." + b.o, this.shadowRoot).classList.add("clicked");
    };
    $jscomp.global.Object.defineProperties(d.prototype, {
        chips: {
            configurable: !0,
            enumerable: !0,
            get: function() {
                return this.chips_;
            },
            set: function(a) {
                this.chips_ = a;
            }
        }
    });
    c.a = d;
    customElements.define(b.v, d);
}, function(d, c, a) {
    c.f = {
        title: "",
        subtitle: "",
        image: {
            src: {
                rawUrl: ""
            }
        },
        actionLink: ""
    };
    c.d = {
        title: "",
        text: []
    };
    c.e = {
        rawUrl: "",
        accessibilityText: ""
    };
    c.g = {
        title: "",
        subtitle: "",
        image: {
            src: {
                rawUrl: ""
            }
        },
        event: {
            name: "",
            parameters: {},
            languageCode: ""
        },
        payload: {}
    };
    c.b = {
        icon: {
            type: "",
            color: ""
        },
        text: "",
        link: ""
    };
    c.a = {
        title: "",
        subtitle: "",
        image: {
            src: ""
        },
        text: ""
    };
    c.c = {
        options: [ {
            text: "Suggestion",
            image: {},
            link: ""
        }, {
            text: "Suggestion with icon",
            image: {
                src: {
                    rawUrl: "https://d30y9cdsu7xlg0.cloudfront.net/png/29715-200.png"
                }
            },
            link: ""
        }, {
            text: "Suggestion with link",
            image: {},
            link: "https://google.com"
        }, {
            text: "Suggestion with link & icon",
            image: {
                src: {
                    rawUrl: "https://d30y9cdsu7xlg0.cloudfront.net/png/29715-200.png"
                }
            },
            link: "https://google.com"
        } ]
    };
}, function(d, c, a) {
    c = a(28);
    "string" === typeof c && (c = [ [ d.i, c, "" ] ]);
    a(30)(c, {
        hmr: !0,
        transform: void 0,
        insertInto: void 0
    });
    c.locals && (d.exports = c.locals);
}, function(d, c, a) {
    c = d.exports = a(29)(!1);
    c.push([ d.i, ":root{--df-messenger-bot-message:#fff;--df-messenger-button-titlebar-color:#42a5f5;--df-messenger-button-titlebar-font-color:#fff;--df-messenger-chat-background-color:#fafafa;--df-messenger-font-color:rgba(0,0,0,.87);--df-messenger-input-box-color:#fff;--df-messenger-input-font-color:rgba(0,0,0,.87);--df-messenger-input-placeholder-font-color:#757575;--df-messenger-minimized-chat-close-icon-color:rgba(0,0,0,.87);--df-messenger-send-icon:#42a5f5;--df-messenger-user-message:#ddd;--df-messenger-chip-color:#fff;--df-messenger-chip-border-color:#e0e0e0}", "" ]);
}, function(d, c) {
    function a(a, c) {
        var b = a[1] || "", d = a[3];
        return d ? c && "function" === typeof btoa ? (a = "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(d)))) + " */", 
        c = d.sources.map(function(a) {
            return "/*# sourceURL=" + d.sourceRoot + a + " */";
        }), [ b ].concat(c).concat([ a ]).join("\n")) : "" + b : b;
    }
    d.exports = function(b) {
        var c = [];
        c.toString = function() {
            return this.map(function(c) {
                var d = a(c, b);
                return c[2] ? "@media " + c[2] + "{" + d + "}" : d;
            }).join("");
        };
        c.i = function(a, b) {
            "string" === typeof a && (a = [ [ null, a, "" ] ]);
            for (var d = {}, e = 0; e < this.length; e++) {
                var f = this[e][0];
                "number" === typeof f && (d[f] = !0);
            }
            for (e = 0; e < a.length; e++) f = a[e], "number" === typeof f[0] && d[f[0]] || (b && !f[2] ? f[2] = b : b && (f[2] = "(" + f[2] + ") and (" + b + ")"), 
            c.push(f));
        };
        return c;
    };
}, function(d, c, a) {
    function b(a, b) {
        for (var c = 0; c < a.length; c++) {
            var d = a[c], e = u[d.id];
            if (e) {
                e.refs++;
                for (var f = 0; f < e.parts.length; f++) e.parts[f](d.parts[f]);
                for (;f < d.parts.length; f++) e.parts.push(t(d.parts[f], b));
            } else {
                e = [];
                for (f = 0; f < d.parts.length; f++) e.push(t(d.parts[f], b));
                u[d.id] = {
                    id: d.id,
                    refs: 1,
                    parts: e
                };
            }
        }
    }
    function e(a, b) {
        for (var c = [], d = {}, e = 0; e < a.length; e++) {
            var f = a[e], h = b.base ? f[0] + b.base : f[0];
            f = {
                css: f[1],
                media: f[2],
                sourceMap: f[3]
            };
            d[h] ? d[h].parts.push(f) : c.push(d[h] = {
                id: h,
                parts: [ f ]
            });
        }
        return c;
    }
    function f(a, b) {
        var c = L(a.insertInto);
        if (!c) throw Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
        var d = N[N.length - 1];
        if ("top" === a.insertAt) d ? d.nextSibling ? c.insertBefore(b, d.nextSibling) : c.appendChild(b) : c.insertBefore(b, c.firstChild), 
        N.push(b); else if ("bottom" === a.insertAt) c.appendChild(b); else if ("object" === typeof a.insertAt && a.insertAt.before) a = L(a.insertInto + " " + a.insertAt.before), 
        c.insertBefore(b, a); else throw Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
    }
    function h(a) {
        if (null === a.parentNode) return !1;
        a.parentNode.removeChild(a);
        a = N.indexOf(a);
        0 <= a && N.splice(a, 1);
    }
    function k(a) {
        var b = document.createElement("style");
        a.attrs.type = "text/css";
        m(b, a.attrs);
        f(a, b);
        return b;
    }
    function l(a) {
        var b = document.createElement("link");
        a.attrs.type = "text/css";
        a.attrs.rel = "stylesheet";
        m(b, a.attrs);
        f(a, b);
        return b;
    }
    function m(a, b) {
        Object.keys(b).forEach(function(c) {
            a.setAttribute(c, b[c]);
        });
    }
    function t(a, b) {
        var c;
        if (b.transform && a.css) if (c = b.transform(a.css)) a.css = c; else return function() {};
        if (b.singleton) {
            c = M++;
            var d = D || (D = k(b));
            var e = v.bind(null, d, c, !1);
            var f = v.bind(null, d, c, !0);
        } else a.sourceMap && "function" === typeof URL && "function" === typeof URL.createObjectURL && "function" === typeof URL.revokeObjectURL && "function" === typeof Blob && "function" === typeof btoa ? (d = l(b), 
        e = P.bind(null, d, b), f = function() {
            h(d);
            d.href && URL.revokeObjectURL(d.href);
        }) : (d = k(b), e = w.bind(null, d), f = function() {
            h(d);
        });
        e(a);
        return function(b) {
            b ? b.css === a.css && b.media === a.media && b.sourceMap === a.sourceMap || e(a = b) : f();
        };
    }
    function v(a, b, c, d) {
        c = c ? "" : d.css;
        a.styleSheet ? a.styleSheet.cssText = qa(b, c) : (c = document.createTextNode(c), 
        d = a.childNodes, d[b] && a.removeChild(d[b]), d.length ? a.insertBefore(c, d[b]) : a.appendChild(c));
    }
    function w(a, b) {
        var c = b.css;
        (b = b.media) && a.setAttribute("media", b);
        if (a.styleSheet) a.styleSheet.cssText = c; else {
            for (;a.firstChild; ) a.removeChild(a.firstChild);
            a.appendChild(document.createTextNode(c));
        }
    }
    function P(a, b, c) {
        var d = c.css;
        c = c.sourceMap;
        var e = void 0 === b.convertToAbsoluteUrls && c;
        if (b.convertToAbsoluteUrls || e) d = pa(d);
        c && (d += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(c)))) + " */");
        b = new Blob([ d ], {
            type: "text/css"
        });
        d = a.href;
        a.href = URL.createObjectURL(b);
        d && URL.revokeObjectURL(d);
    }
    var u = {}, q = function(a) {
        var b;
        return function() {
            "undefined" === typeof b && (b = a.apply(this, arguments));
            return b;
        };
    }(function() {
        return window && document && document.all && !window.atob;
    }), L = function(a) {
        var b = {};
        return function(a) {
            if ("function" === typeof a) return a();
            if ("undefined" === typeof b[a]) {
                var c = document.querySelector(a);
                if (window.HTMLIFrameElement && c instanceof window.HTMLIFrameElement) try {
                    c = c.contentDocument.head;
                } catch (Ca) {
                    c = null;
                }
                b[a] = c;
            }
            return b[a];
        };
    }(), D = null, M = 0, N = [], pa = a(31);
    d.exports = function(a, c) {
        if ("undefined" !== typeof DEBUG && DEBUG && "object" !== typeof document) throw Error("The style-loader cannot be used in a non-browser environment");
        c = c || {};
        c.attrs = "object" === typeof c.attrs ? c.attrs : {};
        c.singleton || "boolean" === typeof c.singleton || (c.singleton = q());
        c.insertInto || (c.insertInto = "head");
        c.insertAt || (c.insertAt = "bottom");
        var d = e(a, c);
        b(d, c);
        return function(a) {
            for (var f, h = [], k = 0; k < d.length; k++) f = u[d[k].id], f.refs--, h.push(f);
            a && (f = e(a, c), b(f, c));
            for (k = 0; k < h.length; k++) if (f = h[k], 0 === f.refs) {
                for (a = 0; a < f.parts.length; a++) f.parts[a]();
                delete u[f.id];
            }
        };
    };
    var qa = function() {
        var a = [];
        return function(b, c) {
            a[b] = c;
            return a.filter(Boolean).join("\n");
        };
    }();
}, function(d, c) {
    d.exports = function(a) {
        var b = "undefined" !== typeof window && window.location;
        if (!b) throw Error("fixUrls requires window.location");
        if (!a || "string" !== typeof a) return a;
        var c = b.protocol + "//" + b.host, d = c + b.pathname.replace(/\/[^\/]*$/, "/");
        return a.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(a, b) {
            b = b.trim().replace(/^"(.*)"$/, function(a, b) {
                return b;
            }).replace(/^'(.*)'$/, function(a, b) {
                return b;
            });
            if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(b)) return a;
            a = 0 === b.indexOf("//") ? b : 0 === b.indexOf("/") ? c + b : d + b.replace(/^\.\//, "");
            return "url(" + JSON.stringify(a) + ")";
        });
    };
} ]);
