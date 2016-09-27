var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();
var assert = require('assert');

app.set('view engine', 'ejs');

var db_url =   'mongodb://user:pass@ds041506.mlab.com:41506/shortner';


app.get('/', function(req, res){
    var url = req.headers['x-forwarded-proto'] + '://' + req.headers.host;
    res.render('index', { url:url} );
});

app.get('/:id', function (req, res) {
    mongo.connect(db_url, function(err, db){
        assert.equal(null, err);
        var id = Number(req.params.id);
        db.collection('urls').findOne({'_id':id}, function(err, doc){
            assert.equal(null, err);
            if(doc){
                console.log(doc.url);
                res.redirect(doc.url);
            } else{
                res.writeHead(200,{'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: "This url is not on the database."}));
                console.log('it does not exist');
            }
            db.close();
        });
    });
});

app.get(/\/new\/.*/, function (req, res) {
    var host = req.headers['x-forwarded-proto'] + '://' + req.headers.host + '/';
    var url = req.url.slice(5);
    if(/https?:\/\/.{2,20}\..{2,20}.*/.test(url))
        mongo.connect(db_url,function(err, db){
            var seq;
            assert.equal(null, err);
            
            db.collection('counters').findAndModify({'_id': 'urlid'}, [], { '$inc': {  'seq': 1 } }, 
                function(err, result){
                    assert.equal(null, err);
                    seq = result.value.seq;
                    
                    var item = {
                        original_url: url,
                        short_url : host+seq
                    }
                    db.collection('urls').insertOne({_id: seq, url: url}, function(err, data){
                        assert.equal(null, err);
                         res.writeHead(200,{'Content-Type': 'application/json'});
                       res.end(JSON.stringify(item));
                       db.close();
                    });
            });
        });
    else{
        res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: "Wrong url format, make sure you have a valid protocol and real site."}));
        
    }
});

app.listen(process.env.PORT || 8080);
