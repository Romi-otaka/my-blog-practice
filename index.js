//index.js
const express = require("express")
const app = express()
app.use(express.urlencoded({extended: true}))
const mongoose = require("mongoose")
const session = require("express-session")

app.set("view engine","ejs")
app.use("/public",express.static("public"))

//Session
app.use(session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge:3600000 },
}))

//Connecting to MongoDB
mongoose.connect("mongodb+srv://x23028xx_db_user:pfOkGSF0wMoCxpbi@cluster0.qushghn.mongodb.net/blogUserDatabase?retryWrites=true&w=majority&appName=Cluster0")
.then(()=>{
    console.log("Success:Connected to MongoDB")
})
.catch((error)=>{
    console.error("Failture:Unconnected to MongoDB");
    console.error(error); // ← これを追加
})

//Defining Schema and Model
const Schema = mongoose.Schema
const BlogSchema= new Schema({
    title: String,
    summary:String,
    image:String,
    textBody:String,
})

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const BlogModel=mongoose.model("Blog",BlogSchema)
const UserModel=mongoose.model("User",UserSchema)

//ブログ機能関連　

//Create a blog
app.get("/blog/create",(req,res)=>{
    if(req.session.userId){
        res.render("blogCreate")
    }
    else{
        res.redirect("/user/login")
    }
})
app.post("/blog/create",(req,res)=>{
    //console.log("reqの中身",req.body)
    BlogModel.create(req.body)
    .then(()=>{
        res.redirect("/")
        //console.log("データの書き込みが成功しました")
        //res.send("ブログデータの投稿が成功しました")
    })
    .catch((error)=>{
        res.render("error",{message:"/blog/createのエラー"})
        // console.log("error")
        // console.log("データの書き込みが失敗しました")
        // res.send("ブログデータの投稿が失敗しました")
    })
})

//Read All blogs
app.get("/",async(req,res)=>{
    //const test="テストデータ"
    //console.log("testの中身：",test)
    const allBlogs = await BlogModel.find()//データベースからブログデータを取得中
    //console.log("reqの中身：",req)
    //console.log("allBlogの中身：",allBlogs)//取得、格納が完了
    //res.send("全ブログデータを読み取りました")//ブラウザにメッセージを送信
    res.render("index",{allBlogs: allBlogs,session: req.session.userId})
})

//Update blog
app.get("/blog/update/:id",async(req,res)=>{
    //console.log(req.params.id)
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("ブログが存在しません")
    const singleBlog = await BlogModel.findById(id)
    if(!singleBlog) return res.status(404).send("ブログが存在しません")
    //console.log("singleBlogの中身：",singleBlog)
    //res.send("個別の記事編集ページ")
    res.render("blogUpdate",{singleBlog})
})
app.post("/blog/update/:id",(req,res)=>{
    BlogModel.updateOne({_id: req.params.id},req.body)
    .then(()=>{
        res.redirect("/")
        // console.log("データの編集が成功しました")
        // res.send("ブログデータの編集が成功しました")
    })
    .catch(()=>{
        res.render("error",{message: "/blog/updateのエラー"})
        // console.log("データの編集が失敗しました")
        // res.send("ブログデータの編集が失敗しました")
    })
})

//Delate blog
app.get("/blog/delete/:id",async(req,res)=>{
    //console.log(req.params.id)
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("ブログが存在しません")
    const singleBlog = await BlogModel.findById(id)
    if(!singleBlog) return res.status(404).send("ブログが存在しません")
    //console.log("singleBlogの中身：",singleBlog)
    // res.send("個別の記事削除ページ")
    res.render("blogdelete",{singleBlog})
})
app.post("/blog/delete/:id",(req,res)=>{
    BlogModel.deleteOne({_id: req.params.id},req.body)
    .then(()=>{
        res.redirect("/")
        // console.log("データの削除が成功しました")
        // res.send("ブログデータの削除が成功しました")
    })
    .catch(()=>{
         res.render("error",{message: "/blog/deleteのエラー"})
        // console.log("データの削除が失敗しました")
        // res.send("ブログデータの削除が失敗しました")
    })
})

//Read Single blog (必ず固定パスの後に)
app.get("/blog/:id",async(req,res)=>{
    //console.log(req.params.id)
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("ブログが存在しません")
    const singleBlog = await BlogModel.findById(id)
    if(!singleBlog) return res.status(404).send("ブログが存在しません")
    //console.log("singleBlogの中身：",singleBlog)
    //res.send("個別の記事ページ")
    res.render("blogRead",{singleBlog: singleBlog,session: req.session.userId})
})

//ユーザー関係機能
//Create user
app.get("/user/create",(req,res)=>{
    res.render("userCreate")
})
app.post("/user/create",(req,res)=>{
    UserModel.create(req.body)
    .then(()=>{
        res.redirect("/user/login")
        // console.log("ユーザーデータの書き込みが成功しました")
        // res.send("ユーザーデータの登録が成功しました")
    })
    .catch(()=>{
        res.render("error",{message: "/blog/createのエラー"})
        // console.log("ユーザーデータの書き込みが失敗しました")
        // res.send("ユーザーデータの登録が失敗しました")
    })
})
//Login
app.get("/user/login",(req,res)=>{
    res.render("login")
})
app.post("/user/login",(req,res)=>{
    UserModel.findOne({email: req.body.email})
    .then((savedDate)=>{
        if(savedDate){
            if(req.body.password==savedDate.password){
                req.session.userId = savedDate._id.toString()
                //res.send("ログイン成功です")
                res.redirect("/")
            }else{
                //res.send("パスワードが間違っています")
                res.render("error",{message: "/blog/loginのエラー:パスワードが間違っています"})
            }
            //res.send("ユーザーは存在しています")
        }
        else{
            res.render("error",{message: "/blog/loginのエラー:パユーザーが存在していません"})
            //res.send("ユーザーは存在していません")
        }
       // console.log(savedDate)
        //res.send("ユーザーは存在しています")
    })
    .catch(()=>{
        //res.send("エラーが発生しました")
        res.render("error",{message: "/blog/loginのエラー:エラーが発生しました"})
    })
})

//Connecting to port
app.listen(3000,()=>{
    console.log("Listening on localhost port 3000")
})
