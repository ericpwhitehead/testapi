var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var Spider = require('node-spider');
var fullArr =[]
var kue = require('kue');
var hash = require('object-hash');

const queue = kue.createQueue({
    redis: {
        port: 45519,
        host: 'ec2-18-213-155-182.compute-1.amazonaws.com',
        auth: 'pa6ddce452a0d8c06483b6c172ba36fbd45510f465fbac20607ad8ea247725f09'
    }
});
queue.watchStuckJobs(1000 * 10);


queue.on('error', (err) => {
  console.error('There was an error in the queue!');
  console.error(err);
  console.error(err.stack);
});

kue.app.listen(6002);
kue.app.set('title', 'Ozmosi Job Queue');
app.use('/queue', kue.app);


app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(request, response) {
    res.sendFile(path.join(__dirname + '/index.html'));
})


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})




var spider = new Spider({
	concurrent: 8,
	delay: 0,
	logs: process.stderr,
	allowDuplicates: false,
	catchErrors: true,
	addReferrer: false,
	xhr: true,
	keepAlive: false,
	error: function(err, url) {
        console.log(err, url)
	},
	done: function() {
        console.log('FINISHED!')
	},
	headers: { 'user-agent': 'mozilla' },
	encoding: 'utf8'
});

var handleRequest = function(doc) {
    var startUrl = (doc.url).split('rank=')[1]
    var pageId = startUrl.split('&')[0]
    console.log(pageId);
    if (pageId % 100 === 0) { return; }

    var date = new Date();
    var content = {
        
        title: doc.$('#main-content > div:nth-child(1) > h1:nth-child(2)').text().trim(),
        recruitingStatus: doc.$('.recruiting-status > span:nth-child(1)').text().trim(), 
        firstPosted: doc.$('.recruiting-status > div:nth-child(2) > span:nth-child(1)').text().trim(),
        sponsor: doc.$('.info-text#sponsor').text().trim(), 
        responsibleParty: doc.$('.info-text#responsibleparty').text().trim(),
        firstSubmitted: doc.$('table.data_table tr:nth-child(2) td:nth-child(2)').text().trim(),
        firstPostedTable: doc.$('table.data_table tr:nth-child(3) td:nth-child(2)').text().trim(),
        lastUpdatePosted: doc.$('table.data_table tr:nth-child(4) td:nth-child(2)').text().trim(),
        actualStudyStart: doc.$('table.data_table tr:nth-child(5) td:nth-child(2)').text().trim(),
        currentPrimaryOutcome: doc.$('table.data_table tr:nth-child(7) td:nth-child(2)').text().trim(),
        originalPrimaryOutcomeMeasure: doc.$('table.data_table tr:nth-child(8) td:nth-child(2)').text().trim(),
        changeHistory: doc.$('table.data_table tr:nth-child(9) td:nth-child(2)').text().trim(),
        currentSecondaryOutcomeMeasures: doc.$('table.data_table tr:nth-child(10) td:nth-child(2)').text().trim(),
        originalSecondaryOutcomeMeasures: doc.$('table.data_table tr:nth-child(11) td:nth-child(2)').text().trim(),
        currentOtherOutcomeMeasures: doc.$('table.data_table tr:nth-child(12) td:nth-child(2)').text().trim(),
        originalOtherOutcomeMeasures: doc.$('table.data_table tr:nth-child(13) td:nth-child(2)').text().trim(),
        briefTitle: doc.$('table.data_table tr:nth-child(16) td:nth-child(2)').text().trim(),
        officialTitle: doc.$('table.data_table tr:nth-child(17) td:nth-child(2)').text().trim(),
        briefSummary: doc.$('table.data_table tr:nth-child(18) td:nth-child(2)').text().trim(),
        detailedDescription: doc.$('table.data_table tr:nth-child(19) td:nth-child(2)').text().trim(),
        studyType: doc.$('table.data_table tr:nth-child(20) td:nth-child(2)').text().trim(),
        studyPhase: doc.$('table.data_table tr:nth-child(21) td:nth-child(2)').text().trim(),
        studyDesign: doc.$('table.data_table tr:nth-child(22) td:nth-child(2)').text().trim(),
        condition: doc.$('table.data_table tr:nth-child(23) td:nth-child(2)').text().trim(),
        intervention: doc.$('table.data_table tr:nth-child(24) td:nth-child(2)').text().trim(),
        studyArms: doc.$('table.data_table tr:nth-child(25) td:nth-child(2)').text().trim(),
        publications: doc.$('table.data_table tr:nth-child(26) td:nth-child(2)').text().trim(),
        recruitmentStatus: doc.$('table.data_table tr:nth-child(30) td:nth-child(2)').text().trim(),
        estimatedEnrollment: doc.$('table.data_table tr:nth-child(31) td:nth-child(2)').text().trim(),
        originalEstimatedEnrollment: doc.$('table.data_table tr:nth-child(32) td:nth-child(2)').text().trim(),
        estimatedStudyCompletion: doc.$('table.data_table tr:nth-child(33) td:nth-child(2)').text().trim(),
        estimatedPrimaryCompletion: doc.$('table.data_table tr:nth-child(34) td:nth-child(2)').text().trim(),
        eligabilityCriteria: doc.$('table.data_table tr:nth-child(35) td:nth-child(2)').text().trim(),
        sexGender: doc.$('table.data_table tr:nth-child(36) td:nth-child(2)').text().trim(),
        ages: doc.$('table.data_table tr:nth-child(37) td:nth-child(2)').text().trim(),
        acceptsHealthyVolunteers: doc.$('table.data_table tr:nth-child(38) td:nth-child(2)').text().trim(),
        contacts: doc.$('table.data_table tr:nth-child(39) td:nth-child(2)').text().trim(),
        listedLocationCountries: doc.$('table.data_table tr:nth-child(40) td:nth-child(2)').text().trim(),
        removedLocationCountries: doc.$('table.data_table tr:nth-child(41) td:nth-child(2)').text().trim(),
    }
    var identifier = doc.$('#main-content > div.indent2 > div.row > div.column.right > table > tbody > tr:nth-child(1) > td').text().trim()
    console.log(identifier)
    var identifier2 = identifier.split(':')[1];
    console.log(identifier2)
        var page =  {
            timestamp: date.toISOString(),
            rank: pageId,
            data: content,
            hash: hash(content)
    };

    queue.create('united-states', page).priority('high').attempts(5).save( function(err){
        if( !err ) console.log( err );
    }).removeOnComplete( false );

    var href = doc.$('a.next-link').attr('href').split('#')[0];
    var url = doc.resolve(href);
    spider.queue(url, handleRequest);
};

spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=1', handleRequest)
// spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=101', handleRequest)
// spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=201', handleRequest)
// spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=301', handleRequest)
// spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=401', handleRequest)
// spider.queue('https://clinicaltrials.gov/ct2/show/record/?rank=501', handleRequest)

// queue.process('united-states', function(job, done){
//     console.log(job.id);
//     done();
//   });

// kue.Job.rangeByState( 'queued', 0, null, 'asc', function( err, jobs ) {
//     jobs.forEach( function( job ) {
//       job.remove( function(){
//         console.log( 'removed ', job.id );
//       });
//     });
//   });