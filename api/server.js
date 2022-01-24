var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var multiparty = require('connect-multiparty');
var fs = require('fs');

var objectId = mongodb.ObjectId;

var app = express();

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next){
    
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'GET, POST, PUT, DELETE');
    res.setHeader("Access-Control-Allow-Headers", 'content-type');
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

var port = 8080;

app.listen(port);

console.log(`**Running HTTP Server on port : ${port}**`);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

app.get('/', function (req, res) {
    res.send({ msg: 'Hello World' });
});

app.get('/api', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, results) {
                if (err) {
                    res.json(err);
                }
                else {
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/api/:id',function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
           collection.find(objectId(req.params.id)).toArray(function(err, results){
               if(err){
                   res.json(err);
               }
               else{
                   res.status(200).json(results);
               }
               mongoclient.close();
           }); 
        });
    });
});

app.get('/imagens/:imagem', function(req, res){
    var img = req.params.imagem;

    fs.readFile('./uploads/'+img, function(err, content){
        if(err){
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, {'content-type':'image/jpg'});
        res.end(content);
    });
});

app.post('/api', function (req, res) {

    var url = "C:\\Users\\Avell\\Desktop\\Musicas\\Internationals\\EnglishMusics&Others\\Mix";

    var date = new Date().getTime();

    var url_imagem = date + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    // fs.readdirSync(url).forEach(file => {
    //     console.log(file);
    // })

    fs.rename(path_origem, path_destino, function(err){
        if(err){
            res.status(500).json(err);
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo,
        }
        db.open(function (error, mongoclient) {
            mongoclient.collection('postagens', function (error, collection) {
                collection.insert(dados, function (error, records) {
                    if (error) {
                        res.json({ status: 0 });
                    }
                    else {
                        res.json({ status: 1 });
                    }
                    mongoclient.close();
                });
            });
        });
    });
});

app.put('/api/:id', function(req, res){
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                { _id: objectId(req.params.id)},
                { $push: {
                    comentarios: {
                        id_comentario: new objectId(),
                        comentario: req.body.comentario
                    }
                }},
                {},
                function(err, records){
                    if(err){
                        res.json(err);
                    }
                    else{
                        res.json(records);
                    }
                    mongoclient.close();
                }
            )
        });
    });
});

app.delete('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                {},
                { $pull : {
                    comentarios: { id_comentario : objectId(req.params.id)}
                }},
                {multi: true},
                function(err, records){
                    if(err){
                        res.json(err);
                    }
                    else{
                        res.json(records);
                    }
                }
            );
            mongoclient.close();
        });
    });
});