const http = require("http");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const html = `
<!DOCTYPE html>
<html>
<head>
<title>Ubuntu 20.04 Web Terminal</title>
<style>
body{
background:#111;
color:#0f0;
font-family:monospace;
margin:0;
padding:0;
}
#terminal{
height:90vh;
overflow:auto;
padding:10px;
white-space:pre-wrap;
}
#cmd{
width:100%;
height:40px;
background:#000;
color:#0f0;
border:none;
padding:10px;
font-family:monospace;
}
</style>
</head>
<body>
<div id="terminal"></div>
<input id="cmd" placeholder="command">
<script>
const term=document.getElementById("terminal");
const cmd=document.getElementById("cmd");

const proto=location.protocol==="https:"?"wss":"ws";
const ws=new WebSocket(proto+"://"+location.host);

ws.onmessage=(e)=>{
term.textContent+=e.data;
term.scrollTop=term.scrollHeight;
};

cmd.addEventListener("keydown",(e)=>{
if(e.key==="Enter"){
ws.send(cmd.value+"\\n");
cmd.value="";
}
});
</script>
</body>
</html>
`;

const server = http.createServer((req,res)=>{
res.writeHead(200,{"Content-Type":"text/html"});
res.end(html);
});

const wss = new WebSocket.Server({server});

wss.on("connection",(ws)=>{

const shell = spawn("/bin/bash",[],{
env:process.env
});

shell.stdout.on("data",(d)=>{
if(ws.readyState===1){
ws.send(d.toString());
}
});

shell.stderr.on("data",(d)=>{
if(ws.readyState===1){
ws.send(d.toString());
}
});

shell.on("error",(err)=>{
ws.send("ERROR: "+err.message+"\\n");
});

ws.on("message",(msg)=>{
if(shell.stdin.writable){
shell.stdin.write(msg.toString());
}
});

ws.on("close",()=>{
shell.kill();
});

});

server.listen(PORT,()=>{
console.log("Server running on port",PORT);
});