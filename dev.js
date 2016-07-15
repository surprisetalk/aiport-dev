
var path = require('path');
var _ = require('underscore');
var cons = require('consolidate');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/test');

// TODO: change to annexer, piler, and scrapper

//==============================================

var ext = file_name => path.extname( file_name ).substring(1);

var render = ( template_file, data ) =>
    ext( template_file ) in cons
	? cons[ ext( template_file ) ]( template_file, data )
	: Promise.reject( { code: 500, msg: "couldn't parse template with extenison '" + ext( template_file ) + "'" } );

var annex = ( template_file, querier, subannexes ) => ( params, query ) =>
{
    // console.log( template_file, querier, subannexes );
    if( params.length )
	if( params[0] in subannexes )
	    return subannexes[ params[0] ]( _.rest( params ), query );
	else
	    return Promise.reject( { code: 404, msg: "endpoint /" + params[0] + " not found" } );
    else 
	return querier( query ).then( data => template_file ? render( template_file, data ) : data );
};

module.exports.annex = annex;

//==============================================

var piler = model => 
({
    create: data => ( new model( data ) ).save( ( err, thing ) => err ? Promise.reject( { code: 500, msg: err } ) : Promise.resolve( thing ) ),
    update: data => _.isObject( data ) && "query" in data 
                    ? model.update( data.query, "update" in data ? data.update : {} )
                        .exec( thing => { console.log( thing ); return thing; } )
                        .catch( err => Promise.reject( { code: 500, msg: err } ) )
                    : Promise.reject( { code: 500, msg: "model does not contain member 'query'" } ),
    remove: data => model.remove( data ),
    fetch:  data => model.find( data ),
    first:  data => model.findOne( data )
});

// TODO: these should be able to be accessed at /pile/:pile/:method
// TODO: add argument for controllers that extend the other object
// TODO: error handling
var pile = ( name, schema ) => 
    piler( mongoose.model( name, new Schema( schema ) ) );
    // name in piles 
    // 	// TODO: this should just be 'aiport-pile-...' at some point
    // 	? mongoose.model( name, require( "../aiport-pile-" + name ) )
    // 	: Promise.reject( { code: 404, msg: name + " is not a valid pile" } );

module.exports.pile = pile;

//==============================================

// TODO: give tools for working with templating engines
// TODO: catch renderers so that only the pagelets break, not the entire page

// f can return html or a promise that returns html
// scrapper eventually returns a promise that returns html
var scrapper = f => ( options, htmler ) => query =>
    Promise.resolve( f( options, query, htmler ) );

module.exports.scrap = scrapper;
