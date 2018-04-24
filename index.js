var express = require('express')
var app = express()
var bodyParser = require('body-parser')

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(request, response) {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.post('/', function (req, res) {
    console.log(req.body)
    res.send({status: '200'})
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})