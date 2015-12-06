
var mysql = require('mysql');
var gcm = require('node-gcm');
var message = new gcm.Message();

var config = {
    host:"localhost",
    port:"3306",
    user:"root",
    password:"nser1984",
    database:"yo"
};

var conn = mysql.createConnection(config);

// or with object values
var message = new gcm.Message({
        collapseKey: 'demo',
	    delayWhileIdle: true,
	        timeToLive: 3,
		    data: {
			        key1: 'YO from node server.',
				    key2: 'YO push demo'
				  }
});

var server_access_key = 'AIzaSyCSS9hUK0qSah7NnNe7mRgfXgUX-CF0wcw';
var sender = new gcm.Sender(server_access_key);
var registrationIds = [];


exports.add = function(req,res){
	var mregId = req.query.regId;
	var mphone = req.query.phone;
	console.log("insert into user values("+mphone+","+mregId+");");
	conn.query("insert into user values("+mphone+",'"+mregId+"');",function(err){
		if(err){
			res.send("이미 등록되어 있습니다.");
			console.log("reg error/"+err);
		}else{
			console.log("reg success");
			res.send("SUCCESS");	
		}
		
	});
};

exports.send = function(req, res){
	var phone = req.query.phone;
	var registration_id ='';
	conn.query("select regId from user where "+phone+"= phonenum", function(err, rows){
		//registration_id = rows[0].regId;
		registrationIds.push(rows[0].regId);
		sender.send(message, registrationIds, 4, function (err, result) {
        res.send(result);
	});
	});
	// At least one required
	

	/**
	 * Params: message-literal, registrationIds-array, No. of retries, callback-function
	  **/
	
};

exports.list = function(req, res){
    conn.query("select * from user", function(err, rows){
    
	if(err){
	    throw err;
	}

	console.log(rows);
	res.end("respond with a resouirce");
	console.log("Done!");
    });
};







