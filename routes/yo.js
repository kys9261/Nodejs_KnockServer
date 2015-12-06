var path = require('path');
var fs = require('fs');
var im = require('imagemagick');
var easyimage = require('easyimage');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var mysql = require('mysql');
var gcm = require('node-gcm');
var message = new gcm.Message();

var config = {
    host:"localhost",
    port:"3306",
    user:"root",
    password:"",
    database:"yo"
};

var conn = mysql.createConnection(config);

var server_access_key = '';
var sender = new gcm.Sender(server_access_key);
var registrationIds = [];


exports.adduser = function(req,res){
    var phone = req.body.phonenum;
    var uid = req.body.uid;
    var puid = req.body.puid;
    var username = req.body.username;
    var image = req.body.img;;
    
    console.log("Adduser Request => phone "+phone+" / uid"+uid+" / puid "+puid);
   conn.query("insert into user (name, phone, UID, PUSH_ID) values(\""+username+"\",\""+phone+"\",\""+uid+"\",\""+puid+"\");",function(err){
	if(err){
	    console.log("err");
	    res.contentType('application/json');
	    res.write("{\"result\":\"fail\"}");
	    res.end();
	}else{
	    res.contentType('application/json');
	    res.write("{\"result\":\"success\"}");
	    res.end();  
	    console.log("add user success");
	   
	}
    });
};

//b에게 인증을 요청한다
exports.sendauth = function(req,res){
    //B의 전화번호 , A의 PID, 이름, push id
    
    var pphone = req.body.pphone;
    var pid = req.body.pid;
    var name = req.body.name;
    var pushid = req.body.pushid;
    var myphone = req.body.myphone;

    console.log(pphone+"/"+pid+"/"+name+"/"+pushid);
    registrationIds = [];

//B에게 보낼 GCM을 작성(타이틀, A의 PID,이름,   타입은 Auth);)
var auth = new gcm.Message({ 
    collapseKey: 'demo', 
    delayWhileIdle: true, 
    timeToLive: 3, 
    data: {
	title : "auth request",
	sender : pid, 
	message: "from "+name,
	type : "auth",
	name : name,
	pushid : pushid,
	myphone : myphone
    } 
}); 

    var reqId = '';

    //B의 전화번호로  B의 Pushid를 가져와서 거길로 메세지를 보냄 
    conn.query("select PUSH_ID, PUID from user where phone = "+pphone, function(err, rows){
	if(rows.length == 0){
	    res.contentType('application/json');
	    res.write("{\"isSuccess\":\"fail\"}");
	}else{
	    console.log("push id = "+rows[0].PUSH_ID);
	    registrationIds.push(rows[0].PUSH_ID);
	    sender.send(auth, registrationIds,4,function(err,result){
		if (err) throw err;
		res.contentType('application/json');
		res.write("{\"isSuccess\":\"success\"}");
		res.end();
	    });
	}
    });
};

//B가 요청을 수락했기때문에 A에게 수락 알림을 보내야한다.

exports.authaccept = function(req,res){
    //B의 uid, A의 uid, B의 이름, pushid를 보낸다 
    var senders = req.body.sender;//이게 A의 UID가 되어야한다.
    var pid = req.body.pid;     //B UID
    var name = req.body.name;   //B Name
    var pushid = req.body.pushid; // B Pushid
    registrationIds = [];
     
    conn.query("update user set PUID = \'"+senders+"\' where UID = \'"+pid+"\';", function(err){
    console.log("ok1");
   });

    conn.query("update user set PUID = \'"+pid+"\' where UID = \'"+senders+"\';",function(err){
    console.log("ok2");
    });
    
    //send message to sender with ppuid,name
    conn.query("select PUSH_ID from user where UID = \'"+senders+"\';", function(err,rows){
	registrationIds.push(rows[0].PUSH_ID); // A pushid
	sender.send(new gcm.Message({
	collapseKey : 'demo',
	delayWhileIdle: true,
	timeToLive:3,
	data :{
	    title: "Accept request",
	    sender: pid, //B의 UID
	    message : "connect with"+name,
	    type : "accept",
	    name : name, 
	    pushid : pushid //B의 pushid
	}
    })
, registrationIds,4,function(err,result){
	    if(err) throw err;
	    res.contentType('application/json');
	    res.write("{\"isSuccess\":\"success\"}");
	    res.end();
	});
    });
};

exports.reset = function(req,res){
    console.log("Reset");
    var myphone = req.body.myphone;
    var pphone = req.body.pphone;
    //먼저 푸쉬로 클리어 한다고 보내
    //DB지움
    
    registrationIds = [];;
     conn.query("select PUSH_ID from user where phone = \'"+myphone+"\';", function(err, rows){
	registrationIds.push(rows[0].PUSH_ID);

	sender.send(new gcm.Message({
	    collapseKey : 'demo',
	    delayWhileIdle: true,
	    timeToLive:3,
	    data:{
		type: "clear"
	    }
	}), registrationIds,4,function(err,result){
	    if(err) {throw err; console.log(1);}
	    conn.query("delete from user where phone = \'"+myphone+"\';")
	});
    });

    regi= [];
   conn.query("select PUSH_ID from user where phone = \'"+pphone+"\';", function(err, rows){
	regi.push(rows[0].PUSH_ID);

	sender.send(new gcm.Message({
	    collapseKey : 'demo',
	    delayWhileIdle: true,
	    timeToLive:3,
	    data:{
		type: "clear"
	    }
	}), regi,4,function(err,result){
	    if(err){ throw err; console.log(2);}
	    conn.query("delete from user where phone = \'"+pphone+"\';")
	});
    });


};

