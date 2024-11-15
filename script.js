var gateway = `ws://${window.location.hostname}/ws`;
var websocket;

// Init web socket when the page loads
window.addEventListener('load', onload);

function onload(event) {
    createHistoryCanvas();
    initWebSocket();
}

function getReadings(){
    websocket.send("getReadings");
}

function initWebSocket() {
    console.log('Trying to open a WebSocket connection...');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
}

// When websocket is established, call the getReadings() function
function onOpen(event) {
    console.log('Connection opened');
    // let cse = document.getElementById("connection-status");
    // if (cse) {
    //     cse.style.visibility = "hidden";
    // }
    getReadings();
}

function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
}

var statusTimeout = null;
function updateStatusOk() {
    clearTimeout(statusTimeout);
    let cse = document.getElementById("connection-status");
    if (cse) {
        cse.style.visibility = "hidden";
    }
    statusTimeout = setTimeout(updateStatusErr, 2000);
}

function updateStatusErr() {
    let cse = document.getElementById("connection-status");    
    if (cse) {
        cse.style.visibility = "initial";
    }
}

let lastHistory = { "ptr": 0, "bv": [], "bc": []};

function rgb(r,g,b) {    
    color = "#";
    if (r<0x10) {
        color += "0"
    }
    color += (r).toString(16);
    if (g<0x10) {
        color += "0"
    }
    color += (g).toString(16);
    if (b<0x10) {
        color += "0"
    }
    color += (b).toString(16);
    // console.info("color: "+color);
    return color;
}

function drawHistory(h, c) {
    // var bg_color = 'black';
    var grid_color = rgb(100, 100, 100); //"#e4e4e4";//rgb(96, 96, 96);
    // var grid_current_color = "#e4e4e4";//rgb(96, 96, 96);
    var grid_text_color = rgb(160, 160, 160);

    var voltage_line_color = "green";
    var current_line_color = "red";

    var ctx = c.getContext("2d");
    if (! ctx) {
        return false;
    }
    var hv = h["bv"];
    var hc = h["bc"];
    var ptr = h["ptr"];

    var vmax = Math.ceil((hv.reduce((a, b) => Math.max(a, b), 0))/1000);
    var vmin = Math.floor((hv.reduce((a, b) => Math.min(a, b), 30))/1000);
    if (vmin<0) {
        vmin = 0;
    }

    var cmax = Math.ceil((hc.reduce((a, b) => Math.max(a, b), -30))/1000);
    var cmin = Math.floor((hc.reduce((a, b) => Math.min(a, b), 30))/1000);
    if (cmin<0) {
        cmin = -cmin;
    }

    cmax = Math.max(cmax, cmin);
    cmin = -cmax;
    
    console.log("vmin: "+vmin+" vmax: "+vmax);
    console.log("cmin: "+cmin+" cmax: "+cmax);
        
    var height = c.height;
    var width = c.width;
    var vxstep = width/(hv.length-1);
    var cxstep = width/(hc.length-1);
    // var vscale = height/(15000 - 10000);
    var vscale = height/(vmax - vmin);
    // var cscale = height/(20000);
    var cscale = height/(cmax-cmin);
    
    // ctx.fillStyle = bg_color;
    // ctx.fillRect(0, 0, c.width, c.height);
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.lineWidth = 1;
    ctx.setLineDash([5, 2]);
    ctx.font = "12px Arial";
    ctx.fillStyle = grid_color;
    
    ctx.beginPath();
    // ctx.fillStyle = "#dbfcd7";
    // ctx.fillRect(0, height-Math.floor(3000*vscale), width, Math.floor((3000-2110)*vscale));
    // ctx.fillStyle = 'gray';

    // for (var is=0; is<=5000; is+=1000)
    ctx.fillStyle = grid_text_color;    
    ctx.strokeStyle = grid_color;

    ctx.fillText(vmax+" V / "+cmax+" A",0, 11);
    for (var is=vmin; is<=vmax; is+=1)
    {
        ctx.beginPath();
        ctx.moveTo(0, height-Math.floor(is*vscale)+0.5);
        ctx.lineTo(width, height-Math.floor(is*vscale)+0.5);
        ctx.stroke();
        // ctx.fillText(vmin+" V / "+(is*6/1000-15)+" A", 0, height-Math.floor(is*vscale)-1);        
        ctx.fillText((vmin+is)+" V", 0, height-Math.floor(is*vscale)-1);        
    }
    // vertical grid lines
    ctx.strokeStyle = grid_color; //"#e4e4e4";    
    for (var is=0; is<=(hc.length)/60; is++)
    {
        ctx.beginPath();
        ctx.moveTo((ptr%60)*vxstep+is*vxstep*60, 0);
        ctx.lineTo((ptr%60)*vxstep+is*vxstep*60, height);
        ctx.stroke(); 
    }
    ctx.beginPath();
    ctx.moveTo(0, height/2+0.5);
    ctx.lineTo(width, height/2+0.5);
    ctx.strokeStyle = grid_color;
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(ptr*vxstep, 0);
    ctx.lineTo(ptr*vxstep, height);
    ctx.strokeStyle = grid_text_color;
    ctx.stroke();
    
    // ctx.beginPath();
    // ctx.moveTo(0, height-0.5);
    // ctx.lineTo(width, height-0.5);
    // ctx.strokeStyle = 'gray';
    // ctx.stroke();
    
    // ctx.fillText("10 V / -15 A",1, height-2);
    // ctx.fillText(vmax+" V / "+cmax+" A",0, 10);

    ctx.strokeStyle = voltage_line_color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.moveTo(height,width);
    ctx.stroke();
    
    // ctx.moveTo(0, height-(hv[0]-10000)*vscale);
    var vy0 = hv[0]/1000;
    var vys0 = (hv[0]/1000-vmin)*vscale;
    ctx.moveTo(0, height-vys0);
    for (var hi = 1; hi < hv.length; hi++)
    {
        var vy = hv[hi]/1000;
        var vys = (vy-vmin)*vscale;
        if (hi==ptr) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(vxstep*hi, height-vys);            
        } else {
            ctx.lineTo(vxstep*hi, height-vys);
        }
    }                    
    ctx.stroke();

    ctx.strokeStyle = current_line_color;                                                
    ctx.beginPath();
    ctx.moveTo(0, height/2-hc[0]/1000*cscale);
    for (var hi = 1; hi < hc.length; hi++)
    {
        if (hi==ptr) {
            ctx.stroke();
            ctx.beginPath();                        
            ctx.moveTo(cxstep*hi, height/2-hc[hi]/1000*cscale);
        } else {                        
            ctx.lineTo(cxstep*hi, height/2-hc[hi]/1000*cscale);                        
        }
    }
    ctx.stroke();
    lastHistory = h;
}

