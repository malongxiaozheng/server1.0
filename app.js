const express= require("express");//web服务器
const session= require("express-session");//session对象
const mysql= require("mysql");//mysql
const cors= require("cors");//跨域
//3.创建数据库连接池
var pool=mysql.createPool({
    host:"127.0.0.1",
    user:"root",
    password:"",
    database:"fj",
    port:3306,
    connectionLimit:15
});
//4.跨域
var server= express();
server.use(cors({
    origin:["http://127.0.0.1:8080","http://localhost:8080"],
    credentials:true
}))
//5.配置session ！！！
//6.创建服务器对象
//6.1 配置静态目录
server.use(express.static("public"));
//6.2配置session对象
server.use(session({
    secret:"128位安全字符串",//加密条件
    resave:true,//请求更新数据
    saveUninitialized:true//保存初始数据
}))
// console.log(session);
//7.为服务器对象绑定端口 4000
server.listen(4000);
// console.log(server);
//功能一：登录验证
server.get("/login",(req,res)=>{
    // (1)获取用户名和密码
    var u=req.query.uname;
    var p=req.query.upwd;
    // (2)创建sql
    var sql = "SELECT id FROM fj_login WHERE uname=? AND upwd=md5(?)";
    // (3)返回结果
    pool.query(sql,[u,p],(err,result)=>{
        if(err) throw err;
        if(result.length==0){
            res.send({code:-1,msg:"用户名或密码错误!"})
        }else{
            //将当前登录用户id保存
            //session对象中作为登录成功凭证

            //-获取当前用户id
            var uid=result[0].id;
            //-保存在session对象中
            req.session.uid=uid;
            console.log(req.session);
            res.send({code:1,msg:"登录成功!"})
        }
    })
})

//功能二：显示商品分页列表
server.get("/product",(req,res)=>{
    //1.参数页码
    //一页几行12
    var pno = req.query.pno;
    var ps = req.query.pageSize;
    var lx = req.query.Lx;
    //1.1:为参数设置默认值
    if(!pno){pno=1};
    if(!ps){
        ps=5
    };
    //2:sql
    var sql = "SELECT * FROM fj_product WHERE Lx = ? LIMIT ?,?";
    //2.1：起始记录数
    var offset = (pno-1)*ps;
    //2.2：一行几条记录
    // ps = parseInt(ps);
    if(pno>1){
        ps=12;
    }
    //3:返回值
    pool.query(sql,[lx,offset,ps],(err,result)=>{
        if(err) throw err;
        res.send( {code:1,msg:"查询成功",data:result} );
    })
})


//功能三：把商品添加到购物车
server.get("/addcart",(req,res)=>{
    // 1:获取当前登录凭证
    var uid = req.session.uid;
    // 2：如果当前用户没有登录  请登录
    if(!uid){
        res.send({code:-2,msg:"请登录"});
        return;
    }
    // 3：获取脚手架传递参数 lid；lname；price
    var sid = req.query.sid;
    var dimg = req.query.dimg;
    var dms = req.query.dms;
    var dtitle = req.query.dtitle;
    var count = req.query.count;
    var price = req.query.price;
    // 4：创建查询SQL语句
    var sql = "SELECT id FROM fj_cart WHERE uid = ? AND dms = ?"
    //     当前用户添加有此商品
    // 5：执行更新sql语句更新数量
    pool.query(sql,[uid,dms],(err,result)=>{
        if(err) throw err;
        if(result.length==0){
            var sql = `INSERT INTO fj_cart VALUES(null,${sid},'${dimg}',${price},'${dms}','${dtitle}',${count},${uid})`;
        }else{
            var sql = `UPDATE fj_cart SET count=${count} WHERE uid=${uid} AND dms='${dms}'`;
        }
        pool.query(sql,(err,result)=>{
            if(err) throw err;
            res.send({code:1,msg:"添加成功"});
        })
    })
    //     当前用户没有添加有此商品
    // 6：执行添加sql语句添加商品
})

//功能：详情页
server.get("/details",(req,res)=>{
    // 1:获取当前登录凭证
    // var uid = req.session.uid;
    // // 2：如果当前用户没有登录  请登录
    // if(!uid){
    //     res.send({code:-2,msg:"请登录"});
    //     return;
    // }
    // (1)获取商品id
    var did=req.query.sid;
    // (2)创建sql
    var sql = "SELECT * FROM fj_details WHERE did=?";
    // (3)返回结果
    pool.query(sql,[did],(err,result)=>{
        if(err) throw err;
        if(result.length==0){
            res.send({code:-1,msg:"添加失败!"})
        }else{
            res.send({code:1,msg:"添加成功!",data:result})
        }
    })
})

//功能：查询是否登录
server.get("/find",(req,res)=>{
    var uid = req.session.uid;
    // console.log(uid);
    // 2：如果当前用户没有登录  请登录
    if(!uid){
        res.send({code:-2,msg:"请登录"});
        return;
    }
    var sql = "SELECT * FROM fj_login WHERE id=?"
    pool.query(sql,[uid],(err,result)=>{
        if(err) throw err;
        res.send({code:1,msg:"查询成功",data:result});
    })
})

//功能四：查询购物车信息
server.get("/findcart",(req,res)=>{
    // 1:获取用户登录凭证
    var uid = req.session.uid;
    // 2：没有uid  请登录
    if(!uid){
        res.send({code:-2,msg:"请登录",data:[]});
        return;
    }
    // 3：创建sql 语句
    var sql = "SELECT * FROM fj_cart WHERE uid = ?";
    // 4：发送sql 语句
    pool.query(sql,[uid],(err,result)=>{
        if(err) throw err;
         // 5：将服务器返回结果发送脚手架
        res.send({code:1,msg:"查询成功！！！",data:result});
    })
})

//功能：更新购物车
server.get("/upcart",(req,res)=>{
    var count = req.query.count;
    var dms = req.query.dms;
    var sid = req.query.sid;
    var sql = "update fj_cart set count = ? where sid=? and dms=?";
    pool.query(sql,[count,sid,dms],(err,result)=>{
        if(err) throw err;
        res.send({code:1,msg:"更新成功"});
    })
})

//功能五：删除一条购物车数据
server.get("/del",(req,res)=>{
    // (0)判断用户是否登录
    var uid = req.session.uid;
    if(!uid){
        res.send({code:-2,msg:"请登录"});
        return;
    }
    // (1)参数
    var id = req.query.id;
    // (2)sql
    var sql = "DELETE FROM fj_cart WHERE id = ? AND uid = ?"
    // (3)json
    pool.query(sql,[id,uid],(err,result)=>{
        if(err) throw err;
        // 受影响行数
        if(result.affectedRows>0){
            res.send({code:1,msg:"删除成功"})
        }else{
            res.send({code:-1,msg:"删除失败"})
        }
    })
})


//功能六：删除选中商品
//功能七：清空购物车
// server.get("/delm",(req,res)=>{
//     // 判断是否登录
//     var uid = req.session.uid;
//     if(!uid){
//         res.send({code:-2,msg:"请登录"})
//         return;
//     }
//     // 参数
//     var id = req.query.id;
//     console.log(id);
//     // sql
//     var sql = `DELETE FROM xz_cart WHERE id IN (${id})`;
//     // json
//     pool.query(sql,[id],(err,result)=>{
//         if(err) throw err;
//         if(result.affectedRows>0){
//             res.send({code:1,msg:"删除成功"})
//         }else{
//             res.send({code:-1,msg:"删除失败"})
//         }
//     })
// })