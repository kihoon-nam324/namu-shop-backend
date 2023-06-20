const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');


const cors = require('cors');
const server = express();
const bodyParser = require("body-parser");
const mysql = require('mysql2');

server.use(bodyParser.json());
server.use(cors());

server.use(express.static(path.join(__dirname, 'build')));

server.get('/', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '/build/index.html'));
});

server.listen(8080, function () {
  console.log('listening on 8080')
});

const db = mysql.createConnection({
  host : process.env.DATABASE_URL,
  user : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE_NAME
});

db.connect(function(err) {
  if (err) {
    console.error('Database Connect Failed :' + err.stack);
    return;
  }
  console.log('Database Connected');
});

// PRODUCT ITEM SEARCH
server.get('/api/Product/:no', function(req,res) {
  var productNo = req.params.no;
  let sql = 'SELECT * FROM product WHERE `no` =' + productNo;
  db.query(sql, function(error, result, field) {
    if (error) { 
      res.send(error);
    } else {
      res.send(result[0]);
    }
  });
});

// PRODUCTLIST GET COUNT
server.get('/api/ProductListGetCountAll', function(req,res) {
  let sql = 'SELECT count(*) AS count FROM product';

  db.query(sql, function (error, result, field) {
    if (error) { 
      res.send(error);
    } else {
      res.send(result);
    }
  });
})

// PRODUCTLIST GET BY QUERY
server.post('/api/ProductListGetByQuery', function(req,res) {
  let details = {
    queryOptionName : req.body.queryOptionName,
    queryOptionValue : req.body.queryOptionValue
  }
  
  let sql = '';

  if(details.queryOptionName == "status"){
    sql += 'SELECT * FROM product WHERE status = ?';
  }else if(details.queryOptionName === "catNo"){
    sql += 'SELECT * FROM product WHERE catNo = ?';
  }

  db.query(sql, details.queryOptionValue, function (error, result, field) {
    if (error) { 
      res.send(error);
    } else {   
      res.send(result);
    }
  });
})

// PRODUCTLIST GET BY PAGE
server.post('/api/ProductListGetByPage', function(req,res) {
  let body = {
    offset : req.body.offset == null ? req.body.pageSize : req.body.offset,
    pageSize : req.body.pageSize
  }
  
  let sql = 
    'SELECT * ' +
    'FROM ' +
    '( ' +
    'SELECT ROW_NUMBER() OVER(ORDER BY `no` ASC) AS rowNum, product.* ' +
    'FROM product' +
    ') AS tmpProduct ' +
    'WHERE rowNum BETWEEN ' + (body.offset - body.pageSize + 1) + ' AND ' + body.offset + ' ' +
    'ORDER BY rowNum DESC LIMIT ' + body.pageSize;

  db.query(sql, function (error, result, field) {
    if (error) { 
      res.send(error);
    } else {   
      res.send(result);
    }
  });
})