function getHistoryCanvasContext() {
    var c = document.getElementById("bth_canvas");
    if (c && c.getContext) {
        return c.getContext('2d');
    }
    return null;
}

function createHistoryCanvas() {
    var c = document.getElementById("bth_canvas");
    var ctx;
    var new_canvas = false;
    if (!c) {
        c = document.createElement('canvas');
        c.id = "bth_canvas";
        c.class = "history_canvas";
        new_canvas = true;                    
    }                
    if (c && c.getContext) {
        ctx = c.getContext('2d');
    }
    if (ctx) {                    
        if (new_canvas) {
            console.info("Creating new canvas");
            var history_container = document.getElementById("history");
            console.info("history continer: "+history_container);
            const resizeObserver = new ResizeObserver(
            (entries) => {
                for (const entry of entries) {
                    let et = entry.target;
                    console.log("Observed element size change");
                    let br = history_container.getBoundingClientRect();
                    console.info("Canvas container size: "+br.height+"x"+br.width);
                    let c = document.getElementById("bth_canvas")
                    c.height = br.height;
                    c.width = br.width;
                    drawHistory(lastHistory, c);
                }
            });
            resizeObserver.observe(history_container);
            var br = history_container.getBoundingClientRect();
            console.info("Canvas container size for new canvas: "+br.height+"x"+br.width);
            history_container.appendChild(c);
            c.height = br.height;
            c.width = br.width;
        }
    }
    return ctx;
}

