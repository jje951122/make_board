var express = require('express')
var app = express()

// var router = express.Router()
var path = require('path')
var bodyParser = require('body-parser')
var ejs=require('ejs')
var date_util=require('date-utils')
var jsalert=require('js-alert')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


var mysql_me = require('./db_conn')();
var connection=mysql_me.init();
connection.connect();

var now_ID='';

app.listen(3000, function() {
 	console.log("start@ on port 3000");
});



app.get('/', function(req, res){
  res.sendFile(__dirname+"/public/login.html");
})

//게시판 목록
app.get('/list', function(req,res){
  console.log("게시판");
  var query = connection.query("select BOARD_NUM, TITLE,W_ID, date_format(W_DATE, '%Y-%m-%d') as DATE from board ", function (err, rows) {
    if(err)throw err;
    console.log("찾음")
    res.render('list', {title: '게시판 리스트', rows: rows});
  })
});

app.get('/public/write.html', function(req, res){
  res.sendFile(__dirname+"/public/write.html");
})
//게시판 글 선택시 
app.get('/read/:id', function(req, res){
  var idx=(req.params.id*1);
  console.log("게시판 클릭", idx)

  var sql='select BOARD_NUM, TITLE, date_format(W_DATE, "%Y-%m-%d") as DATE, W_ID, CONTENT from board where BOARD_NUM=?';
  connection.query(sql, [idx], function(err, rows1){
    if(err)throw err;
    var sql1='select COMMENT_NUM, WRITER_ID, COMMENT_CONTENT, date_format(W_DATE, "%Y-%m-%d") as DATE from comment where B_NUM=?';
    connection.query(sql1, [idx], function(err, rows2){
      
      res.render('read', {title:"상세 글", row1:rows1[0], row2:rows2});
    })
    
  })
})
//댓글 삭제
app.get('/delete_comment/:id', function(req,res){
  var delete_idx=req.params.id*1;
  ;
  var sql='select WRITER_ID, B_NUM from comment where COMMENT_NUM=?';
  connection.query(sql, [delete_idx],function(err, row){
    if(err)throw err;
    var next_bidx=row[0].B_NUM;
    
    if(now_ID==row[0].WRITER_ID){
      sql='delete from comment where COMMENT_NUM=?';
      connection.query(sql, [delete_idx], function(err, res){
        if(err)throw err;
      })
    }
    else{
      console.log("댓글 작성자가 아님")
    }
    res.redirect('/read/'+next_bidx);
  })
  
})
//글 삭제
app.post('/delete_text', function(req, res){
  var idx=req.body.id;
  console.log("글삭제 누름");
  var sql='select W_ID FROM board where BOARD_NUM=?';
  console.log(idx);
  connection.query(sql, [idx], function(err, rows){
    if(rows[0].W_ID!=now_ID){
      console.log("작성자가 아님");
    }
    else{
      sql='delete from board where BOARD_NUM=?'
      connection.query(sql, [idx], function(err, rows){
        if(err)throw err;
        console.log("글이 삭제됨")
      })
    }
  })
 
  res.redirect('/list');
})
//댓글 작성
app.post("/write_comment", function(req, res){
  var today=new Date;
  var year=today.getFullYear();
  var mon=today.getMonth()+1;
  var day=today.getDate();
  var comment=req.body.comment;
  var B_idx=req.body.B_idx*1;
  console.log(B_idx);
  
  var query = connection.query('select MAX(COMMENT_NUM) as _MAX from comment', function (err, rows) {
    if(err)throw err;
    var newIndex=rows[0]._MAX+1;
    var params=[newIndex, B_idx, now_ID, comment, year+'-'+mon+'-'+day];
    console.log(params);
    sql='insert into comment (COMMENT_NUM,B_NUM ,WRITER_ID, COMMENT_CONTENT, W_DATE) values (?,?,?,?,?)';
    connection.query(sql, params, function(err, res){
      if(err)throw err;
    })
  })
  res.redirect('read/'+B_idx);
})
//글 수정
app.post('/update', function(req, res){
  console.log("현재 로그인 아이디 :", now_ID);
  var title=req.body.title;
  var idx=req.body.idx;
  var name=req.body.name;
  var content=req.body.content;
  if(name!=now_ID){
    jsalert.alert("작성자가 아닙니다");
  }
  else{var params=[title, content, idx];
    var sql='update board set TITLE=?, CONTENT=? where BOARD_NUM=?';
    connection.query(sql , params, function(err, res){
      if(err) throw err;
      console.log('test');
    })
    res.redirect('/list');
  }
})
//글 작성
app.post('/write_text', function(req, res){
  var title=req.body.title;
  var des=req.body.description;
  var today=new Date;
  var year=today.getFullYear();
  var mon=today.getMonth()+1;
  var day=today.getDate();
  var newIndex;
  var query = connection.query('select MAX(BOARD_NUM) as _MAX from board', function (err, rows) {
    if(err)throw err;
    newIndex=rows[0]._MAX+1;
    console.log(newIndex);
    console.log(now_ID);
    var query = connection.query('insert into board (BOARD_NUM ,TITLE, W_DATE, W_ID, CONTENT) values ("' + newIndex + '","' + title + '","' + year+'-'+mon+'-'+day + '","'+now_ID+'", "'+des+'")', function (err, rows) {
      if (err) throw err;
      console.log('new text insert');
      res.redirect('/list');
    })
  })
  
})
//로그인 클릭
app.post('/join', function(req, res){
  console.log('login...');
  var ID=req.body.ID;
  var PW=req.body.password;
  console.log(ID, PW);
  var query = connection.query('select * from client where ID="' + ID + '" and PASSWORD="' + PW+'"  ', function (err, rows) {
    if (err) throw err;
    if (rows[0]) {
      console.log('login success');
      now_ID=ID;
      console.log(now_ID);
      res.redirect('/list');
    }
    else{
      console.log('now match ID , PW');
      res.sendFile(__dirname+"/public/login.html");
    } 
  })
})
app.post('/adduser', function(req, res){
  console.log('adding user');
  var ID=req.body.ID;
  var PW=req.body.PW;
  var NAME=req.body.NAME;
  
  var query = connection.query('select * from client where ID="' + ID + '"  ', function (err, rows) {
    //if (err) throw err;
    if (rows[0]) {
      res.sendFile(__dirname+"/public/adduser.html");
    }
    else{
      var query = connection.query('insert into client (ID ,PASSWORD, Name) values ("' + ID + '","' + PW + '","' + NAME + '")', function (err, rows) {
        if (err) throw err;
        console.log('data insert');
        res.sendFile(__dirname+"/public/login.html");
      })
    } 
  })
})
app.post('/logout', function(req, res){
  now_ID="";
  res.redirect('/');
})
