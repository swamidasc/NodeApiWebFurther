const express = require('express');
const bodyParser = require('body-parser');
const mcache = require("memory-cache");

let memCache = new mcache.Cache();

//Api Hit count logic start
let incrementApiHitCount = (key) => {
  connection.query('SELECT * FROM `api_hits` WHERE `api` = ?', [key], function (error, results, fields) {

    if(error) throw error;
   // console.log(results);
    if(results.length>0) {
      // update
      const CURRENT_TIMESTAMP = mysql.raw('CURRENT_TIMESTAMP()');
      connection.query('UPDATE `api_hits` SET `hits`=?, `updated_at`=? WHERE `api`=?', [
        results[0].hits+1,
        CURRENT_TIMESTAMP,
        key
      ], function(error, results, fields) {
        if(error) throw error;
       // console.log('updated hits: ', results);
      });
    } else {
      // insert
      const api_hit = {
        api: key,
        hits: 1
      };
      connection.query('INSERT INTO `api_hits` SET ?', api_hit, function(error, results, fields) {
        if(error) throw error;
        //console.log('insert hit: ', results);
      });
    }
  });
}
//Api Hit count logic end

// cache start
    let cacheMiddleware = (duration) => {
        return (req, res, next) => {
            let key =  '__express__' + req.originalUrl || req.url
            let cacheContent = memCache.get(key);
            if(cacheContent){
                console.log('result form cache->',key);
                incrementApiHitCount(key);
                return res.json( cacheContent );

            }else{
              console.log('result from db->',key);
              req.mCacheKey = key;
              next()
            }
        }
    }
// cache end 

  var app = express(); 
  var mysql      = require('mysql');
  const port = process.env.PORT || 8000;
  app.use(bodyParser.urlencoded({ // Middleware
    extended: true
  }));

	var connection = mysql.createConnection({
	  host     : '54.218.75.98',
	  user     : 'ocr_dev', 
	  password : 'nZdHg2k4Qh', 
	  database : 'ocr_dev' 
	});
	connection.connect(function(err) {
	  if (err) throw err
	  console.log('You are now connected with mysql database...')
	});

// Starting point of the server
function main () {
  app.use(bodyParser.json());
  // Routes & Handlers
  app.get('/list',cacheMiddleware(10), function (req, res) {
    connection.query('select * from list', function (error, results, fields) {
      if (error) throw error;
      memCache.put(req.mCacheKey, results,1200000);
      incrementApiHitCount(req.mCacheKey);
      res.json(results);
    });
});
  
  app.get('/emplist',cacheMiddleware(10), function (req, res) {
  connection.query('select * from list', function (error, results, fields) {
    if (error) throw error;
    memCache.put(req.mCacheKey, results,1200000);
    incrementApiHitCount(req.mCacheKey);
    res.json(results);
  });
});

  app.listen(port, () => console.log(`Server is listening on port: ${port}`));

}

main();
