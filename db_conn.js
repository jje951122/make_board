var mysql = require('mysql');
module.exports=function(){
      return{
           init:function(){ 
                 return mysql.createConnection({
                  host     : '127.0.0.1',
                  port     : 3306,
                  user     : 'root',
                  password : 'jueon@2920',
                  database : 'b_board'
                 })
            }
      }
};


