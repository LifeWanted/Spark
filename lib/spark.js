
(function( window, $, undefined ){

    var ARRAY_ARRAY = [];

    var EVENT_NAMESPACE = '.spark';
    var EVENT_CHANGE    = 'change.spark';
    var EVENT_MESSAGE   = 'message.spark';
    var EVENT_REMOVE    = 'remove.spark';

    var OBJECT_IS_OBJECT        = '_spark_isObject';
    var OBJECT_PROPS            = '_props';
    var OBJECT_TYPES            = '_types';
    var OBJECT_JQUERY_HANDLE    = '_jQueryHandle';
    var OBJECT_GUID             = '_guid';

    var VIEW_RAW_TEMPLATE       = '_rawTemplate';
    var VIEW_TEMPLATE           = '_template';
    var VIEW_LOCALS             = '_locals';
    var VIEW_TARGET             = '_target';
    var VIEW_DELEGATED_EVENTS   = '_delegatedEvents';
    var VIEW_POST_BUILD_EVENTS  = '_postBuildEvents';
    var VIEW_LAST_MODIFIED_TIME = 'lastModifiedTime';
    var VIEW_HTML               = 'html';
    var VIEW_BUILD_COUNT        = 'buildCount';
    var VIEW_RECAST_EVENT       = 'data-spark-recast-event-';
    var VIEW_RECAST_EVENT_CAML  = 'sparkRecastEvent';

    var PROPERTY_TRIGGERS   = '_triggers';

    // ------------------------------------------------------------------------------------------ //

    var $window         = $( window );
    var Array           = window.Array;
    var Object          = window.Object;
    var Number          = window.Number;
    var Function        = window.Function;
    var isNaN           = window.isNaN;
    var Event           = $.Event;
    var extend          = $.extend;
    var makeArray       = $.makeArray;
    var hasOwnProperty  = Object.hasOwnProperty;

    // ------------------------------------------------------------------------------------------ //

    var guidCounter = 0;

    // ------------------------------------------------------------------------------------------ //

    // Stolen with love from Mozilla Developer Network.
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    if( !Function.prototype.bind ){
        Function.prototype.bind = function( oThis ){
            var self = this;
            if( isFunction( self ) ){
                throw new TypeError('Can not bind to non-function objects.');
            }

            var slice = Array.prototype.slice;
            var aArgs = slice.call( arguments, 1 );
            var fToBind = self;
            var fNOP = function(){};
            var fBound = function(){
                return fToBind.apply(
                    instanceOf( self, fNOP ) && oThis
                        ? self
                        : oThis,
                    aArgs.concat( slice.call( arguments ) )
                );
            };

            fNOP.prototype = self.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

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

    /// Detects if `obj` is a jQuery object.
    ///
    /// @return {Boolean} True if `obj` is a jQuery object.
    function isjQuery( obj ){
        return instanceOf( obj, $ );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` can be converted to a Number.
    ///
    /// @return {Boolean} True if `obj` can be converted to a Number.
    function isNumeric( obj ){
        return !isNaN( obj );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a plain JavaScript Object.
    ///
    /// @return {Boolean} True if `obj` is a plain JavaScript Object.
    function isPlainObject( obj ){
        return obj && obj.constructor === Object;
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a Spark.Array object.
    ///
    /// @return {Boolean} True if `obj` is a Spark.Array object.
    function isSparkArray( obj ){
        return isSparkObject( obj ) && obj.is( Arr );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a Spark.Object object.
    ///
    /// @return {Boolean} True if `obj` is a Spark.Object object.
    function isSparkObject( obj ){
        return obj && obj[ OBJECT_IS_OBJECT ];
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a Spark.View object.
    ///
    /// @return {Boolean} True if `obj` is a Spark.View object.
    function isSparkView( obj ){
        return isSparkObject( obj ) && obj.is( View );
    }

    // ------------------------------------------------------------------------------------------ //

    /// Detects if `obj` is a plain string.
    ///
    /// @return {Boolean} True if `obj` is a plain string.
    function isString( obj ){
        return typeof obj == 'string';
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

    /// Bubbles the `event` up from a property to this Spark.Object.
    ///
    /// @param {Event} event The event to bubble.
    ///
    /// @return {Spark.Object} This Spark.Object instance.
    function _bubblePropertyEvent( event ){
        var self = this;
        var originalEvent = event.originalEvent;
        if(
            event.isPropagationStopped() ||
            (originalEvent && originalEvent.isPropagationStopped())
        ){
            return self;
        }

        var bubbleEvent = Event( event );
        bubbleEvent[ OBJECT_GUID ] = self[ OBJECT_GUID ];
        self[ OBJECT_JQUERY_HANDLE ].trigger( bubbleEvent );
        return self;
    }

    // ------------------------------------------------------------------------------------------ //

    function _preparePropertyValue( obj, value ){
        // Convert plain objects and arrays to Spark.Objects.
        if( isArray( value ) ){
            value = Arr.new( value );
        }
        else if( isPlainObject( value ) ){
            value = Obj.new( value );
        }

        // Observe Spark.Objects for changes, and bind functions to be executed on this object.
        if( isSparkObject( value ) ){
            value.on( EVENT_CHANGE, _bubblePropertyEvent.bind( obj ) );
        }
        else if( isFunction( value ) ){
            value = value.bind( obj );
        }
        return value;
    }

    // ------------------------------------------------------------------------------------------ //

    /// The core object class of the Spark framework.
    var Obj = (function(){

        /// Spark.Object constructor.
        ///
        /// @param {Object?} properties Optional object of starting properties.
        function Obj( properties ){
            var self = this;
            self[ OBJECT_IS_OBJECT      ] = true;
            self[ OBJECT_TYPES          ] = [ Obj ];
            self[ OBJECT_PROPS          ] = {};
            self[ PROPERTY_TRIGGERS     ] = {};
            self[ OBJECT_JQUERY_HANDLE  ] = $( self );
            self[ OBJECT_GUID           ] = ++guidCounter;

            if( properties ){
                self.set( properties );
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
        /// @return {Spark.Object|*}    If `value` is provided then this Spark.Object instance is
        ///                             returned, otherwise the value of property `name` is
        ///                             returned.
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
        /// @return {Spark.Object} This Spark.Object instance.
        function _createProperty( name, settings ){
            this[ OBJECT_PROPS ][ name ] = extend( extend( true, {}, DEFAULT_PROPERTY ), settings );
            return this;
        }

        // -------------------------------------------------------------------------------------- //

        /// Triggers the event `eventName` for the property `propertyName` with the give `data`.
        ///
        /// @param {String}     eventName       The name of the event to trigger.
        /// @param {String}     propertyName    The name of the property to trigger the even on.
        /// @param {Object?}    data            Any data to be added to the event object.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        function _triggerPropertyEvent( eventName, propertyName, data ){
            var self        = this;
            var property    = _checkProperty.call( self, propertyName );
            var triggers    = property[ PROPERTY_TRIGGERS ];
            data = data || {};
            data[ OBJECT_GUID ] = self[ OBJECT_GUID ];
            data.name = propertyName;
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

            // Also trigger a change event on this object.
            self.trigger( EVENT_CHANGE, { property : propertyName } );

            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Sets a property value and handles converting the value as well as triggering events.
        ///
        /// @param {Object} prop    The property to change the value of.
        /// @param {String} name    The name of the property.
        /// @param {*}      value   The new value of the property.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        function _setValue( prop, name, value ){
            var self            = this;
            var oldValue        = prop.value;
            prop.value = value  = _preparePropertyValue( self, value );
            _triggerPropertyEvent.call(
                self,
                EVENT_CHANGE,
                name,
                { oldValue : oldValue, value : value }
            );
            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Wraps a callback function such that it will only be triggered if the event's guid
        /// matches this Spark.Object's guid.
        ///
        /// @param {Function} callback The callback function to wrap.
        ///
        /// @return {Function(Event)} A function wrapping the callback.
        function _callbackWrapper( callback ){
            var guid = this[ OBJECT_GUID ];
            return function( event ){
                if( event[ OBJECT_GUID ] == guid ){
                    return callback.apply( this, arguments );
                }
            };
        }

        // -------------------------------------------------------------------------------------- //

        /// Creates a new instance of Spark.Object.
        ///
        /// @param {Object?} properties Optional object of starting properties.
        ///
        /// @return {Spark.Object} A new Object instance.
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

        /// Extends the given `subClass` with Spark.Object methods.
        ///
        /// The subClass's prototype extended with Object's prototype and a few of Object's static
        /// methods are copied over as well.
        ///
        /// @param {Function} subClass The constructor for the subClass.
        ///
        /// @return {Object} The extended prototype of `subClass`.
        Obj.extend = function( subClass ){
            var baseClass       = this;
            var subClassProto   = subClass.prototype;
            subClass.extend     = baseClass.extend;
            subClass.new        = function(){
                var obj = baseClass.new();
                extend( obj, subClassProto );
                obj[ OBJECT_TYPES ].push( subClass );
                subClass.apply( obj, arguments );
                return obj;
            };

            return extend( subClassProto, baseClass.prototype );
        };

        // -------------------------------------------------------------------------------------- //

        /// Retrieves the value of the property `name`.
        ///
        /// @param {String} name The name of the property to fetch.
        ///
        /// @return {*} The value of property `name` or undefined if the property doesn't exist.
        ObjProto.get = function( name ){
            var prop = this[ OBJECT_PROPS ][ name ];
            return prop ? prop.value : undefined;
        };

        // -------------------------------------------------------------------------------------- //

        /// Sets the value of property `name` to `value`.
        ///
        /// If the property doesn't exist yet it is created first with default parameters. If no
        /// `value` is provided then `name` must be an object whose keys will be iterated as new
        /// properties to add.
        ///
        /// The property event 'change' will be triggered.
        ///
        /// @param {String|Object}  name    The name of the property to set.
        /// @param {*?}             value   The value to set.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        ObjProto.set = function( name, value ){
            var self = this;
            if( value === undefined ){
                var propertyNames = keys( name );
                for( var i = 0; i < propertyNames.length; ++i ){
                    var propertyName = propertyNames[ i ];
                    self.set( propertyName, name[ propertyName ] );
                }
            }
            else {
                var prop = _checkProperty.call( self, name );
                if( prop.value !== value ){
                    _setValue.call( self, prop, name, value );
                }
            }
            return self;
        };

        // -------------------------------------------------------------------------------------- //

        /// Detects if this Spark.Object has the property `name`.
        ///
        /// @param {String} name The name of the property to check for.
        ///
        /// @return {Boolean}   True if this object has a property named `name` even if its value is
        ///                     undefined.
        ObjProto.has = function( name ){
            return this[ OBJECT_PROPS ][ name ] !== undefined;
        };

        // -------------------------------------------------------------------------------------- //

        /// Detects if this Spark.Object is an instance of `clas`.
        ///
        /// @param {*} clas The class to check if this object either is, or is a subclass of.
        ///
        /// @return {Boolean}   True if this object is an instance of `clas` or an instance of a
        ///                     subclass of `clas`.
        ObjProto.is = function( clas ){
            return anyAre( this[ OBJECT_TYPES ], clas );
        };

        // -------------------------------------------------------------------------------------- //

        /// Increments the value of property `name`. If the property doesn't exist it is set to 1.
        ///
        /// @param {String} name The name of the property to increment.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        ObjProto.increment = function( name ){
            var previousValue = _checkProperty.call( this, name ).value;
            return this.set( name, previousValue ? ++previousValue : 1 );
        };

        // -------------------------------------------------------------------------------------- //

        /// Decrements the value of property `name`. If the property doesn't exist it is set to -1.
        ///
        /// @param {String} name The name of the property to decrement.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        ObjProto.decrement = function( name ){
            var previousValue = _checkProperty.call( this, name ).value;
            return this.set( name, previousValue ? --previousValue : -1 );
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
        /// @return {Spark.Object?} This Spark.Object if `name` was provided.
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

        /// Turns this Spark.Object into a normal JavaScript Object.
        ///
        /// The properties of this Spark.Object are copied into a new JavaScript Object. Any
        /// properties which are Spark.Objects are also normalized before being copied.
        ///
        /// @return {Object}    A plain JavaScript Object containing all the properties of this
        ///                     Spark.Object.
        ObjProto.normalize = function(){
            var properties      = this[ OBJECT_PROPS ];
            var propertyNames   = keys( properties );
            var normalized      = {};
            for( var i = 0; i < propertyNames.length; ++i ){
                var name = propertyNames[ i ];
                var prop = properties[ name ].value;
                if( isSparkObject( prop ) ){
                    normalized[ name ] = prop.normalize();
                }
                else {
                    normalized[ name ] = prop;
                }
            }
            return normalized;
        };

        // -------------------------------------------------------------------------------------- //

        /// Adds a new handler for the event `eventName` on the property `propertyName` or to this
        /// `Spark.Object` if no `propertyName` is provided.
        ///
        /// @param {String}             eventName       The name of the event to bind to.
        /// @param {String?}            propertyName    The name of a property to observe.
        /// @param {Function(event)}    callback        The function to handle the event.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        ObjProto.on = function( eventName, propertyName, callback ){
            var self = this;
            if( isFunction( propertyName ) && !callback ){
                callback = propertyName;
                propertyName = undefined;
            }
            callback = _callbackWrapper.call( self, callback );
            if( propertyName ){
                $( _checkProperty.call( self, propertyName ) ).on( eventName, callback );
            }
            else {
                self[ OBJECT_JQUERY_HANDLE ].on( eventName, callback );
            }
            return self;
        };

        // -------------------------------------------------------------------------------------- //

        /// Triggers the event `eventName` on the property `propertyName` or on this `Spark.Object`
        /// if no `propertyName` is provided.
        ///
        /// @param {String}     eventName       The name of the event to trigger.
        /// @param {String?}    propertyName    The name of a property to trigger the event on.
        /// @param {Object?}    data            Any extra data to be sent with the event.
        ///
        /// @return {Spark.Object} This Spark.Object instance.
        ObjProto.trigger = function( eventName, propertyName, data ){
            var self = this;
            if( isString( propertyName ) ){
                data = data || {};
                data[ OBJECT_GUID ] = self[ OBJECT_GUID ];
                _triggerPropertyEvent.call( self, eventName, propertyName, data );
            }
            else {
                data                = propertyName || {};
                propertyName        = undefined;
                data[ OBJECT_GUID ] = self[ OBJECT_GUID ];
                self[ OBJECT_JQUERY_HANDLE ].trigger( Event( eventName, data ) );
            }
            return self;
        };

        // -------------------------------------------------------------------------------------- //

        return Obj;
    })();

    // ------------------------------------------------------------------------------------------ //

    /// The View class represents an auto-updating template. It will observe all properties in the
    /// template and whenever their values change it will rebuild itself and update the DOM.
    ///
    /// Templates are written in Jade with a few minor extensions. Any variables in the template
    /// are automatically watched for changes. If you don't want to watch a variable just suffix it
    /// with `!ignore`. For example, the following template would be updated anytime `person.name`
    /// is changed but not `person.age`.
    ///
    /// @code
    ///     h1 Hello #{person.name}, you are #{person.age!ignore}.
    /// @endcode
    ///
    /// The suffix `!ignore` will be removed from the template before being processed by Jade.
    ///
    /// Views will also automatically bind to events for you and act as a delegate for them. To do
    /// this simply put the event name followed by `!bind` in the element's attributes. For example,
    /// the following template would trigger a 'click' event on the view if the element were clicked
    /// on.
    ///
    /// @code
    ///     div( #{click!bind} ) Click me!
    /// @endcode
    ///
    /// This would result in the following HTML code being generated by Jade:
    ///
    /// @code
    ///     <div data-spark-recast-event-click>Click me!</div>
    /// @endcode
    ///
    /// Spark uses the attribute `data-spark-recast-event-*` to bind events.
    ///
    /// You can also have events trigger functions in local object properties by following `!bind`
    /// with the path to the handler function. For example, the following would call the method
    /// `person.nameClicked` when the div is clicked on:
    ///
    /// @code
    ///     div( #{click!bind.person.nameClicked} ) Click me!
    /// @endCode
    ///
    /// Which will be compiled to the following HTML by Jade:
    ///
    /// @code
    ///     <div data-spark-recast-event-click="person.nameClicked">Click me!</div>
    /// @endCode
    ///
    /// When nesting Spark.View objects, don't give the sub-Views a target. Instead in the parent
    /// view simply have the variable `!{view.html}` where you want the subview's html to go. For
    /// example, the following Jade template has two nested views, `bob` and `alice`:
    ///
    /// @code
    ///     h1 Bob
    ///     div !{bob.html}
    ///
    ///     h1 Alice
    ///     div !{alice.html}
    /// @endcode
    ///
    /// @par Variable Flags
    /// @li !ignore Ignore the variable entirely.
    /// @li !bind   Bind to the event the variable names.
    /// @li !remove Remove the variable from the template.
    var View = (function(){

        /// View constructor.
        ///
        /// @param {String}     template    The template to build.
        /// @param {jQuery?}    target      The element(s) to put the built template into.
        /// @param {Object?}    locals      The values to build the template with.
        function View( template, target, locals ){
            if( target && !isString( target ) && !isjQuery( target ) && !locals ){
                locals = target;
                target = null;
            }

            var self = this;
            self.set( VIEW_PROPERTIES );
            self[ VIEW_LOCALS               ] = Obj.new( locals );
            self[ VIEW_TARGET               ] = target ? $( target ) : null;
            self[ VIEW_DELEGATED_EVENTS     ] = {};
            self[ VIEW_POST_BUILD_EVENTS    ] = {};
            _setTemplate.call( self, template || '' );
            self( VIEW_LAST_MODIFIED_TIME, new Date() )
                .on( EVENT_CHANGE, VIEW_LAST_MODIFIED_TIME, _buildTemplate.bind( self ) );
        }

        // -------------------------------------------------------------------------------------- //

        var FLAG_BIND   = /!bind\b/;
        var FLAG_IGNORE = /!ignore\b/;
        var FLAG_REMOVE = /!remove\b/;

        var REGEX_JADE_VAR          = /([#!])\{([^!\}]+)((?:!\w+)+((?:\.\w+)+)?)?\}/g;
        var REGEX_NO_BUBBLE_EVENT   = /^(?:blur|focus)$/;

        var VIEW_PROPERTIES = {}
        VIEW_PROPERTIES[ VIEW_LAST_MODIFIED_TIME ]  = null;
        VIEW_PROPERTIES[ VIEW_HTML ]                = null;
        VIEW_PROPERTIES[ VIEW_BUILD_COUNT ]         = 0;

        // -------------------------------------------------------------------------------------- //

        var ViewProto = Obj.extend( View );

        // -------------------------------------------------------------------------------------- //

        /// Prepares a new template string by binding observers to its variables and parsing it.
        ///
        /// @param {String} template The template to prepare.
        ///
        /// @return {Spark.View} This Spark.View instance.
        function _setTemplate( template ){
            var self = this;
            self[ VIEW_RAW_TEMPLATE ] = template;
            self[ VIEW_TEMPLATE ] = jade.compile(
                template.replace( REGEX_JADE_VAR, _checkTemplateVariable.bind( self ) )
            );
            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Checks the flags of a template variable and binds observers if it isn't to be ignored.
        ///
        /// @param {String}     match           The full variable match.
        /// @param {String}     prefix          The variable interpolation prefix ('!' or '#').
        /// @param {String}     variable        The name of the variable.
        /// @param {String?}    flags           Any flags on the variable.
        /// @param {String?}    flagVariable    The variable associated with the flags.
        /// @param {Number}     offset          The variable's offset into the template.
        /// @param {String}     template        The template.
        ///
        /// @return {String} The matched variable with flags removed.
        function _checkTemplateVariable( match, prefix, variable, flags, flagVariable, offset, template ){
            if( offset && template[ offset - 1 ] == '\\' ){
                return match;
            }
            else if( FLAG_IGNORE.test( flags ) ){
            }
            else if( FLAG_REMOVE.test( flags ) ){
                return '';
            }
            else if( FLAG_BIND.test( flags ) ){
                var recastEventProperty = VIEW_RECAST_EVENT + variable;
                var recastValue = (flagVariable ? '="' + flagVariable.substr( 1 ) + '"' : '');
                _bindEvent.call( this, variable );
                return recastEventProperty + recastValue + ',';
            }
            else {
                _bindObserver.call( this, variable );
            }

            return prefix + '{' + variable + '}';
        }

        // -------------------------------------------------------------------------------------- //

        /// Binds the event `eventName` to re-emit through this Spark.View object or one of its
        /// locals.
        ///
        /// @param {String} eventName The name of the event to bind.
        ///
        /// @return {Spark.View} This Spark.View instance.
        function _bindEvent( eventName ){
            var self = this;
            if( REGEX_NO_BUBBLE_EVENT.test( eventName ) ){
                if( !self[ VIEW_POST_BUILD_EVENTS ][ eventName ] ){
                    self[ VIEW_POST_BUILD_EVENTS ][ eventName ] = true;
                }
            }
            else {
                if( !self[ VIEW_DELEGATED_EVENTS ][ eventName ] ){
                    self[ VIEW_DELEGATED_EVENTS ][ eventName ] = true;
                    self[ VIEW_TARGET ].on(
                        eventName,
                        '[' + VIEW_RECAST_EVENT + eventName + ']',
                        _recastEvent.bind( self )
                    );
                }
            }
            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Walks the given `path` through the Spark.View's local properties. The callback will be
        /// called with the terminal object and property name.
        ///
        /// @param {String}                         path        A dot deliminated path to traverse.
        /// @param {Function(Spark.Object, String)} callback    The function to call at the end.
        ///
        /// @throws {Error} If the path results in a dead end.
        ///
        /// @return {Spark.View} This Spark.View instance.
        function _walkLocalsPath( path, callback ){
            var splitPath   = path.split( '.' );
            var lastIndex   = splitPath.length - 1;
            var obj         = this[ VIEW_LOCALS ];
            for( var i = 0; obj && i < lastIndex; ++i ){
                obj = obj( splitPath[ i ] );
            }
            if( !obj ){
                throw new Error( 'Unable to find variable: ' + path );
            }
            callback( obj, splitPath[ lastIndex ] );
            return this;
        }

        // -------------------------------------------------------------------------------------- //

        /// Sets an observer on the property at the given path into the locals.
        ///
        /// @param {Array} path The variable path.
        ///
        /// @return {Spark.View} This Spark.View instance.
        function _bindObserver( path ){
            var self = this;
            _walkLocalsPath.call( self, path, function( obj, propertyName ){
                obj.on( EVENT_CHANGE, propertyName, _triggerBuildTemplate.bind( self ) );
            });
            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Updates this Spark.View's last modified time, triggering a rebuild of the template.
        ///
        /// @return {Spark.View} This Spark.View instance.
        function _triggerBuildTemplate(){
            return this( VIEW_LAST_MODIFIED_TIME, new Date() );
        }

        // -------------------------------------------------------------------------------------- //

        /// Reconstructs the compiled template and inserts it into the DOM.
        ///
        /// @return {Spark.View} This {Spark.View} instance.
        function _buildTemplate(){
            // Rebuild the template.
            var self    = this;
            var $target = self[ VIEW_TARGET ];
            var html    = self[ VIEW_TEMPLATE ]( self[ VIEW_LOCALS ].normalize() );
            self.increment( VIEW_BUILD_COUNT );
            self( VIEW_HTML, html );

            // If we have a target, put the built template there and rebind the non-bubbling events.
            if( $target ){
                $target.html( html );

                // Then bind to all the non-bubbling events we need.
                var noBubbleEventNames = keys( self[ VIEW_POST_BUILD_EVENTS ] );
                for( var i = 0; i < noBubbleEventNames.length; ++i ){
                    var eventName = noBubbleEventNames[ i ];
                    $target.find( '[' + VIEW_RECAST_EVENT + eventName + ']' )
                        .on( eventName, _recastEvent.bind( self ) );
                }
            }

            return self;
        }

        // -------------------------------------------------------------------------------------- //

        /// Either re-emits the `event` on this Spark.View object or calls the handler specified by
        /// the `data-spark-recast-event-*` property's value.
        ///
        /// @param {Event} event The event to recast or handle.
        ///
        /// @return {*} The result of the handler function if a handler was called, otherwise
        ///             undefined.
        function _recastEvent( event ){
            var self                = this;
            var type                = event.type;
            var capitalType         = type[ 0 ].toUpperCase() + type.substr( 1 );
            var recastEventProperty = VIEW_RECAST_EVENT_CAML + capitalType;
            var recastTarget        = $( event.target ).data( recastEventProperty );
            if( recastTarget ){
                var res;
                _walkLocalsPath.call( self, recastTarget, function( obj, propertyName ){
                    var val = obj( propertyName );
                    if( isFunction( val ) ){
                        res = val.call( obj, event );
                    }
                });
                return res;
            }
            else {
                self.trigger( event.type + EVENT_NAMESPACE, event );
            }
        }

        // -------------------------------------------------------------------------------------- //

        return View;
    })();

    // ------------------------------------------------------------------------------------------ //

    /// The Array class provides an observable array.
    var Arr = (function(){
        /// 
        function Arr( array ){
            this[ ARRAY_ARRAY ] = [];
            this.push.apply( this, array );
        }

        var ArrProto = Obj.extend( Arr );
        var ObjGet = ArrProto.get;
        var ObjSet = ArrProto.set;

        ArrProto.push = function(){
            var self        = this;
            var array       = makeArray( arguments );
            var dataLength  = self[ ARRAY_ARRAY ].length;
            for( var i = 0; i < array.length; ++i ){
                self.set( dataLength + i, array[ i ] );
            }
            return self;
        };

        ArrProto.get = function( index ){
            return isNumeric( index ) ? this[ ARRAY_ARRAY ][ Number( index ) ] : ObjGet.call( this, index );
        };

        ArrProto.set = function( index, value ){
            var self = this;
            if( isNumeric( index ) ){
                index           = Number( index );
                var array       = self[ ARRAY_ARRAY ];
                var oldValue    = array[ index ];
                value           = _preparePropertyValue( self, value );
                array[ index ]  = value;
                self( 'length', array.length );
                self.trigger( EVENT_CHANGE, { index : index, oldValue : oldValue, value : value } );
            }
            else {
                ObjSet.apply( self, arguments );
            }
            return self;
        };

        ArrProto.normalize = function(){
            var array       = this[ ARRAY_ARRAY ];
            var normalized  = [];
            for( var i = 0; i < array.length; ++i ){
                var val = array[ i ];
                normalized.push( isSparkObject( val ) ? val.normalize() : val );
            }
            return normalized;
        };

        return Arr;
    })();

    // Exports.
    window.Spark = {
        $               : $,
        all             : all,
        allAre          : allAre,
        allEqual        : allEqual,
        any             : any,
        anyAre          : anyAre,
        anyEqual        : anyEqual,
        Array           : Arr,
        extend          : extend,
        isArray         : isArray,
        isFunction      : isFunction,
        isjQuery        : isjQuery,
        isNumeric       : isNumeric,
        isPlainObject   : isPlainObject,
        isString        : isString,
        isSparkArray    : isSparkArray,
        isSparkObject   : isSparkObject,
        isSparkView     : isSparkView,
        keys            : keys,
        makeArray       : makeArray,
        negate          : negate,
        nextTick        : nextTick,
        none            : none,
        noneAre         : noneAre,
        noneEqual       : noneEqual,
        Object          : Obj,
        View            : View
    };
})( window, jQuery );
