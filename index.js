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
    console.error(error); 
})

//Defining Schema and Model
const Schema = mongoose.Schema

// ChatSchemaをアカウント参照に変更
const ChatSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

const AccountSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    }
})

const ChatModel = mongoose.model("Chat", ChatSchema)
const AccountModel = mongoose.model("Account", AccountSchema)

//チャット機能関連
//Create a chat
app.get("/chat/create",(req,res)=>{
    if(req.session.userId){
        res.render("chatCreate")
    } else {
        res.redirect("/account/login")
    }
})
app.post("/chat/create",(req,res)=>{
    if(!req.session.userId) return res.redirect("/account/login");

    ChatModel.create({
        userId: req.session.userId,
        message: req.body.message
    })
    .then(()=>{
        res.redirect("/")
    })
    .catch((error)=>{
        res.render("error",{message:"/chat/createのエラー"})
    })
})

// Read All chats
app.get("/", async(req,res)=>{
    const allChats = await ChatModel.find()
        .populate("userId") // userIdからアカウント情報を取得
        .sort({ createdAt: 1 });

    res.render("index",{allChats: allChats, session: req.session.userId})
})

//Update chat
app.get("/chat/update/:id", async(req,res)=>{
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("チャットが存在しません")
    const singleChat = await ChatModel.findById(id)
    if(!singleChat) return res.status(404).send("チャットが存在しません")
    res.render("chatUpdate",{singleChat})
})
app.post("/chat/update/:id",(req,res)=>{
    ChatModel.updateOne({_id: req.params.id}, req.body)
    .then(()=> res.redirect("/"))
    .catch(()=> res.render("error",{message: "/chat/updateのエラー"}))
})

//Delete chat
app.get("/chat/delete/:id", async(req,res)=>{
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("チャットが存在しません")
    const singleChat = await ChatModel.findById(id)
    if(!singleChat) return res.status(404).send("チャットが存在しません")
    res.render("chatdelete",{singleChat})
})
app.post("/chat/delete/:id",(req,res)=>{
    ChatModel.deleteOne({_id: req.params.id}, req.body)
    .then(()=> res.redirect("/"))
    .catch(()=> res.render("error",{message: "/chat/deleteのエラー"}))
})

//Read single chat
app.get("/chat/:id", async(req,res)=>{
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("チャットが存在しません")
    const singleChat = await ChatModel.findById(id).populate("userId")
    if(!singleChat) return res.status(404).send("チャットが存在しません")
    res.render("chatRead",{singleChat: singleChat, session: req.session.userId})
})

//アカウント関係機能
app.get("/account/create",(req,res)=>{ res.render("accountCreate") })
app.post("/account/create",(req,res)=>{
    AccountModel.create(req.body)
    .then(()=> res.redirect("/account/login"))
    .catch(()=> res.render("error",{message: "/account/createのエラー"}))
})

app.get("/account/login",(req,res)=>{ res.render("login") })
app.post("/account/login",(req,res)=>{
    AccountModel.findOne({name: req.body.name})
    .then((savedData)=>{
        if(savedData){
            if(req.body.password === savedData.password){
                req.session.userId = savedData._id.toString()
                res.redirect("/")
            } else {
                res.render("error",{message: "/account/loginのエラー:パスワードが間違っています"})
            }
        } else {
            res.render("error",{message: "/account/loginのエラー:ユーザーが存在していません"})
        }
    })
    .catch(()=> res.render("error",{message: "/account/loginのエラー:エラーが発生しました"}))
})

//Connecting to port
app.listen(3000,()=>{ console.log("Listening on localhost port 3000") })
//