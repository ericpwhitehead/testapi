var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var Spider = require('node-spider');
var hash = require('object-hash');
var mongoose = require('mongoose');
var fs = require('fs');
mongoose.connect('mongodb://one:twotwo2@ds033669.mlab.com:33669/unitedstates');

var dataSchema = mongoose.Schema({
        nct: String,
        timestamp: String,
        title: String,
        firstSubmitted: String,
        studyType: String,
        studyPhase: String,
        hash: String,
        history: []
    });

const dataRecord = mongoose.model('dataSchema', dataSchema, 'trial_data');

var historySchema = mongoose.Schema({nct: String}, { strict: false });

const historyRecord = mongoose.model('historySchema', historySchema, 'trial_history');

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

app.get('/allData', function(req,res) {
        dataRecord.find({}, function(err, docs) {
                if (err) console.log(err);
                res.json(docs);
        })
})
app.get('/nct/:id', function(req, res) {
    historyRecord.find({nct: req.params.id}, function(err, docs) {
        if (err) console.log(err);
        res.json(docs);
    })
})
app.get('/unique', function(req, res) {
    historyRecord.find().distinct('nct', function(error, ncts) {
        if (error) console.log(error);
        historyRecord.aggregate([
            {$match : { nct: {$in: ncts}}}, 
            {$group : {_id : {key:"$key", BriefTitle:"$BriefTitle", nct:"$nct", FirstSubmitted: "$FirstSubmitted"}}}, 
            {$project : {_id:0, key:"$_id.key", BriefTitle:"$_id.BriefTitle", nct:"$_id.nct", FirstSubmitted: "$_id.FirstSubmitted"}}
          ]).
          then(function (trials) {
            console.log(trials);
            res.json(trials)
          });
    });
    
})


var bulkImport = [];

var spider = new Spider({
	concurrent: 1,
	delay: 5,
	logs: process.stderr,
	allowDuplicates: false,
	catchErrors: true,
	addReferrer: false,
	xhr: false,
	keepAlive: false,
	error: function(err, url) {
                console.log(err, url)
	},
	done: function() {
                console.log('FINISHED!')
                // console.log(bulkImport);
                // bulkImport.forEach(record => {
                //         var newTrial = new dataRecord(record);
                //         newTrial.save(function (err, results) {
                //                 if (err) console.log(err);
                //                 console.log(results);
                //         })
                // })
                // fs.writeFile('mynewfile3.txt', JSON.stringify(bulkImport[0]), function (err) {
                //         if (err) throw err;
                //         console.log('Saved!');
                //       });
                
        },
        headers: { 'user-agent': 'Chrome' },
	encoding: 'utf8'
});


var handleOneChange = function(doc) {
        var singlenct = ((doc.url).split('history/')[1]).substr(0,11);
        objIndex = bulkImport.findIndex((obj => obj.nct == singlenct));
        
        var historyObj = {};
        var date = ((doc.$('body > div:nth-child(8)').text()).split(':')[1]).split('(')[0].trim();
        historyObj.date = date;
        historyObj.nct = singlenct;
        doc.$('table.history table.resultTable tr').each(function(i, elem) {
                var key = (doc.$(elem).children('td:nth-child(1)').text())
                if (key) {
                        var cleanKey = key.replace(/[ .:]/g, '');
                        var value = doc.$(elem).children('td:nth-child(2)').html();
                        //console.log(cleanKey)
                        historyObj[cleanKey] = value;
                }
        });
        //(bulkImport[objIndex].history).push(historyObj)
        //console.log(historyObj);
        var newHistory = new historyRecord(historyObj);
            newHistory.save(function (err, results) {
                    if (err) console.log(err);
                    //console.log(results);
            })

}


var handleHistory = function(doc) {
        var historynct = ((doc.url).split('history/')[1]).substr(0,11);
        objIndex = bulkImport.findIndex((obj => obj.nct == historynct));
        console.log('history nct', historynct)
        if (doc.$('fieldset.releases').length) {
                console.log('there is a history')
                //bulkImport[objIndex].history = [];
                doc.$('table.releases a').each(function(i, elem) {
                        var href = doc.$(elem).attr('href').split('#')[0];
                        var url = doc.resolve(href);
                        spider.queue(url, handleOneChange);
                });
        } else {
            console.log('no history')
        }
}

