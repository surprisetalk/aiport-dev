
var path = require('path');
var _ = require('underscore');
var cons = require('consolidate');

var ext = file_name => path.extname( file_name ).substring(1);

var render = ( template_file, data ) =>
    ext( template_file ) in cons
	? cons[ ext( template_file ) ]( template_file, data )
	: Promise.reject( { code: 500, err: "couldn't parse template with extenison '" + ext( template_file ) + "'" } );

var annex = ( template_file, querier, subannexes ) => ( params, query ) =>
{
    if( params.length )
	if( params[0] in subannexes )
	    return subannexes[ params[0] ]( _.rest( params ), query );
	else
	    return Promise.reject( { code: 404, msg: "endpoint /" + params[0] + " not found" } );
    else 
	return querier( query ).then( data => template_file ? render( template_file, data ) : data );
};

module.exports.annex = annex;