exports.knock = function(req, res){
    var puid = req.body.puid;
    console.log("knock = "+puid);
    registrationIds = [];

 conn.query("select PUSH_ID from user where UID = \'"+puid+"\';", function(err,rows){
        if(rows.length == 0){
	    console.log("Push id is doesnt");
	}else{
	    registrationIds.push(rows[0].PUSH_ID); // A pushid
	    sender.send(new gcm.Message({
	    collapseKey : 'demo',
	    delayWhileIdle: true,
	    timeToLive:3,
	    data:{
		title:"kk",
		sender:"ho",
		message:"knock",
		type : "msg"
	    }
	
	})
, registrationIds,4,function(err,result){
            if(err) throw err;
            res.contentType('application/json');
            res.write("{\"isSuccess\":\"success\"}");
            res.end();
        });
	}
    });
   
};

exports.image = function(req, res){
var phone = req.body.phone;
var username = req.body.name;
var upfile = req.files.upfile;
var pphone = req.body.pphone;
var imageName;
registrationIds = [];
console.log("img phone"+phone);

    if(upfile.originalFilename == ''){
	res.json({result: 'No File'});
	console.log("no image");
    }else{
	console.log("yes image");
    var userfolder = path.resolve(__dirname, '..', 'profileImg');
    console.log('users folder', userfolder);

	console.log(fs.existsSync(userfolder)+'');
	if(!fs.existsSync(userfolder)){
	    fs.mkdirSync(userfolder);
	    console.log("make profile folder");
	}else{
	    console.log("Exist folder");
	}

	console.log("read name");
	var name = upfile.name;
	console.log("name = "+name);
	console.log("read srcpath");
	var srcpath = upfile.path;
	var destpath = path.resolve(userfolder, name);
	console.log('destpath', destpath);
	
	var is = fs.createReadStream(srcpath);
	var os = fs.createWriteStream(destpath);
    
	is.pipe(os);
	is.on('end', function(){
	    fs.unlinkSync(srcpath);
	    var srcimg = destpath;
	    var idx = destpath.lastIndexOf('.');
	    var filename = destpath.substring(0,idx);
	    var ext = destpath.substring(idx);
	    var destimg = filename+'-thumbnail' + ext;
	    
	    console.log('==============');
	    console.log('filename',filename);
	    console.log('idx', idx);
	    console.log('ext', ext);
	    console.log('destimg', destimg);

                    imageName = "http://52.69.130.243:8330/profileImg?id="+name;
		    console.log(imageName);
		    
		    conn.query("update user set IMG = \'"+imageName+"\' where phone = \'"+phone+"\';", function(err, result){
			if(err){ 
			    console.log(err);
			}else {
			    console.log("add img ok");
			}
		    });
		    conn.query("update user set name = \'"+username+"\' where phone = \'"+phone+"\';", function(err, result){
			if(err){
			    console.log(err);
			}else{
			    console.log("update name");
		
			conn.query("select PUSH_ID from user where phone = \'"+pphone+"\';", function(err, rows){
	    registrationIds.push(rows[0].PUSH_ID);
	    sender.send(new gcm.Message({
		collapseKey : 'demo',
		delayWhileIdle: true,
		timeToLive:3,
		data:{
		    type:"img",
		    message:imageName
		}
	    })
		, registrationIds,4, function(err, result){
		    if(err) throw err;
		});

	});

			
			}
		    });
	});
    }
};

exports.imgs = function(req,res){

    var img = req.body.img;
    var phone = req.body.phone;
    var username = req.body.name;
    var pphone = req.body.pphone;

    registrationIds = [];

    conn.query("update user set IMG = \'"+img+"\' where phone = \'"+phone+"\';", function(err, result){
	if(err) throw err;
    });

    conn.query("update user set name = \'"+username+"\' where phone = \'"+phone+"\';", function(err, result)    {
	if(err){
	    console.log(err);
	}else{
	console.log("update name");
	conn.query("select PUSH_ID from user where phone = \'"+pphone+"\';", function(err, rows){
	    registrationIds.push(rows[0].PUSH_ID);
	    sender.send(new gcm.Message({
		collapseKey : 'demo',
		delayWhileIdle: true,
		timeToLive:3,
		data:{
		    type:"img",
		    message:img
		}
	    })
		, registrationIds,4, function(err, result){
		    if(err) throw err;
		});

	});

	}
    });
};