var handleRequest = function(doc) {
        //var startUrl = (doc.url).split('rank=')[1]
        //var pageId = startUrl.split('&')[0]
        var nct = ((doc.url).split('record')[1]).replace('/', '').substr(0,11);
        
        var historyUrl = 'https://clinicaltrials.gov/ct2/history/'+nct;
        spider.queue(historyUrl, handleHistory);
        
        // var pageId = 1;
        // if (pageId % 100 === 0) { return; }

        // var date = new Date();
        // var content = {
        //         recruitingStatus: doc.$('.recruiting-status > span:nth-child(1)').text().trim(), 
        //         firstPosted: doc.$('span[data-term="recruitment status"]').text().trim(),
        //         sponsor: doc.$('.info-text#sponsor').text().trim(), 
        //         responsibleParty: doc.$('.info-text#responsibleparty').text().trim(),
        //         firstSubmitted: doc.$('table.data_table tr:nth-child(2) td:nth-child(2)').text().trim(),
        //         firstPostedTable: doc.$('table.data_table tr:nth-child(3) td:nth-child(2)').text().trim(),
        //         lastUpdatePosted: doc.$('table.data_table tr:nth-child(4) td:nth-child(2)').text().trim(),
        //         actualStudyStart: doc.$('table.data_table tr:nth-child(5) td:nth-child(2)').text().trim(),
        //         currentPrimaryOutcome: doc.$('table.data_table tr:nth-child(7) td:nth-child(2)').text().trim(),
        //         originalPrimaryOutcomeMeasure: doc.$('table.data_table tr:nth-child(8) td:nth-child(2)').text().trim(),
        //         changeHistory: doc.$('table.data_table tr:nth-child(9) td:nth-child(2)').text().trim(),
        //         currentSecondaryOutcomeMeasures: doc.$('table.data_table tr:nth-child(10) td:nth-child(2)').text().trim(),
        //         originalSecondaryOutcomeMeasures: doc.$('table.data_table tr:nth-child(11) td:nth-child(2)').text().trim(),
        //         currentOtherOutcomeMeasures: doc.$('table.data_table tr:nth-child(12) td:nth-child(2)').text().trim(),
        //         originalOtherOutcomeMeasures: doc.$('table.data_table tr:nth-child(13) td:nth-child(2)').text().trim(),
        //         briefTitle: doc.$('table.data_table tr:nth-child(16) td:nth-child(2)').text().trim(),
        //         officialTitle: doc.$('table.data_table tr:nth-child(17) td:nth-child(2)').text().trim(),
        //         briefSummary: doc.$('table.data_table tr:nth-child(18) td:nth-child(2)').text().trim(),
        //         detailedDescription: doc.$('table.data_table tr:nth-child(19) td:nth-child(2)').text().trim(),
        //         studyType: doc.$('table.data_table tr:nth-child(20) td:nth-child(2)').text().trim(),
        //         studyPhase: doc.$('table.data_table tr:nth-child(21) td:nth-child(2)').text().trim(),
        //         studyDesign: doc.$('table.data_table tr:nth-child(22) td:nth-child(2)').text().trim(),
        //         condition: doc.$('table.data_table tr:nth-child(23) td:nth-child(2)').text().trim(),
        //         intervention: doc.$('table.data_table tr:nth-child(24) td:nth-child(2)').text().trim(),
        //         studyArms: doc.$('table.data_table tr:nth-child(25) td:nth-child(2)').text().trim(),
        //         publications: doc.$('table.data_table tr:nth-child(26) td:nth-child(2)').text().trim(),
        //         recruitmentStatus: doc.$('table.data_table tr:nth-child(30) td:nth-child(2)').text().trim(),
        //         estimatedEnrollment: doc.$('table.data_table tr:nth-child(31) td:nth-child(2)').text().trim(),
        //         originalEstimatedEnrollment: doc.$('table.data_table tr:nth-child(32) td:nth-child(2)').text().trim(),
        //         estimatedStudyCompletion: doc.$('table.data_table tr:nth-child(33) td:nth-child(2)').text().trim(),
        //         estimatedPrimaryCompletion: doc.$('table.data_table tr:nth-child(34) td:nth-child(2)').text().trim(),
        //         eligabilityCriteria: doc.$('table.data_table tr:nth-child(35) td:nth-child(2)').text().trim(),
        //         sexGender: doc.$('table.data_table tr:nth-child(36) td:nth-child(2)').text().trim(),
        //         ages: doc.$('table.data_table tr:nth-child(37) td:nth-child(2)').text().trim(),
        //         acceptsHealthyVolunteers: doc.$('table.data_table tr:nth-child(38) td:nth-child(2)').text().trim(),
        //         contacts: doc.$('table.data_table tr:nth-child(39) td:nth-child(2)').text().trim(),
        //         listedLocationCountries: doc.$('table.data_table tr:nth-child(40) td:nth-child(2)').text().trim(),
        //         removedLocationCountries: doc.$('table.data_table tr:nth-child(41) td:nth-child(2)').text().trim(),
        // }
        
        // var page =  {
        //         nct,
        //         timestamp: date.toISOString(),
        //         title: doc.$('table.data_table tr:nth-child(16) td:nth-child(2)').text().trim(),
        //         firstSubmitted: doc.$('table.data_table tr:nth-child(2) td:nth-child(2)').text().trim(),
        //         //hash: hash(content),
        //         studyType: doc.$('table.data_table tr:nth-child(20) td:nth-child(2)').text().trim(),
        //         studyPhase: doc.$('table.data_table tr:nth-child(21) td:nth-child(2)').text().trim(),
        //         history: []
        // };

        // bulkImport.push(page);
        var href = doc.$('a.next-link').attr('href')
        var url = doc.resolve(href);
        console.log('url', url)
        spider.queue(url, handleRequest);
};

//spider.queue('https://clinicaltrials.gov/ct2/show/record/NCT02474212', handleRequest)