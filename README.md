Spark
=====

Spark is a JavaScript web application framework inspired by the great framework
[EmberJS](https://github.com/emberjs/ember.js). Spark, however, is aimed at lazy programmers who
don't like long method names or don't want to follow a predefined naming convention.

Spark.Object
------------

The basic building block of Spark is the Spark.Object class. It provides a simple interface for
getting and setting observable properties as well as creating subclasses. New Spark.Object instances
are created using the method `Spark.Object.new`. It takes as its parameter an optional `Object`
containing the new `Spark.Object`'s default properties.

```js
    var fred = Spark.Object.new( { name : 'Fred', age : 42 } );
```

You can get or set properties on a `Spark.Object` by simply calling it as a function, passing the
property name as the first parameter, and the value as the second (or no value at all if you want to
get the current value). Checking for the existance of a property can be done with the method
`Spark.Object.has`.

```js
    fred( 'age' ); // => 42
    fred( 'occupation', 'Marketing' ); // => fred
    fred.has( 'occupation' ); // => true
    fred.has( 'hair' ); // => false
```

Unless otherwise noted, all `Spark.Object` methods return themselves for chaining.

```js
    fred( 'height' : '5\'7"' )( 'height' ); // => 5'7"
```

You can also get and set properties using the `Spark.Object.get` and `Spark.Object.set` methods.
`Spark.Object.set` has the benefit of being able to take an `Object` as its first and only parameter
instead of a name-value pair to set multiple values at once.

```js
    fred.set( 'ethnicity', 'Korean' ); // => fred
    fred.set({ location : 'San Francisco', gender : 'male' }); // => fred
    fred.get( 'location' ); // => San Francisco
```

All properties on a `Spark.Object` can be observed for changes by passing a property name and
callback to `Spark.Object.observe`. Observers will be called on the next tick of the browser's event
loop and will only be called once per call stack.

```js
    fred.observe( 'age', function(){ alert( 'Happy Birthday!' ); } ) // => fred

    // This only causes the alert to happen once.
    fred.increment( 'age' )
        .increment( 'age' ); // => fred

    // The alert will be triggered each time the interval fires (once per year).
    setInterval(function(){
        fred.increment( 'age' );
    }, 1000 * 60 * 60 * 24 * 365 ); // One year in milliseconds
```

Properties can be removed by using the `Spark.Object.delete` method. If no property name is provided
all properties are removed and the `Spark.Object` destroys itself.

```js
    fred.has( 'occupation' ); // => true
    fred.delete( 'occupation' ); // => fred
    fred.has( 'occupation' ); // => false

    fred.delete(); // => undefined
    // Fred no longer exists as a `Spark.Object`. Any attempts to use it as a `Spark.Object` after
    // deleting it will result in an error.
```

Subclassing Spark.Object
------------------------

Subclassing `Spark.Object` is very easy, just pass the subclass' constructor to the static method
`Spark.Object.extend`. The subclass will have the static members `extend` and `new` added for you
and the subclass' prototype will be extended with `Spark.Object`'s prototype and returned.

```js
    function Person( name, age ){
        this.set({ name : name, age : age });
    }
    Spark.Object.extend( Person ); // => Person.prototype

    var fred = Person.new( 'Fred', '42' );
    fred( 'age' ); // => 42
```
