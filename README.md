Spark
=====

Spark is a JavaScript web application framework inspired by the great framework
[EmberJS](https://github.com/emberjs/ember.js). Spark, however, is aimed at lazy programmers who
don't like long method names or don't want to follow a predefined naming convention.

Spark.Object
------------

The basic building block of Spark is the `Spark.Object` class. It provides a simple interface for
getting and setting observable properties as well as creating subclasses. New `Spark.Object`
instances are created using the method `Spark.Object.new`. It takes as its parameter an optional
`Object` containing the new `Spark.Object`'s default properties.

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
    fred.observe( 'age', function(){ alert( 'Happy Birthday!' ); } ); // => fred

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

    var fred = Person.new( 'Fred', 42 );
    fred( 'age' ); // => 42
```

Templates with Spark.View
-------------------------

Spark includes browser-side templating with [Jade](https://github.com/visionmedia/jade). These
templates are managed with `Spark.View`. The `Spark.View.new` method takes 3 parameters: a template
string, a jQuery selector, and an `Object` of local variables. The selector and locals are both
optional. If a selector is provided the view will insert itself into the DOM using that selector.
The locals `Object` will be passed to Jade for rendering the template.

```js
    var template    = 'h1 Hello World!';
    var view        = Spark.View.new( template, 'body' );

    // The DOM body will now be:
    //  <body>
    //      <h1>Hello World!</h1>
    //  </body>
```

Any variables in the Jade template will be observed and when they change the DOM will be updated
automatically for you.

```js
    var person      = Spark.Object.new({ name : 'Fred' });
    var template    = 'h1 Hello #{person.name}!';
    var view        = Spark.View.new( template, 'body', { person : person } );

    // The DOM body will now be:
    //  <body>
    //      <h1>Hello Fred!</h1>
    //  </body>

    person( 'name', 'Natalie' );

    // The DOM body will now be:
    //  <body>
    //      <h1>Hello Natalie!</h1>
    //  </body>
```

### Variable Flags

Spark attaches special meaning to template variables using flags after the variable name. For
example, to attach the `!ignore` flag to the variable `#{person.age}` simply put it after the
variable's name like this `#{person.age!ignore}`. The flags that Spark supports are:

 - !bind
 - !ignore
 - !remove

#### !bind

This flag should be used in a tag's attribute list after the name of an event. This will cause the
`Spark.View` to bind to the named event. If you would like to specify a callback function just put
its path in the locals `Object` after the flag. For example, the following would bind the click
event on the span to the property `nameClicked` in the local variable `person`.

```jade
    h1 span( #{click!bind.person.nameClicked} ) #{person.name}
```

#### !ignore

This flag will prevent the `Spark.View` object observing the property specified in the variable. If
the property changes after the `Spark.View` builds the template, the DOM will not be updated.

```js
    var person      = Spark.Object.new({ name : 'Fred' });
    var template    = 'h1 Hello #{person.name!ignore}!';
    var view        = Spark.View.new( template, 'body', { person : person } );

    // The DOM body will now be:
    //  <body>
    //      <h1>Hello Fred!</h1>
    //  </body>

    person( 'name', 'Natalie' );

    // The DOM body will still be:
    //  <body>
    //      <h1>Hello Fred!</h1>
    //  </body>
```

#### !remove

This flag will cause the whole variable to be removed from the template. The following two templates
are the same as far as Jade is concerned:

```jade
    h1 Hello, #{person.name!remove}!
```

```jade
    h1 Hello, !
```

### Nesting Spark.Views

You can nest `Spark.View`s within each other by simply passing the sub-view to the parent view as
local variables and then reading the sub-view's `html` property in the template. Any changes that
happen on the sub-view will propagate upwards and the parent view will update. For example, the
following code nests the `personView` `Spark.View` within the `mainView` `Spark.View`.

```js
    var person          = Spark.Object.new({ name : 'Fred', age : 42 });
    var personTemplate  = 'h1 Hi, my name is #{person.name}. I am #{person.age} years old.';
    var personView      = Spark.View.new( personTemplate, person );

    var mainTemplate    = 'div !{personView.html}';
    var mainView        = Spark.View.new( mainTemplate, 'body', { personView : personView } );

    // The DOM body will now be:
    //  <body>
    //      <div>
    //          <h1>Hello, my name is Fred. I am 42 years old.</h1>
    //      </div>
    //  </body>

    person.increment( 'age' );

    // The DOM body will now be:
    //  <body>
    //      <div>
    //          <h1>Hello, my name is Fred. I am 43 years old.</h1>
    //      </div>
    //  </body>
```

Note that the jQuery selector parameter is left off for the sub-view. This is because it does not
need to insert itself into the DOM, it will be inserted by the parent template.