// Function that receives the message from the ESP32 with the readings
function onMessage(event) {
    updateStatusOk();
    console.log(event.data);
    var jsonData = JSON.parse(event.data);

    if (jsonData.hasOwnProperty("id")) {
        var he = document.getElementById("hostname-val");
        if (he) {
            he.innerHTML = jsonData["id"].toUpperCase();
        }
    }

    if (jsonData.hasOwnProperty("history")) {
        var h = jsonData["history"];
        var c = document.getElementById("bth_canvas");

        var hi = document.getElementById("history_size");
        var hv = h["bv"];
        if (hi && hv) {
            hi.innerHTML = (h["intr"]*hv.length)/3600 + " h";
        }
                
        if (c && c.getContext && c.getContext('2d')) {
            drawHistory(h, c);
        } else {
            console.info("Canvas not available - falling back to span bars");
            if (! document.getElementById("bth_0")) {
                var text = "";//"<span class=\"bar0\">&nbsp;</span>";
                for (var i = 0; i < h.length; i++) {
                    text += "<span id=\"bth_"+i+"\" class=\"bar\">&nbsp;</span>";
                }
                // text += "<span class=\"bar0\">&nbsp;</span>";
                e.innerHTML = text;
            }
            for (var i = 0; i < h.length; i++) {
                var bar = document.getElementById("bth_"+i);
                var v = h[i]/100;
                bar.style.height = v+"px";
                if (v>130) {
                    bar.style["background-color"] = "#3d85c6";
                } else if (v>126) {
                    bar.style["background-color"] = "#6aa84f";
                } else if (v>124) {
                    bar.style["background-color"] = "#e69138";
                } else {
                    bar.style["background-color"] = "#cc0000";
                }
            }
        }
    }

    if (jsonData.hasOwnProperty("scnt")) {
        let cnt = jsonData["scnt"];
        let v = jsonData["v"];
        let c = jsonData["c"];
        let ci = jsonData["ci"];
        let co = jsonData["co"];
        for (let i=0; i<cnt; i++) {
            let cnte = document.getElementById("value-container-"+i);
            if (cnte) {
                cnte.style.visibility = "visible";
                let ve = document.getElementById("voltage-val-"+i);
                if (v && ve) {                
                    ve.innerHTML = v[i].toFixed(3);
                }
                let ce = document.getElementById("current-val-"+i);
                if (c && ce) {                
                    ce.innerHTML = c[i].toFixed(4);
                }
                let pe = document.getElementById("power-val-"+i);
                if (v && c && pe) {
                    pe.innerHTML = (v[i]*c[i]).toFixed(2);
                }
                let cie = document.getElementById("current-in-val-"+i);
                if (ci && cie) {
                    cie.innerHTML = (ci[i]/3600).toFixed(2);
                }
                let coe = document.getElementById("current-out-val-"+i);
                if (co && coe) {
                    coe.innerHTML = (co[i]/3600).toFixed(2);
                }
            }
        }
    }

    if (jsonData.hasOwnProperty("ut")) {
        let ute = document.getElementById("uptime-val");
        if (ute) {
            var ds = jsonData["ut"];
            if (ds<60) {
                ute.innerHTML = "Uptime "+ds+"s";
            } else {
                var minutes = Math.floor(jsonData["ut"]/60);
                ute.innerHTML = "Uptime "+(minutes%(3600*24))+"d "+(minutes%3600)+"h "+(minutes%60)+"m";
            }
        }
    }

    // var keys = Object.keys(jsonData);
    // var batt_current = 0;
    // var batt_volts = 0;

    // for (var i = 0; i < keys.length; i++){
    //     var key = keys[i];
    //     var e = document.getElementById(key);
    //     if (e) {
    //         if (key == "ut") {
    //             var d = Math.floor(jsonData[key]);
    //             e.innerHTML = "Uptime "+Math.floor(d/(60*24))+"d "+Math.floor(d/60)+"h "+(d%60)+"m";
    //         } 
    //         else if (key == "history") {                
    //           // already processed              
    //         } 
    //         else if (key == "batt_current_in") {       
    //             e.innerHTML = (jsonData[key]/360000.0).toFixed(3);
    //         } 
    //         else if (key == "batt_current_out") {   
    //             e.innerHTML = (jsonData[key]/360000.0).toFixed(3);    
    //         }
    //         else if (typeof(jsonData[key]) == "number") {
    //             if (key == "batt_current") {
    //                 batt_current = jsonData[key];
    //                 e.innerHTML = (batt_current).toFixed(4);
    //             } else if (key == "batt_volts") {
    //                 batt_volts = jsonData[key];
    //                 e.innerHTML = (batt_volts).toFixed(3);
    //             } else {
    //                 e.innerHTML = jsonData[key].toFixed(4);
    //             }
    //         } else {
    //             e.innerHTML = jsonData[key];
    //         }
    //     }
    // }
    
    // var e = document.getElementById("batt_power");
    // if (e) {
    //     e.innerHTML = (batt_current*batt_volts).toFixed(3);
    // }

}
