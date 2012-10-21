
(function( window, $, undefined ){

    var EVENT_NAMESPACE = '.spark';
    var EVENT_CHANGE    = 'change.spark';
    var EVENT_MESSAGE   = 'message.spark';
    var EVENT_REMOVE    = 'remove.spark';

    var OBJECT_IS_OBJECT    = '_spark_isObject';
    var OBJECT_PROPS        = '_props';
    var OBJECT_TYPES        = '_types';

    var PROPERTY_TRIGGERS   = '_triggers';

    // ------------------------------------------------------------------------------------------ //

    var $window         = $( window );
    var Array           = window.Array;
    var Object          = window.Object;
    var Event           = $.Event;
    var extend          = $.extend;
    var hasOwnProperty  = Object.hasOwnProperty;

    // ------------------------------------------------------------------------------------------ //

    /// Returns an array containing the keys of the object.
    ///
    /// @param {Object} obj The object to get the keys from.
    ///
    /// @return {Array} An array of strings for the object keys.
    var keys = Object.keys || function( obj ){
        var keys = [];
        for( var i in obj ){
            if( hasOwnProperty.call( obj, i ) ){
                keys.push( i );
            }
        }
        return keys;
    };

    // ------------------------------------------------------------------------------------------ //

    /// Executes the given function after the current call stack with the minimum possible delay.
    ///
    /// @param {Function} The function to execute.
    var nextTick = (function(){
        if( isFunction( window.postMessage ) ){
            // Stolen with love from http://dbaron.org/log/20100309-faster-timeouts
            var timeouts    = [];
            var messageName = 'spark-nextTick-message';

            function handleMessage( event ){
                var originalEvent = event.originalEvent
                if( originalEvent.source == window && originalEvent.data == messageName ){
                    event.stopPropagation();
                    if( timeouts.length > 0 ){
                        (timeouts.shift())();
                    }
                }
            }

            $window.on( 'message', handleMessage );

            return function( func ) {
                timeouts.push( func );
                window.postMessage( messageName, '*' );
            }
        }
        else {
            return function( func ){
                setTimeout( func, 0 );
            }
        }
    })();

    // ------------------------------------------------------------------------------------------ //

    /// Detects if the `predicate` is true for any of the values in `obj`.
    ///
    /// @param {Object|Array}   obj         The object or array to test the values of.
    /// @param {Function(val)}  predicate   The function to test each value with. Should return true
    ///                                     or false.
    ///
    /// @return {Boolean} True if the `predicate` returns true for any of the values in `obj`.
    function any( obj, predicate ){
        if( isArray( obj ) ){
            for( var i = 0; i < obj.length; ++i ){
                if( predicate( obj[ i ] ) ){
                    return true;
                }
            }
        }
        else {
            var objKeys = keys( obj );
            for( var i = 0; i < objKeys.length; ++i ){
                if( predicate( obj[ objKeys[ i ] ] ) ){
                    return true;
                }
            }
        }
        return false;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Like any, but with the opposite results.
    ///
    /// @param {Object|Array}   obj         The object or array to test the values of.
    /// @param {Function(val)}  predicate   The function to test each value with. Should return true
    ///                                     or false.
    ///
    /// @return {Boolean} False if the `predicate` returns true for any of the values in `obj`.
    var none = negate( any );

    // ------------------------------------------------------------------------------------------ //

    /// Detects if the `predicate` is true for all the values in `obj`.
    /// @param {Object|Array}   obj         The object or array to test the values of.
    /// @param {Function(val)}  predicate   The function to test each value with. Should return true
    ///                                     or false.
    ///
    /// @return {Boolean} True if `predicate` returns true for all the values in `obj`.
    function all( obj, predicate ){
        if( isArray( obj ) ){
            for( var i = 0; i < obj.length; ++i ){
                if( !predicate( obj[ i ] ) ){
                    return false;
                }
            }
        }
        else {
            var objKeys = keys( obj );
            for( var i = 0; i < objKeys.length; ++i ){
                if( !predicate( obj[ objKeys[ i ] ] ) ){
                    return false;
                }
            }
        }
        return true;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Creates a function which returns the boolean opposite of `func`.
    ///
    /// @param {Function} func The function to negate.
    ///
    /// @return {Function} A function which returns the boolean opposite of `func`.
    function negate( func ){
        return function(){
            return !func.apply( this, arguments );
        }
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `a` and `b` are loosely equal.
    ///
    /// @return {Boolean} True if `a` and `b` are loosely equal.
    function equal( a, b ){
        return a == b;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `a` and `b` are strictly equal.
    ///
    /// @return {Boolean} True if `a` and `b` are strictly equal.
    function is( a, b ){
        return a === b;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `instance` is an instance of `clas`.
    ///
    /// @param {*} instance The object to check.
    /// @param {*} clas     The class to check if `instance` is an isntance of.
    ///
    /// @return {Boolean} True if `instance` is an instance of `clas`.
    function instanceOf( instance, clas ){
        return instance instanceof clas;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is an Array.
    ///
    /// @return {Boolean} True if `obj` is an Array.
    function isArray( obj ){
        return instanceOf( obj, Array );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a function.
    ///
    /// @return {Boolean} True if `obj` is a function.
    function isFunction( obj ){
        return typeof obj == 'function';
    }

    // ------------------------------------------------------------------------------------------ //

    /// Binds the parameters of `func` without binding the `this` value.
    ///
    /// @param {Function}   func    The function to bind.
    /// @param {*}          ...     The arguments to bind.
    ///
    /// @return {Function} The function `func` with its parameters bound.
    function bindParameters( func ){
        var fn = func;
        arguments[ 0 ] = undefined;
        return fn.bind.apply( fn, arguments );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if any of the values in `obj` are loosely equal to `value`.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} True if any of the values in `obj` are loosely equal to `value`.
    function anyEqual( obj, value ){
        return any( obj, bindParameters( equal, value ) );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Like `anyEqual` but with the opposite result.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} False if any of the values in `obj` are loosely equal to `value`.
    var noneEqual = negate( anyEqual );

    // ------------------------------------------------------------------------------------------ //

    /// Detects if all the values in `obj` are loosely equal to `value`.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} True if all of the values in `obj` are loosely equal to `value`.
    function allEqual( obj, value ){
        return all( obj, bindParameters( equal, value ) );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if any the values in `obj` are strictly equal to `value`.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} True if any of the values in `obj` are strictly equal to `value`.
    function anyAre( obj, value ){
        return any( obj, bindParameters( is, value ) );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Like `anyAre` but with the opposite result.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} False if any of the values in `obj` are stricty equal to `value`.
    var noneAre = negate( anyAre );

    // ------------------------------------------------------------------------------------------ //

    /// Detects if all the values in `obj` are strictly equal to `value`.
    ///
    /// @param {Object|Array}   obj     The object to check the values of.
    /// @param {*}              value   The value to check for.
    ///
    /// @return {Boolean} True if all of the values in `obj` are strictly equal to `value`.
    function allAre( obj, value ){
        return all( obj, bindParameters( is, value ) );
    }

    // ------------------------------------------------------------------------------------------ //

    function _wrapAndExtend( func, clas ){
        var data = {};
        var bound = data.self = func.bind( data );
        extend( bound, clas.prototype );

        var oldDelete = bound.delete;
        bound.delete = function( name ){
            if( name === undefined ){
                delete data.self;
                delete bound;
                delete data;
            }
            return oldDelete.call( this, name );
        };

        return bound;
    }

    // ------------------------------------------------------------------------------------------ //

    /// The core object class of the LW framework.
    var Obj = (function(){

        /// Object constructor.
        ///
        /// @param {Object?} properties Optional object of starting properties.
        function Obj( properties ){
            var self = this;
            self[ OBJECT_IS_OBJECT  ] = true;
            self[ OBJECT_TYPES      ] = [ Obj ];
            self[ OBJECT_PROPS      ] = {};

            if( properties ){
                var propertyNames = keys( properties );
                for( var i = 0; i < propertyNames.length; ++i ){
                    var propertyName = propertyNames[ i ];
                    _createProperty.call( self, propertyName );
                    self.set( propertyName, properties[ propertyName ] );
                }
            }

            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Default property configuration.
        /// @const
        var DEFAULT_PROPERTY = {
            value       : undefined,
            _triggers   : {}
        };

        // -------------------------------------------------------------------------------------- //

        /// Object prototype alias.
        var ObjProto = Obj.prototype;

        // -------------------------------------------------------------------------------------- //

        /// Object property mutator/accessor.
        ///
        /// Returns the value of the property `name` unless a `value` is provided in which case the
        /// property `name` is set to `value`.
        ///
        /// @param {String} name    The name of the property to access or change.
        /// @param {*?}     value   An optional value to set.
        ///
        /// @return {Object|*}  If `value` is provided then this Object instance is returned,
        ///                     otherwise the value of property `name` is returned.
        function _accessor( name, value ){
            if( value === undefined ){
                return this.get( name );
            }
            else {
                return this.set( name, value );
            }
        }

        // -------------------------------------------------------------------------------------- //

        /// Accesses the named property. If the property doesn't exist it is created first.
        ///
        /// @param {String} name The name of the property to retrieve.
        ///
        /// @return {Object} The property.
        function _checkProperty( name ){
            var self = this;
            if( !self[ OBJECT_PROPS ][ name ] ){
                _createProperty.call( self, name );
            }
            return self[ OBJECT_PROPS ][ name ];
        }

        // -------------------------------------------------------------------------------------- //

        /// Creates a new property on this Object with the given `name` and `settings`.
        ///
        /// @param {String}     name        The name of the new property.
        /// @param {Object?}    settings    Optional settings to start the property with.
        ///
        /// @return {Object} This object.
        function _createProperty( name, settings ){
            this[ OBJECT_PROPS ][ name ] = extend( {}, DEFAULT_PROPERTY, settings );
            return this;
        }

        // -------------------------------------------------------------------------------------- //

        /// Triggers the event `eventName` for the property `propertyName` with the give `data`.
        ///
        /// @param {String}     eventName       The name of the event to trigger.
        /// @param {String}     propertyName    The name of the property to trigger the even on.
        /// @param {Object?}    data            Any data to be added to the event object.
        ///
        /// @return {Object} This Object instance.
        function _triggerPropertyEvent( eventName, propertyName, data ){
            var property = _checkProperty.call( this, propertyName );
            var triggers = property[ PROPERTY_TRIGGERS ];
            if( !triggers[ eventName ] ){
                triggers[ eventName ] = true;
                nextTick(function(){
                    triggers[ eventName ] = false;
                    $( property ).trigger( Event( eventName, data ) );

                    if( eventName == EVENT_REMOVE ){
                        $( property ).off( EVENT_NAMESPACE );
                    }
                });
            }
            return this;
        }

        // -------------------------------------------------------------------------------------- //

        /// Creates a new instance of Object.
        ///
        /// @param {Object?} properties Optional object of starting properties.
        ///
        /// @return {Object} A new Object instance.
        Obj.new = function(){
            return Obj.apply(
                _wrapAndExtend(
                    function(){ return _accessor.apply( this.self, arguments ); },
                    Obj
                ),
                arguments
            );
        };

        // -------------------------------------------------------------------------------------- //

        /// Extends the given `subclass` with Object methods.
        ///
        /// The subclass's prototype extended with Object's prototype and a few of Object's static
        /// methods are copied over as well.
        ///
        /// @param {Function} subclass The constructor for the subclass.
        ///
        /// @return {Object} The extended prototype of `subclass`.
        Obj.extend = function( subclass ){
            subclass.extend = Obj.extend;
            return extend( subclass.prototype, this.prototype );
        };

        // -------------------------------------------------------------------------------------- //

        /// Retrieves the value of the property `name`.
        ///
        /// @param {String} name The name of the property to fetch.
        ///
        /// @return {*} The value of property `name` or undefined if the property doesn't exist.
        ObjProto.get = function( name ){
            var val = this[ OBJECT_PROPS ][ name ];
            return val ? val.value : undefined;
        };

        // -------------------------------------------------------------------------------------- //

        /// Sets the value of property `name` to `value`.
        ///
        /// If the property doesn't exist yet it is created first with default parameters.
        ///
        /// The property even 'change' will be triggered.
        ///
        /// @param {String} name    The name of the property to set.
        /// @param {*}      value   The value to set.
        ///
        /// @return {Object} This Object instance.
        ObjProto.set = function( name, value ){
            var prop        = _checkProperty.call( this, name );
            var oldValue    = prop.value;
            if( oldValue != value ){
                prop.value = value;
                _triggerPropertyEvent.call( this, EVENT_CHANGE, name, { oldValue : oldValue } );
            }
            return this;
        };

        // -------------------------------------------------------------------------------------- //

        /// Detects if this Object has the property `name`.
        ///
        /// @param {String} name The name of the property to check for.
        ///
        /// @return {Boolean}   True if this object has a property named `name` even if its value is
        ///                     undefined.
        ObjProto.has = function( name ){
            return this[ OBJECT_PROPS ][ name ] !== undefined;
        };

        // -------------------------------------------------------------------------------------- //

        /// Detects if this Object is an instance of `clas`.
        ///
        /// @param {*} clas The class to check if this object either is, or is a subclass of.
        ///
        /// @return {Boolean}   True if this object is an instance of `clas` or an instance of a
        ///                     subclass of `clas`.
        ObjProto.is = function( clas ){
            return anyAre( this[ OBJECT_TYPES ], clas );
        };

        // -------------------------------------------------------------------------------------- //

        /// Removes the property `name` or deletes this object if no `name` is provided.
        ///
        /// If no `name` is provided all the properties of this object will be deleted followed by
        /// deleting this object.
        ///
        /// The `remove` event will be triggered for any deleted properties.
        ///
        /// @param {String?} name   An optional property name to remove.
        ///
        /// @return {Object?} This object if `name` was provided.
        ObjProto.delete = function( name ){
            var self    = this;
            var props   = self[ OBJECT_PROPS ];
            if( name === undefined ){
                var propNames = keys( props );
                for( var i = 0; i < propNames.length; ++i ){
                    self.delete( propNames[ i ] );
                }
                delete this;
            }
            else if( props[ name ] ){
                _triggerPropertyEvent.call( self, EVENT_REMOVE, name );
                delete props[ name ];
                return self;
            }
        };

        // -------------------------------------------------------------------------------------- //

        /// Adds a new observer to the property `name`.
        ///
        /// The function `callback` will be called whenever the value of property `name` is changed
        /// or if the property is removed.
        ///
        /// @param {String}             name        The name of the property to observe.
        /// @param {Function(event)}    callback    The function to call when the property changes.
        ///
        /// @return {Object} This Object instance.
        ObjProto.observe = function( name, callback ){
            $( _checkProperty.call( this, name ) )
                .on( EVENT_CHANGE, callback )
                .on( EVENT_REMOVE, callback );
            return this;
        };

        // -------------------------------------------------------------------------------------- //

        // Export a few of the private functions as public.
        ObjProto.triggerPropertyEvent = _triggerPropertyEvent;
        ObjProto.prop = _accessor;

        // -------------------------------------------------------------------------------------- //

        return Obj;
    })();

    // ------------------------------------------------------------------------------------------ //

    /// The View class represents an auto-updating template. It will observe all properties in the
    /// template and whenever their values change it will rebuild itself and update the DOM.
    ///
    /// Templates are written in plain Jade. Any variables in the template are automatically watched
    /// for changes. If you don't want to watch a variable just suffix it with `!ignore`. For
    /// example, the following template would be updated anytime `person.name` is changed but not
    /// `person.age`.
    ///
    /// @code
    ///     h1 Hello #{person.name}, you are #{person.age!ignore}.
    /// @endcode
    ///
    /// The suffix `!ignore` will be removed from the template before being processed by Jade.
    ///
    var View = (function(){

        /// View constructor.
        ///
        /// @param {String}     template    The template to build.
        /// @param {jQuery}     target      The element(s) to put the built template into.
        /// @param {Object?}    locals      The values to build the template with.
        function View( template, target, locals ){
            var self = this;
            self[ OBJECT_TYPES ].push( View );
        }

        var VIEW_PROPERTIES = {
        };

        var ViewProto = Obj.extend( View );

        View.new = function(){
            var obj = Obj.new( VIEW_PROPERTIES );
            extend( obj, ViewProto );
            View.apply( obj, arguments );
            return obj;
        };

        return View;
    })();

    // Exports.
    window.Spark = {
        $           : $,
        all         : all,
        allAre      : allAre,
        allEqual    : allEqual,
        any         : any,
        anyAre      : anyAre,
        anyEqual    : anyEqual,
        extend      : extend,
        isArray     : isArray,
        isFunction  : isFunction,
        keys        : keys,
        negate      : negate,
        nextTick    : nextTick,
        none        : none,
        noneAre     : noneAre,
        noneEqual   : noneEqual,
        Object      : Obj,
        View        : View
    };
})( window, jQuery );
